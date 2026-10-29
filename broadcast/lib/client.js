// Helpers HTTP usados pela CLI, pela ponte MCP e pelo worker.
const BASE = process.env.SALA_URL || `http://127.0.0.1:${process.env.PORT || 8787}`;
const TOKEN = process.env.BROADCAST_TOKEN || '';

async function api(method, pathname, body) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const send = (msg) => api('POST', '/api/messages', msg);
const read = (since = 0, waitSec = 0) => api('GET', `/api/messages?since=${since}&wait=${waitSec}`);
const peers = () => api('GET', '/api/peers');

function wsUrl(name, role, since = 0) {
  const u = new URL(BASE.replace(/^http/, 'ws') + '/ws');
  u.searchParams.set('name', name);
  u.searchParams.set('role', role);
  u.searchParams.set('since', String(since));
  if (TOKEN) u.searchParams.set('token', TOKEN);
  return u.toString();
}

function format(m) {
  const hora = m.ts.slice(11, 19);
  if (m.type === 'system') return `#${m.id} ${hora} · ${m.text}`;
  const extra = m.payload ? ` ${JSON.stringify(m.payload)}` : '';
  const para = m.to ? ` → @${m.to}` : '';
  return `#${m.id} ${hora} [${m.type}] ${m.from}${para}: ${m.text}${extra}`;
}

module.exports = { BASE, send, read, peers, wsUrl, format };
