// Webhook da Cakto: liga, renova e desliga a assinatura automaticamente.
const crypto = require('node:crypto');
const db = require('./db');
const config = require('./config');
const { PLANS } = require('./plans');
const sub = require('./subscription');
const wa = require('./whatsapp');

const RENEW_EVENTS = ['purchase_approved', 'subscription_renewed', 'subscription_late_recovered', 'subscription_resumed'];
const BLOCK_EVENTS = ['refund', 'chargeback', 'subscription_paused'];
const CANCEL_EVENTS = ['subscription_canceled'];
// subscription_late / subscription_renewal_refused: não fazemos nada — sem pagamento
// novo o vencimento chega e o robô desliga sozinho.

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function isFromCakto(rawBody, headers, body) {
  const secret = config.cakto.webhookSecret;
  if (!secret) return false;
  const timestamp = headers['x-cakto-timestamp'];
  const signature = headers['x-cakto-signature'];
  if (timestamp && signature) {
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
    return signature.split(',').some((s) => safeEqual(s.trim(), `v1=${expected}`));
  }
  return safeEqual(body?.secret || '', secret);
}

function offerIdFromUrl(url) {
  return (url || '').split('?')[0].split('/').filter(Boolean).pop();
}

function detectPlan(data) {
  const offerId = data.offer?.id;
  for (const [plan, url] of Object.entries(config.cakto.checkout)) {
    if (offerId && offerIdFromUrl(url) === offerId) return plan;
  }
  const price = Number(data.offer?.price ?? data.baseAmount ?? data.amount);
  return Object.values(PLANS).find((p) => Math.abs(p.price - price) < 0.01)?.id || null;
}

function findUser(data) {
  if (data.callback) {
    const u = db.prepare('SELECT * FROM users WHERE callback_token = ?').get(data.callback);
    if (u) return u;
  }
  const email = (data.customer?.email || '').toLowerCase();
  return email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) : null;
}

function handleEvent(event, data) {
  const user = findUser(data);
  const plan = detectPlan(data);
  db.prepare('INSERT INTO payments (user_id, event, plan, amount, email, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user?.id ?? null, event, plan, Number(data.amount) || null, data.customer?.email || null, Date.now());

  if (!user) {
    console.warn(`[cakto] ${event}: nenhum usuário encontrado para ${data.customer?.email}`);
    return;
  }

  if (RENEW_EVENTS.includes(event) && (data.status === 'paid' || event !== 'purchase_approved')) {
    const paidAt = data.paidAt ? Date.parse(data.paidAt) : Date.now();
    const until = sub.renew(user.id, plan || user.plan || 'simple', Math.min(paidAt || Date.now(), Date.now()));
    console.log(`[cakto] ${user.email} pago (${plan}) até ${new Date(until).toLocaleDateString('pt-BR')}`);
  } else if (CANCEL_EVENTS.includes(event)) {
    sub.cancel(user.id);
    console.log(`[cakto] ${user.email} cancelou — funciona até o fim do período pago`);
  } else if (BLOCK_EVENTS.includes(event)) {
    sub.block(user.id);
    wa.stop(user.id);
    console.log(`[cakto] ${user.email} bloqueado (${event})`);
  }
}

function webhookHandler(req, res) {
  const raw = req.body; // Buffer (express.raw)
  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).send('json inválido');
  }
  if (!isFromCakto(raw, req.headers, payload)) return res.status(401).send('unauthorized');

  const { event } = payload;
  const items = Array.isArray(payload.data) ? payload.data : [payload.data];
  for (const data of items) {
    if (!data || event === 'checkout_abandonment') continue;
    const key = `${event}:${data.id}`;
    const seen = db.prepare('SELECT 1 FROM webhook_events WHERE key = ?').get(key);
    if (seen) continue;
    db.prepare('INSERT INTO webhook_events (key, received_at) VALUES (?, ?)').run(key, Date.now());
    try {
      handleEvent(event, data);
    } catch (e) {
      console.error('[cakto] erro:', e);
    }
  }
  res.sendStatus(200);
}

module.exports = { webhookHandler, handleEvent, detectPlan };
