// Funções comuns da produção de vídeos: rodar programas (ffmpeg, edge-tts) e pastas.
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const config = require('../config');

const videosDir = path.join(config.dataDir, 'videos');

function run(cmd, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => reject(e.code === 'ENOENT' ? new Error(`"${cmd}" não está instalado (veja o README)`) : e));
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} falhou (${code}): ${err.slice(-600)}`))));
  });
}

async function duration(file) {
  const out = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Number(out.trim());
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// "ultimo" ou vazio → vídeo mais recente.
function findVideo(id) {
  if (!id || id === 'ultimo') {
    const all = fs.existsSync(videosDir) ? fs.readdirSync(videosDir, { withFileTypes: true }) : [];
    id = all.filter((d) => d.isDirectory()).map((d) => d.name).sort().at(-1);
  }
  const dir = id && path.join(videosDir, id);
  if (!dir || !fs.existsSync(path.join(dir, 'status.json'))) throw new Error(`Vídeo "${id || ''}" não encontrado em ${videosDir}`);
  return { id, dir };
}

module.exports = { run, duration, readJson, writeJson, videosDir, findVideo };
