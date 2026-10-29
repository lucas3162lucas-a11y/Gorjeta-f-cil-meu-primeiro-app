const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');

const config = require('./config');
const db = require('./db');
const { PLANS } = require('./plans');
const sub = require('./subscription');
const wa = require('./whatsapp');
const { webhookHandler } = require('./cakto');

const app = express();
app.set('trust proxy', 1);

// O webhook precisa do corpo cru para conferir a assinatura da Cakto.
app.post('/webhook/cakto', express.raw({ type: '*/*', limit: '1mb' }), webhookHandler);

app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// ---------- Login ----------
const SESSION_DAYS = 30;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

function readCookie(req, name) {
  const match = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, Date.now() + SESSION_DAYS * sub.DAY);
  const secure = config.publicUrl.startsWith('https') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}

function auth(req, res, next) {
  const token = readCookie(req, 'sid');
  const session = token && db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?').get(token, Date.now());
  if (!session) return res.status(401).json({ error: 'Faça login' });
  req.user = sub.getUser(session.user_id);
  if (!req.user) return res.status(401).json({ error: 'Faça login' });
  next();
}

function adminOnly(req, res, next) {
  if (!config.adminEmail || req.user.email !== config.adminEmail) return res.status(403).json({ error: 'Apenas admin' });
  next();
}

const attempts = new Map();
function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (list.length >= 20) return res.status(429).json({ error: 'Muitas tentativas, aguarde alguns minutos' });
  list.push(now);
  attempts.set(key, list);
  next();
}

app.post('/api/cadastro', rateLimit, (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    return res.status(400).json({ error: 'Preencha nome, e-mail válido e senha com 6+ caracteres' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(400).json({ error: 'Este e-mail já tem conta. Faça login.' });
  }
  const plan = PLANS[req.body.plan] ? req.body.plan : null;
  const result = db.prepare(`INSERT INTO users (email, name, password_hash, callback_token, plan, created_at)
                             VALUES (?, ?, ?, ?, ?, ?)`)
    .run(email, name, hashPassword(password), crypto.randomBytes(12).toString('hex'), plan, Date.now());
  createSession(res, Number(result.lastInsertRowid));
  res.json({ ok: true });
});

app.post('/api/login', rateLimit, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !checkPassword(String(req.body.password || ''), user.password_hash)) {
    return res.status(400).json({ error: 'E-mail ou senha incorretos' });
  }
  createSession(res, user.id);
  res.json({ ok: true });
});

app.post('/api/sair', (req, res) => {
  const token = readCookie(req, 'sid');
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  res.json({ ok: true });
});

// ---------- Planos e checkout ----------
app.get('/api/planos', (req, res) => {
  res.json({ appName: config.appName, plans: Object.values(PLANS) });
});

function checkoutUrl(user, plan) {
  const base = config.cakto.checkout[plan];
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set('callback', user.callback_token); // a Cakto devolve isso no webhook
  url.searchParams.set('email', user.email);
  url.searchParams.set('name', user.name);
  return url.toString();
}

// ---------- Painel do cliente ----------
app.get('/api/eu', auth, (req, res) => {
  const u = req.user;
  const plan = PLANS[u.plan];
  const settings = wa.getSettings(u.id);
  delete settings.nvidia_key;
  res.json({
    name: u.name,
    email: u.email,
    isAdmin: !!config.adminEmail && u.email === config.adminEmail,
    plan: plan ? { id: plan.id, name: plan.name, price: plan.price, monthlyReplies: plan.monthlyReplies } : null,
    planFeatures: plan || null,
    status: u.status,
    active: sub.isActive(u),
    paidUntil: u.paid_until,
    usage: sub.getUsage(u.id),
    checkout: Object.fromEntries(Object.keys(PLANS).map((p) => [p, checkoutUrl(u, p)])),
    settings,
    whatsapp: wa.status(u.id),
  });
});

