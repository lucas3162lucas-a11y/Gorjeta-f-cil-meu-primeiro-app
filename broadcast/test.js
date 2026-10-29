// Teste ponta a ponta: sobe o servidor e o worker numa porta livre, conecta 3 participantes
// e confere o broadcast, a ponte MCP e um lote de vídeo real com ffmpeg.
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert');
const WebSocket = require('ws');

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const MEDIA = fs.mkdtempSync(path.join(os.tmpdir(), 'sala-media-'));
const env = { ...process.env, PORT, ROOM_LOG: 'off', SALA_URL: BASE, MEDIA_DIR: MEDIA };
const procs = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function start(file, extraEnv = {}) {
  const p = spawn(process.execPath, [path.join(__dirname, file)], { env: { ...env, ...extraEnv }, stdio: ['pipe', 'pipe', 'inherit'] });
  procs.push(p);
  return p;
}

function join(name, role) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws?name=${name}&role=${role}`);
    ws.inbox = [];
    ws.on('message', (raw) => {
      const m = JSON.parse(raw);
      if (m.type === 'welcome') resolve(ws); else ws.inbox.push(m);
    });
  });
}

async function until(fn, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = fn(); if (v) return v; await sleep(50); }
  throw new Error('tempo esgotado');
}

async function main() {
  start('server.js');
  await until(() => fetch(`${BASE}/health`).then((r) => r.ok, () => false), 5000).catch(() => {});
  await sleep(300);

  const [lucas, c1, c2] = await Promise.all([join('lucas', 'human'), join('claude-1', 'claude'), join('claude-2', 'claude')]);

  // 1) mensagem do humano chega em todos os Claudes
  lucas.send(JSON.stringify({ text: 'Bom dia, equipe!' }));
  for (const ws of [lucas, c1, c2]) await until(() => ws.inbox.find((m) => m.text === 'Bom dia, equipe!' && m.from === 'lucas'));
  console.log('ok  humano → todos');

  // 2) resposta de um Claude é ouvida pelos outros (e pelo humano)
  c1.send(JSON.stringify({ text: 'claude-1 na escuta', from: 'impostor' }));
  for (const ws of [lucas, c2]) await until(() => ws.inbox.find((m) => m.text === 'claude-1 na escuta' && m.from === 'claude-1'));
  console.log('ok  claude-1 → todos (remetente não pode ser falsificado)');

  // 3) ponte MCP: outro Claude lê e escreve via ferramentas
  const mcp = start('mcp.js', { SALA_NOME: 'claude-3' });
  let buf = '';
  const pending = new Map();
  mcp.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) { const r = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); pending.get(r.id)?.(r); }
  });
  let rid = 0;
  const rpc = (method, params) => new Promise((res) => { const id = ++rid; pending.set(id, res); mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } });
  const lidos = await rpc('tools/call', { name: 'sala_ler', arguments: {} });
  assert.match(lidos.result.content[0].text, /claude-1 na escuta/);
  await rpc('tools/call', { name: 'sala_enviar', arguments: { texto: 'claude-3 via MCP' } });
  for (const ws of [lucas, c1, c2]) await until(() => ws.inbox.find((m) => m.text === 'claude-3 via MCP' && m.from === 'claude-3'));
  console.log('ok  ponte MCP (sala_ler / sala_enviar)');

  // 4) lote de vídeo executado pelo worker
  fs.mkdirSync(path.join(MEDIA, 'in'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-shortest', '-c:v', 'libx264', '-c:a', 'aac', path.join(MEDIA, 'in', 'bruto.mp4')]);
  start('worker-video.js', { VIDEO_CONCURRENCY: 2 });
  await until(() => lucas.inbox.find((m) => m.type === 'system' && /worker-video.*entrou/.test(m.text)));
  await rpc('tools/call', {
    name: 'sala_lote_video',
    arguments: {
      jobs: [
        { input: 'in/bruto.mp4', output: 'out/short.mp4', ops: [{ op: 'trim', start: 1, duration: 2 }, { op: 'vertical', width: 540 }, { op: 'speed', factor: 1.5 }] },
        { input: 'in/bruto.mp4', output: 'out/mudo.mp4', ops: [{ op: 'scale', width: 320 }, { op: 'mute' }, { op: 'fade', in: 0.5 }] },
        { input: '../../etc/passwd', output: 'out/x.mp4', ops: [] },
      ],
    },
  });
  await until(() => lucas.inbox.filter((m) => m.type === 'video.status' && ['done', 'failed'].includes(m.payload?.state)).length === 3, 60000);
  const finals = lucas.inbox.filter((m) => m.type === 'video.status' && ['done', 'failed'].includes(m.payload?.state));
  assert.equal(finals.filter((m) => m.payload.state === 'done').length, 2);
  assert.match(finals.find((m) => m.payload.state === 'failed').text, /fora da pasta de mídia/);
  const dims = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path.join(MEDIA, 'out', 'short.mp4')]).toString().trim();
  assert.equal(dims, '540,960');
  console.log('ok  lote de vídeo (2 prontos, 1 bloqueado por caminho inseguro, short em 540x960)');

  console.log('\nTODOS OS TESTES PASSARAM');
}

main()
  .catch((e) => { console.error('FALHOU:', e); process.exitCode = 1; })
  .finally(() => { procs.forEach((p) => p.kill()); fs.rmSync(MEDIA, { recursive: true, force: true }); setTimeout(() => process.exit(), 200); });
