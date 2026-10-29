#!/usr/bin/env node
// Worker de vídeo: entra na sala, escuta mensagens "video.batch" e executa cada job com ffmpeg,
// publicando o andamento como "video.status" para que todos (você e os Claudes) acompanhem.
//
// Formato de um lote (payload de video.batch):
//   { "jobs": [ { "input": "in/bruto.mp4", "output": "out/short1.mp4",
//                 "ops": [ {"op":"trim","start":3,"duration":30}, {"op":"vertical"}, {"op":"speed","factor":1.1} ] } ] }
const path = require('node:path');
const WebSocket = require('ws');
const { wsUrl } = require('./lib/client');
const { buildArgs, runFfmpeg } = require('./lib/video');

const NAME = process.env.WORKER_NAME || 'worker-video';
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || path.join(__dirname, 'media'));
const CONCURRENCY = Math.max(1, Number(process.env.VIDEO_CONCURRENCY || 2));
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

const queue = [];
let running = 0;
let ws;
let lastSeen = 0;
let connected = false;

function status(text, payload) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'video.status', text, payload }));
  console.log(text);
}

function pump() {
  while (running < CONCURRENCY && queue.length) {
    const item = queue.shift();
    running++;
    runJob(item).finally(() => { running--; pump(); });
  }
}

async function runJob({ batchId, index, total, job }) {
  const tag = `lote #${batchId} [${index + 1}/${total}]`;
  const started = Date.now();
  try {
    const { args } = buildArgs(job, MEDIA_DIR);
    status(`${tag} processando ${job.input} → ${job.output}`, { batchId, index, state: 'running' });
    await runFfmpeg(args, { ffmpeg: FFMPEG });
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    status(`${tag} pronto: ${job.output} (${secs}s)`, { batchId, index, state: 'done', output: job.output, seconds: Number(secs) });
  } catch (e) {
    status(`${tag} falhou: ${e.message}`, { batchId, index, state: 'failed', error: e.message });
  }
}

function handle(m) {
  if (!m.id || m.id <= lastSeen) return;
  lastSeen = m.id;
  if (m.type !== 'video.batch') return;
  const jobs = m.payload?.jobs;
  if (!Array.isArray(jobs) || !jobs.length) return status(`lote #${m.id} ignorado: payload.jobs vazio`, { batchId: m.id, state: 'rejected' });
  status(`lote #${m.id} de ${m.from} recebido: ${jobs.length} job(s), ${CONCURRENCY} em paralelo`, { batchId: m.id, state: 'queued', total: jobs.length });
  jobs.forEach((job, index) => queue.push({ batchId: m.id, index, total: jobs.length, job }));
  pump();
}

function connect() {
  ws = new WebSocket(wsUrl(NAME, 'worker', lastSeen));
  ws.on('open', () => console.log(`${NAME} conectado. Pasta de mídia: ${MEDIA_DIR}`));
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.type !== 'welcome') return handle(m);
    // Na primeira conexão os lotes antigos do histórico não são reexecutados;
    // numa reconexão, processa o que chegou enquanto estava fora.
    if (connected) m.history.forEach(handle);
    else lastSeen = m.history.at(-1)?.id ?? lastSeen;
    connected = true;
  });
  ws.on('close', () => { console.log('conexão caiu, reconectando em 3s'); setTimeout(connect, 3000); });
  ws.on('error', (e) => console.error(e.message));
}

connect();