app.post('/api/config', auth, (req, res) => {
  const plan = PLANS[req.user.plan] || PLANS.simple;
  const b = req.body;
  const str = (v, max = 5000) => String(v ?? '').slice(0, max);
  const time = (v, d) => (/^\d{2}:\d{2}$/.test(v) ? v : d);
  wa.getSettings(req.user.id);
  db.prepare(`UPDATE settings SET bot_enabled = ?, business_name = ?, about = ?, tone = ?,
      catalog = ?, hours_enabled = ?, hours_start = ?, hours_end = ?, hours_days = ?, off_hours_message = ?,
      owner_phone = ? WHERE user_id = ?`).run(
    b.bot_enabled ? 1 : 0,
    str(b.business_name, 120),
    str(b.about),
    str(b.tone, 100) || 'simpático e direto',
    plan.catalog ? str(b.catalog, 10000) : '',
    plan.businessHours && b.hours_enabled ? 1 : 0,
    time(b.hours_start, '08:00'),
    time(b.hours_end, '18:00'),
    String(b.hours_days || '1,2,3,4,5').replace(/[^0-6,]/g, '') || '1,2,3,4,5',
    str(b.off_hours_message, 500),
    plan.handoffKeyword ? str(b.owner_phone, 20).replace(/\D/g, '') : '',
    req.user.id,
  );
  res.json({ ok: true });
});

app.post('/api/whatsapp/conectar', auth, async (req, res) => {
  if (!sub.isActive(req.user)) return res.status(402).json({ error: 'Assine um plano para conectar o WhatsApp' });
  try {
    const phone = String(req.body?.phone || '').replace(/\D/g, '');
    if (phone && (phone.length < 12 || phone.length > 13)) {
      return res.status(400).json({ error: 'Número com DDI + DDD, ex.: 5511999999999' });
    }
    res.json(await wa.start(req.user.id, phone || undefined));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/whatsapp/status', auth, (req, res) => res.json(wa.status(req.user.id)));

app.post('/api/whatsapp/desconectar', auth, async (req, res) => {
  await wa.logout(req.user.id);
  res.json({ ok: true });
});

app.get('/api/conversas', auth, (req, res) => {
  if (!PLANS[req.user.plan]?.history) return res.status(403).json({ error: 'Disponível no plano Pro' });
  const contacts = db.prepare(`SELECT contact, MAX(id) AS last_id, COUNT(*) AS total FROM messages
      WHERE user_id = ? GROUP BY contact ORDER BY last_id DESC LIMIT 50`).all(req.user.id);
  res.json(contacts.map((c) => ({
    contact: c.contact,
    total: c.total,
    messages: db.prepare(`SELECT role, content, created_at FROM messages WHERE user_id = ? AND contact = ?
        ORDER BY id DESC LIMIT 30`).all(req.user.id, c.contact).reverse(),
  })));
});

// ---------- Admin (você) ----------
app.get('/api/admin/clientes', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, name, email, plan, status, paid_until, created_at FROM users ORDER BY id DESC').all();
  const active = users.filter((u) => sub.isActive(sub.getUser(u.id)));
  const mrr = active.reduce((sum, u) => sum + (PLANS[u.plan]?.price || 0), 0);
  res.json({
    mrr,
    activeCount: active.length,
    users: users.map((u) => ({ ...u, active: sub.isActive(sub.getUser(u.id)), usage: sub.getUsage(u.id), whatsapp: wa.status(u.id).state })),
  });
});

// Liberar manualmente (ex.: cliente pagou por Pix direto pra você)
app.post('/api/admin/liberar', auth, adminOnly, (req, res) => {
  const { userId, plan } = req.body;
  if (!PLANS[plan] || !sub.getUser(userId)) return res.status(400).json({ error: 'Dados inválidos' });
  const until = sub.renew(userId, plan);
  res.json({ ok: true, paidUntil: until });
});

app.post('/api/admin/bloquear', auth, adminOnly, async (req, res) => {
  if (!sub.getUser(req.body.userId)) return res.status(400).json({ error: 'Cliente não encontrado' });
  sub.block(req.body.userId);
  await wa.stop(req.body.userId);
  res.json({ ok: true });
});

app.listen(config.port, async () => {
  console.log(`${config.appName} rodando em ${config.publicUrl} (porta ${config.port})`);
  if (!config.nvidia.apiKey) console.warn('⚠️  NVIDIA_API_KEY não configurada no .env');
  if (!config.cakto.webhookSecret) console.warn('⚠️  CAKTO_WEBHOOK_SECRET não configurado no .env');
  wa.startBillingWatcher();
  await wa.restoreAll();
});
