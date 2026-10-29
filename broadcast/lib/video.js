// Traduz "receitas" de edição em argumentos do ffmpeg.
// Só operações da lista abaixo são aceitas e todos os caminhos ficam presos dentro de MEDIA_DIR,
// então uma mensagem na sala nunca vira comando de shell arbitrário.
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const OUTPUT_EXT = new Set(['.mp4', '.mov', '.mkv', '.webm']);

function num(v, name, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${name} inválido: ${v}`);
  return n;
}

function even(n) {
  return n === -1 ? -1 : Math.round(n / 2) * 2;
}

// Resolve um caminho relativo a MEDIA_DIR e recusa qualquer coisa que escape dele.
function safePath(mediaDir, rel, { mustExist = false } = {}) {
  if (typeof rel !== 'string' || !rel) throw new Error('caminho vazio');
  const root = path.resolve(mediaDir);
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error(`caminho fora da pasta de mídia: ${rel}`);
  if (mustExist && !fs.existsSync(full)) throw new Error(`arquivo não encontrado: ${rel}`);
  return full;
}

// Cada operação contribui com filtros de vídeo (vf), de áudio (af) e/ou opções extras.
const OPS = {
  trim(o, ctx) {
    if (o.start !== undefined) ctx.pre.push('-ss', String(num(o.start, 'start', { min: 0 })));
    if (o.duration !== undefined) ctx.post.push('-t', String(num(o.duration, 'duration', { min: 0.01 })));
    else if (o.end !== undefined) {
      const dur = num(o.end, 'end', { min: 0 }) - (Number(o.start) || 0);
      if (dur <= 0) throw new Error('end precisa ser maior que start');
      ctx.post.push('-t', String(dur));
    }
  },
  scale(o, ctx) {
    const w = even(num(o.width ?? -1, 'width', { min: -1, max: 7680 }));
    const h = even(num(o.height ?? -1, 'height', { min: -1, max: 7680 }));
    ctx.vf.push(`scale=${w === -1 ? -2 : w}:${h === -1 ? -2 : h}`);
  },
  // Corta no centro para 9:16 (Shorts/Reels/TikTok) e redimensiona.
  vertical(o, ctx) {
    const w = even(num(o.width ?? 1080, 'width', { min: 144, max: 4320 }));
    const h = Math.round((w * 16) / 9 / 2) * 2;
    ctx.vf.push("crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'", `scale=${w}:${h}`, 'setsar=1');
  },
  speed(o, ctx) {
    const f = num(o.factor, 'factor', { min: 0.25, max: 4 });
    ctx.vf.push(`setpts=PTS/${f}`);
    // atempo aceita 0.5–2; encadeia para fatores fora disso.
    let rest = f;
    while (rest > 2) { ctx.af.push('atempo=2'); rest /= 2; }
    while (rest < 0.5) { ctx.af.push('atempo=0.5'); rest /= 0.5; }
    ctx.af.push(`atempo=${rest}`);
  },
  fade(o, ctx) {
    const inS = o.in !== undefined ? num(o.in, 'in', { min: 0, max: 30 }) : 0;
    if (inS) { ctx.vf.push(`fade=t=in:st=0:d=${inS}`); ctx.af.push(`afade=t=in:st=0:d=${inS}`); }
    if (o.out !== undefined) {
      const outS = num(o.out, 'out', { min: 0.01, max: 30 });
      const at = num(o.at, 'at (segundo em que o fade-out começa)', { min: 0 });
      ctx.vf.push(`fade=t=out:st=${at}:d=${outS}`);
      ctx.af.push(`afade=t=out:st=${at}:d=${outS}`);
    }
  },
  mute(o, ctx) {
    ctx.mute = true;
  },
  // Troca a trilha de áudio por outro arquivo da pasta de mídia.
  audio(o, ctx) {
    ctx.audioFile = safePath(ctx.mediaDir, o.file, { mustExist: true });
  },
  quality(o, ctx) {
    ctx.crf = num(o.crf ?? 23, 'crf', { min: 0, max: 51 });
    if (o.preset) {
      const p = String(o.preset);
      if (!/^(ultrafast|superfast|veryfast|faster|fast|medium|slow|slower|veryslow)$/.test(p)) throw new Error(`preset inválido: ${p}`);
      ctx.preset = p;
    }
  },
};

function buildArgs(job, mediaDir) {
  const input = safePath(mediaDir, job.input, { mustExist: true });
  const output = safePath(mediaDir, job.output);
  if (!OUTPUT_EXT.has(path.extname(output).toLowerCase())) throw new Error(`extensão de saída não suportada: ${job.output}`);
  if (input === output) throw new Error('entrada e saída não podem ser o mesmo arquivo');

  const ctx = { mediaDir, pre: [], post: [], vf: [], af: [], mute: false, audioFile: null, crf: 23, preset: 'veryfast' };
  for (const op of job.ops || []) {
    const fn = OPS[op?.op];
    if (!fn) throw new Error(`operação desconhecida: ${op?.op} (use: ${Object.keys(OPS).join(', ')})`);
    fn(op, ctx);
  }

  const args = ['-y', '-hide_banner', '-loglevel', 'error', ...ctx.pre, '-i', input];
  if (ctx.audioFile) args.push('-i', ctx.audioFile, '-map', '0:v:0', '-map', '1:a:0', '-shortest');
  args.push(...ctx.post);
  if (ctx.vf.length) args.push('-vf', ctx.vf.join(','));
  if (ctx.mute) args.push('-an');
  else if (ctx.af.length) args.push('-af', ctx.af.join(','));
  const webm = path.extname(output).toLowerCase() === '.webm';
  args.push('-c:v', webm ? 'libvpx-vp9' : 'libx264', '-crf', String(ctx.crf));
  if (!webm) args.push('-preset', ctx.preset, '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (!ctx.mute) args.push('-c:a', webm ? 'libopus' : 'aac');
  args.push(output);
  return { args, input, output };
}

function runFfmpeg(args, { ffmpeg = 'ffmpeg', timeoutMs = 30 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(args.at(-1)), { recursive: true });
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr = (stderr + d).slice(-4000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg saiu com código ${code}: ${stderr.trim()}`));
    });
  });
}

module.exports = { buildArgs, runFfmpeg, safePath, OPS };
