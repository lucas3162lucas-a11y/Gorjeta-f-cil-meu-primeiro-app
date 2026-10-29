// Regras da assinatura: o robô só funciona enquanto a assinatura está paga.
const db = require('./db');
const config = require('./config');
const { PLANS } = require('./plans');

const DAY = 24 * 60 * 60 * 1000;
const PERIOD_DAYS = 30; // somente mensal

function getUser(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// Ativo = tem plano, não está bloqueado e o pagamento ainda vale (com tolerância).
function isActive(user) {
  if (!user || !user.plan || !PLANS[user.plan]) return false;
  if (user.status === 'blocked' || user.status === 'pending') return false;
  return Number(user.paid_until || 0) + config.graceDays * DAY > Date.now();
}

// Pagamento aprovado/renovado: vale 30 dias a partir da data do pagamento.
// Usar a data do pagamento (e não "somar 30 dias") evita dar mês em dobro
// quando a Cakto manda mais de um evento para a mesma cobrança.
function renew(userId, plan, paidAt = Date.now()) {
  const user = getUser(userId);
  const paidUntil = Math.max(Number(user.paid_until || 0), paidAt + PERIOD_DAYS * DAY);
  db.prepare("UPDATE users SET plan = ?, paid_until = ?, status = 'active' WHERE id = ?")
    .run(plan || user.plan, paidUntil, userId);
  return paidUntil;
}

// Cancelou: continua funcionando até o fim do mês que já pagou, depois para.
function cancel(userId) {
  db.prepare("UPDATE users SET status = 'canceled' WHERE id = ?").run(userId);
}

// Reembolso, chargeback ou pausa: para na hora.
function block(userId) {
  db.prepare("UPDATE users SET status = 'blocked', paid_until = ? WHERE id = ?").run(Date.now(), userId);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getUsage(userId) {
  const row = db.prepare('SELECT replies FROM usage WHERE user_id = ? AND month = ?').get(userId, currentMonth());
  return row ? row.replies : 0;
}

function addUsage(userId) {
  db.prepare(`INSERT INTO usage (user_id, month, replies) VALUES (?, ?, 1)
              ON CONFLICT(user_id, month) DO UPDATE SET replies = replies + 1`).run(userId, currentMonth());
}

function hasQuota(user) {
  return getUsage(user.id) < PLANS[user.plan].monthlyReplies;
}

module.exports = { isActive, renew, cancel, block, getUsage, addUsage, hasQuota, getUser, DAY };
