// Conexão com o WhatsApp de cada cliente (via QR Code, igual ao WhatsApp Web).
const fs = require('node:fs');
const path = require('node:path');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const db = require('./db');
const config = require('./config');
const { PLANS } = require('./plans');
const sub = require('./subscription');
const { generateReply } = require('./ai');

const logger = pino({ level: 'silent' });
const sessionsDir = path.join(config.dataDir, 'sessions');
const bots = new Map(); // userId -> { sock, state, qr, sentIds, queues, offHoursSent }

const sessionPath = (userId) => path.join(sessionsDir, String(userId));
const HOUR = 60 * 60 * 1000;

function getSettings(userId) {
  let s = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  if (!s) {
    db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId);
    s = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
  }
  return s;
}

function status(userId) {
  const bot = bots.get(userId);
  if (!bot) return { state: fs.existsSync(sessionPath(userId)) ? 'stopped' : 'disconnected' };
  return { state: bot.state, qr: bot.qr || null, pairingCode: bot.pairingCode || null, pairError: bot.pairError || null, number: bot.number || null };
}

// phone: se informado, conecta por código de 8 dígitos (sem QR Code) — ideal no celular.
async function start(userId, phone) {
  if (!sub.isActive(sub.getUser(userId))) throw new Error('Assinatura inativa');
  const existing = bots.get(userId);
  if (existing && existing.state !== 'closed') {
    if (!phone || existing.state === 'connected') return status(userId);
    await stop(userId); // troca de QR Code para código de pareamento
    return start(userId, phone);
  }

  fs.mkdirSync(sessionPath(userId), { recursive: true });
  const { state: auth, saveCreds } = await useMultiFileAuthState(sessionPath(userId));
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

  const sock = makeWASocket({ auth, logger, version, printQRInTerminal: false, browser: ['ZapVendas IA', 'Chrome', '1.0'] });
  const bot = existing || { sentIds: new Set(), queues: new Map(), offHoursSent: new Map() };
  Object.assign(bot, { sock, state: 'connecting', qr: null, pairingCode: null });
  if (phone) {
    bot.pairPhone = phone;
    bot.pairError = null;
  }
  bots.set(userId, bot);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (bots.get(userId)?.sock !== sock) return;
    if (qr && bot.pairPhone) {
      if (!bot.pairingCode) {
        bot.state = 'pairing';
        bot.pairingCode = 'gerando';
        bot.pairError = null;
        try {
          bot.pairingCode = await sock.requestPairingCode(bot.pairPhone);
        } catch (e) {
          console.error('[wa] código de pareamento:', e.message);
          bot.pairError = e.message;
          bot.pairingCode = null;
          bot.pairPhone = null;
        }
      }
    } else if (qr) {
      bot.state = 'qr';
      bot.qr = await QRCode.toDataURL(qr);
    }
    if (connection === 'open') {
      bot.state = 'connected';
      bot.qr = null;
      bot.pairingCode = null;
      bot.pairPhone = null;
      bot.number = (sock.user?.id || '').split(':')[0].split('@')[0];
      console.log(`[wa] usuário ${userId} conectado (${bot.number})`);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      bot.state = 'closed';
      if (code === DisconnectReason.loggedOut) {
        console.log(`[wa] usuário ${userId} desconectou o WhatsApp`);
        fs.rmSync(sessionPath(userId), { recursive: true, force: true });
        bots.delete(userId);
      } else if (bot.stopping) {
        bots.delete(userId);
      } else if (sub.isActive(sub.getUser(userId))) {
        setTimeout(() => start(userId).catch((e) => console.error('[wa] reconectar:', e.message)), 3000);
      } else {
        bots.delete(userId);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    for (const msg of messages) {
      handleMessage(userId, bot, msg, type).catch((e) => console.error(`[wa] erro usuário ${userId}:`, e.message));
    }
  });

  return status(userId);
}

async function stop(userId) {
  const bot = bots.get(userId);
  if (!bot) return;
  bot.stopping = true;
  try { bot.sock.end(undefined); } catch {}
  bots.delete(userId);
}

async function logout(userId) {
  const bot = bots.get(userId);
  if (bot) {
    bot.stopping = true;
    try { await bot.sock.logout(); } catch {}
    bots.delete(userId);
  }
  fs.rmSync(sessionPath(userId), { recursive: true, force: true });
}

function extractText(message) {
  const m = message?.ephemeralMessage?.message || message;
  return (
    m?.conversation ||
    m?.extendedTextMessage?.text ||
    m?.imageMessage?.caption ||
    m?.videoMessage?.caption ||
    ''
  ).trim();
}

function isPrivateChat(jid) {
  return jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid'));
}

function isPaused(userId, contact) {
  const row = db.prepare('SELECT until FROM paused WHERE user_id = ? AND contact = ?').get(userId, contact);
  return row && row.until > Date.now();
}

function pause(userId, contact, ms) {
  db.prepare(`INSERT INTO paused (user_id, contact, until) VALUES (?, ?, ?)
              ON CONFLICT(user_id, contact) DO UPDATE SET until = excluded.until`).run(userId, contact, Date.now() + ms);
}

