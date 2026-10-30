// Achadinhos automáticos: a cada X minutos pega o próximo produto da fila,
// a IA escreve o post e o robô envia no grupo de WhatsApp escolhido.
const db = require('./db');
const sub = require('./subscription');
const wa = require('./whatsapp');
const { generateDealMessage } = require('./ai');

const MIN_INTERVAL = 10; // minutos — menos que isso aumenta muito o risco de bloqueio

function getConfig(userId) {
  let c = db.prepare('SELECT * FROM deals_config WHERE user_id = ?').get(userId);
  if (!c) {
    db.prepare('INSERT INTO deals_config (user_id) VALUES (?)').run(userId);
    c = db.prepare('SELECT * FROM deals_config WHERE user_id = ?').get(userId);
  }
  return c;
}

function saveConfig(userId, b) {
  getConfig(userId);
  const time = (v, d) => (/^\d{2}:\d{2}$/.test(v) ? v : d);
  const jid = String(b.group_jid || '');
  db.prepare(`UPDATE deals_config SET enabled = ?, group_jid = ?, group_name = ?, interval_min = ?,
      hours_start = ?, hours_end = ?, repeat_queue = ? WHERE user_id = ?`).run(
    b.enabled ? 1 : 0,
    jid.endsWith('@g.us') ? jid : '',
    String(b.group_name || '').slice(0, 120),
    Math.max(MIN_INTERVAL, Math.min(24 * 60, Math.round(Number(b.interval_min) || 40))),
    time(b.hours_start, '08:00'),
    time(b.hours_end, '22:00'),
    b.repeat_queue ? 1 : 0,
    userId,
  );
  return getConfig(userId);
}

function list(userId) {
  return db.prepare(`SELECT * FROM deals WHERE user_id = ?
      ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'error' THEN 1 ELSE 2 END, id`).all(userId);
}

function add(userId, b) {
  const link = String(b.link || '').trim();
  const title = String(b.title || '').trim().slice(0, 200);
  if (!/^https?:\/\/\S+$/.test(link)) throw new Error('Cole um link válido (começando com https://)');
  if (!title) throw new Error('Informe o nome do produto');
  const image = String(b.image_url || '').trim();
  const result = db.prepare(`INSERT INTO deals (user_id, link, title, price, notes, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    userId, link.slice(0, 500), title, String(b.price || '').trim().slice(0, 40),
    String(b.notes || '').trim().slice(0, 1000), /^https?:\/\/\S+$/.test(image) ? image.slice(0, 500) : '', Date.now(),
  );
  return get(userId, Number(result.lastInsertRowid));
}

function get(userId, id) {
  return db.prepare('SELECT * FROM deals WHERE user_id = ? AND id = ?').get(userId, id);
}

function remove(userId, id) {
  db.prepare('DELETE FROM deals WHERE user_id = ? AND id = ?').run(userId, id);
}

// Gera (ou reaproveita) o texto do post. force = gerar um texto novo.
async function preview(userId, id, force = false) {
  const deal = get(userId, id);
  if (!deal) throw new Error('Achadinho não encontrado');
  if (deal.message && !force) return deal.message;
  const user = sub.getUser(userId);
  const message = await generateDealMessage({ plan: user.plan, settings: wa.getSettings(userId), deal });
  db.prepare('UPDATE deals SET message = ? WHERE id = ?').run(message, id);
  return message;
}

function saveMessage(userId, id, message) {
  db.prepare('UPDATE deals SET message = ? WHERE user_id = ? AND id = ?').run(String(message).slice(0, 4000), userId, id);
}

async function sendDeal(userId, id) {
  const config = getConfig(userId);
  if (!config.group_jid) throw new Error('Escolha o grupo antes de enviar');
  const deal = get(userId, id);
  if (!deal) throw new Error('Achadinho não encontrado');
  try {
    const message = await preview(userId, id);
    await wa.sendToGroup(userId, config.group_jid, message, deal.image_url);
    db.prepare(`UPDATE deals SET status = 'sent', error = '', sent_count = sent_count + 1, sent_at = ? WHERE id = ?`)
      .run(Date.now(), id);
    db.prepare('UPDATE deals_config SET last_sent_at = ? WHERE user_id = ?').run(Date.now(), userId);
    console.log(`[achadinhos] usuário ${userId} enviou "${deal.title}" para ${config.group_name || config.group_jid}`);
  } catch (e) {
    db.prepare(`UPDATE deals SET status = 'error', error = ? WHERE id = ?`).run(e.message.slice(0, 300), id);
    throw e;
  }
}

function nextDeal(userId, config) {
  // Primeiro os da fila; depois tenta de novo os que deram erro.
  const pick = () => db.prepare(`SELECT id FROM deals WHERE user_id = ? AND status IN ('pending', 'error')
      ORDER BY status = 'error', id LIMIT 1`).get(userId);
  let deal = pick();
  if (!deal && config.repeat_queue) {
    // Fila acabou: volta tudo para a fila e recomeça do primeiro.
    db.prepare(`UPDATE deals SET status = 'pending' WHERE user_id = ? AND status = 'sent'`).run(userId);
    deal = pick();
  }
  return deal;
}

const busy = new Set();

async function tick() {
  const configs = db.prepare(`SELECT * FROM deals_config WHERE enabled = 1 AND group_jid != ''`).all();
  for (const config of configs) {
    const userId = config.user_id;
    if (busy.has(userId)) continue;
    if (Date.now() - config.last_sent_at < config.interval_min * 60_000) continue;
    if (!wa.withinHours(config.hours_start, config.hours_end)) continue;
    if (!sub.isActive(sub.getUser(userId)) || wa.status(userId).state !== 'connected') continue;
    const deal = nextDeal(userId, config);
    if (!deal) continue;

    busy.add(userId);
    sendDeal(userId, deal.id)
      .catch((e) => {
        console.error(`[achadinhos] usuário ${userId}:`, e.message);
        // Não tenta de novo em seguida: espera o próximo intervalo.
        db.prepare('UPDATE deals_config SET last_sent_at = ? WHERE user_id = ?').run(Date.now(), userId);
      })
      .finally(() => busy.delete(userId));
  }
}

function startScheduler() {
  setInterval(() => tick().catch((e) => console.error('[achadinhos]', e.message)), 60_000).unref();
}

module.exports = { getConfig, saveConfig, list, add, remove, preview, saveMessage, sendDeal, startScheduler, MIN_INTERVAL };
