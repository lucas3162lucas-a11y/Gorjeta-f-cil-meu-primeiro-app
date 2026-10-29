// Sala de broadcast: toda mensagem publicada (WebSocket ou HTTP) é entregue a todos os conectados.
//   WS   ws://HOST:PORT/ws?name=claude-1&role=claude[&token=...]
//   HTTP POST /api/messages  {from, role, text, type?, payload?}
//        GET  /api/messages?since=ID&wait=SEGUNDOS   (long-poll, para quem não segura um socket)
//        GET  /api/peers
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');
const { Room } = require('./lib/room');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.BROADCAST_TOKEN || '';
const LOG_FILE = process.env.ROOM_LOG === 'off' ? null : (process.env.ROOM_LOG || path.join(__dirname, 'data', 'sala.jsonl'));
const MAX_BODY = 1024 * 1024;

const room = new Room({ historySize: Number(process.env.HISTORY_SIZE || 500), logFile: LOG_FILE });
const peers = new Map(); // ws -> {name, role, since}

function authorized(url, headers) {
  if (!TOKEN) return true;
  return url.searchParams.get('token') === TOKEN || headers.authorization === `Bearer ${TOKEN}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('corpo grande demais')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

function peerList() {
  return [...peers.values()].map(({ name, role, since }) => ({ name, role, since }));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'public', 'index.html')).pipe(res);
    return;
  }
  if (url.pathname === '/health') return sendJson(res, 200, { ok: true, peers: peers.size, lastId: room.nextId - 1 });

  if (!url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'não encontrado' });
  if (!authorized(url, req.headers)) return sendJson(res, 401, { error: 'token inválido' });

  try {
    if (req.method === 'POST' && url.pathname === '/api/messages') {
      const body = await readBody(req);
      return sendJson(res, 201, room.publish(body));
    }
    if (req.method === 'GET' && url.pathname === '/api/messages') {
      const since = Number(url.searchParams.get('since') || 0);
      const wait = Math.min(Number(url.searchParams.get('wait') || 0), 60) * 1000;
      const messages = await room.waitSince(since, wait);
      return sendJson(res, 200, { messages, lastId: room.nextId - 1 });
    }
    if (req.method === 'GET' && url.pathname === '/api/peers') return sendJson(res, 200, { peers: peerList() });
    sendJson(res, 404, { error: 'não encontrado' });
  } catch (e) {
    sendJson(res, 400, { error: e.message });
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_BODY });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws' || !authorized(url, req.headers)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, url));
});

wss.on('connection', (ws, url) => {
  const peer = {
    name: (url.searchParams.get('name') || `anon-${Math.random().toString(36).slice(2, 7)}`).slice(0, 64),
    role: url.searchParams.get('role') || 'claude',
    since: new Date().toISOString(),
  };
  peers.set(ws, peer);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Recém-chegado recebe o histórico e a lista de quem está na sala.
  const since = Number(url.searchParams.get('since') || 0);
  ws.send(JSON.stringify({ type: 'welcome', you: peer, peers: peerList(), history: room.since(since, 500) }));
  room.publish({ type: 'system', from: 'sala', role: 'system', text: `${peer.name} (${peer.role}) entrou na sala` });

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { data = { text: String(raw) }; }
    try {
      // O remetente é sempre o nome da conexão: ninguém fala em nome de outro.
      room.publish({ ...data, from: peer.name, role: peer.role });
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', error: e.message }));
    }
  });

  ws.on('close', () => {
    peers.delete(ws);
    room.publish({ type: 'system', from: 'sala', role: 'system', text: `${peer.name} saiu da sala` });
  });
});

// Broadcast: cada mensagem nova vai para TODOS os sockets, inclusive quem enviou (serve de confirmação).
room.on('message', (msg) => {
  const frame = JSON.stringify(msg);
  for (const ws of wss.clients) if (ws.readyState === ws.OPEN) ws.send(frame);
});

// Derruba conexões mortas.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, HOST, () => {
  console.log(`Sala de broadcast em http://${HOST}:${PORT}  (WebSocket: ws://${HOST}:${PORT}/ws)`);
  if (!TOKEN && HOST !== '127.0.0.1' && HOST !== 'localhost') console.warn('AVISO: aberto na rede sem BROADCAST_TOKEN.');
});

module.exports = { server, room };