function saveMessage(userId, contact, role, content) {
  db.prepare('INSERT INTO messages (user_id, contact, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(userId, contact, role, content, Date.now());
}

// Horário de Brasília. days: "0,1,...,6" (0 = domingo).
function withinHours(start, end, days = '0,1,2,3,4,5,6') {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const now = `${parts.hour}:${parts.minute}`;
  return days.split(',').map(Number).includes(day) && now >= start && now < end;
}

const withinBusinessHours = (s) => withinHours(s.hours_start, s.hours_end, s.hours_days);

async function send(bot, jid, text) {
  const sent = await bot.sock.sendMessage(jid, { text });
  if (sent?.key?.id) bot.sentIds.add(sent.key.id);
  if (bot.sentIds.size > 500) bot.sentIds.delete(bot.sentIds.values().next().value);
}

async function handleMessage(userId, bot, msg, type) {
  const jid = msg.key.remoteJid;
  if (!isPrivateChat(jid) || !msg.message) return;
  const user = sub.getUser(userId);
  const plan = PLANS[user?.plan];

  // Mensagem enviada por você mesmo pelo celular: a IA dá um tempo nesse cliente.
  if (msg.key.fromMe) {
    if (bot.sentIds.has(msg.key.id)) return; // foi a própria IA que mandou
    const text = extractText(msg.message);
    if (plan?.humanTakeover) pause(userId, jid, 2 * HOUR);
    if (text) saveMessage(userId, jid, 'owner', text);
    return;
  }
  if (type !== 'notify') return;

  // Assinatura venceu? O robô para de funcionar.
  if (!sub.isActive(user)) {
    await stop(userId);
    return;
  }

  const text = extractText(msg.message);
  if (!text) return;

  // Uma mensagem por vez por cliente, na ordem em que chegaram.
  const previous = bot.queues.get(jid) || Promise.resolve();
  const next = previous.then(() => reply(userId, bot, user, plan, jid, text)).catch((e) => console.error('[wa]', e.message));
  bot.queues.set(jid, next);
  await next;
  if (bot.queues.get(jid) === next) bot.queues.delete(jid);
}

async function reply(userId, bot, user, plan, jid, text) {
  const settings = getSettings(userId);
  saveMessage(userId, jid, 'user', text);
  if (!settings.bot_enabled || isPaused(userId, jid)) return;

  if (plan.businessHours && settings.hours_enabled && !withinBusinessHours(settings)) {
    const last = bot.offHoursSent.get(jid) || 0;
    if (Date.now() - last > 6 * HOUR) {
      bot.offHoursSent.set(jid, Date.now());
      await send(bot, jid, settings.off_hours_message);
    }
    return;
  }

  if (!sub.hasQuota(user)) return; // acabou o limite de respostas do mês

  const history = db.prepare(`SELECT role, content FROM messages
      WHERE user_id = ? AND contact = ? AND role IN ('user', 'assistant', 'owner')
      ORDER BY id DESC LIMIT ?`).all(userId, jid, plan.memory).reverse();

  await bot.sock.sendPresenceUpdate('composing', jid).catch(() => {});
  let answer = await generateReply({ plan: user.plan, settings, history });
  await bot.sock.sendPresenceUpdate('paused', jid).catch(() => {});
  if (!answer) return;

  let handoff = false;
  if (answer.includes('[ATENDENTE]')) {
    handoff = true;
    answer = answer.replace(/\[ATENDENTE\]/g, '').trim();
  }

  await send(bot, jid, answer);
  saveMessage(userId, jid, 'assistant', answer);
  sub.addUsage(userId);

  if (handoff && plan.handoffKeyword) {
    pause(userId, jid, 24 * HOUR);
    const owner = settings.owner_phone.replace(/\D/g, '');
    if (owner) {
      const who = jid.split('@')[0];
      await send(bot, `${owner}@s.whatsapp.net`,
        `🔔 *Cliente pedindo atendente*\nContato: ${who}\nÚltima mensagem: "${text}"\n\nA IA pausou essa conversa por 24h.`);
    }
  }
}

function connectedBot(userId) {
  const bot = bots.get(userId);
  if (!bot || bot.state !== 'connected') throw new Error('WhatsApp não está conectado');
  return bot;
}

// Grupos de que o número conectado participa (para escolher onde postar os achadinhos).
async function listGroups(userId) {
  const groups = await connectedBot(userId).sock.groupFetchAllParticipating();
  return Object.values(groups)
    .map((g) => ({ jid: g.id, name: g.subject || g.id, size: g.participants?.length || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

// Envia num grupo. Com imagem, o texto vai como legenda; se a imagem falhar, manda só o texto.
async function sendToGroup(userId, jid, text, imageUrl) {
  if (!jid.endsWith('@g.us')) throw new Error('Grupo inválido');
  const bot = connectedBot(userId);
  if (imageUrl) {
    try {
      const sent = await bot.sock.sendMessage(jid, { image: { url: imageUrl }, caption: text });
      if (sent?.key?.id) bot.sentIds.add(sent.key.id);
      return;
    } catch (e) {
      console.warn(`[achadinhos] imagem falhou (${e.message}), enviando só o texto`);
    }
  }
  await send(bot, jid, text);
}

// Ao ligar o servidor: reconecta quem está com assinatura em dia.
async function restoreAll() {
  if (!fs.existsSync(sessionsDir)) return;
  for (const dir of fs.readdirSync(sessionsDir)) {
    const userId = Number(dir);
    if (sub.isActive(sub.getUser(userId))) {
      await start(userId).catch((e) => console.error(`[wa] restaurar ${userId}:`, e.message));
    }
  }
}

// A cada 5 minutos: desliga o robô de quem parou de pagar.
function startBillingWatcher() {
  setInterval(() => {
    for (const userId of bots.keys()) {
      if (!sub.isActive(sub.getUser(userId))) {
        console.log(`[assinatura] usuário ${userId} sem pagamento — robô desligado`);
        stop(userId);
      }
    }
  }, 5 * 60 * 1000).unref();
}

module.exports = {
  start, stop, logout, status, restoreAll, startBillingWatcher, getSettings, listGroups, sendToGroup, withinHours,
};
