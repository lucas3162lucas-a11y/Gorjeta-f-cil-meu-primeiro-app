// Etapa 3: monta o vídeo vertical 1080x1920 com ffmpeg:
// fundo (vídeo do Pexels ou degradê animado) + selo no topo + legendas grandes sincronizadas + barra de progresso.
const fs = require('node:fs');
const path = require('node:path');
const nicho = require('./nicho');
const { run } = require('./util');

const PALAVRAS_POR_BLOCO = 3;

const tempo = (s) => {
  const cs = Math.round(s * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const seg = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
};
const limpar = (t) => t.replace(/[{}]/g, '').replace(/\\/g, '');

// Quebra cada frase em blocos de poucas palavras, com o tempo dividido pelo tamanho do texto.
function legendas(tempos, total) {
  const linhas = [
    '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', 'WrapStyle: 0', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Legenda,DejaVu Sans,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,8,4,5,60,60,0,1',
    'Style: Gancho,DejaVu Sans,104,&H0000E5FF,&H0000E5FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,9,4,5,60,60,0,1',
    'Style: Selo,DejaVu Sans,58,&H0000E5FF,&H0000E5FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,3,18,0,8,60,60,0,1',
    '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    `Dialogue: 1,${tempo(0)},${tempo(total)},Selo,,0,0,0,,{\\pos(540,230)}${limpar(nicho.selo)}`,
  ];
  tempos.forEach((f, i) => {
    const palavras = limpar(f.texto).split(/\s+/).filter(Boolean);
    const blocos = [];
    for (let j = 0; j < palavras.length; j += PALAVRAS_POR_BLOCO) blocos.push(palavras.slice(j, j + PALAVRAS_POR_BLOCO).join(' '));
    const letras = blocos.reduce((n, b) => n + b.length, 0);
    let t = f.inicio;
    for (const bloco of blocos) {
      const fim = t + (f.fim - f.inicio) * (bloco.length / letras);
      const pop = '{\\pos(540,1060)\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}';
      linhas.push(`Dialogue: 0,${tempo(t)},${tempo(fim)},${i === 0 ? 'Gancho' : 'Legenda'},,0,0,0,,${pop}${bloco.toUpperCase()}`);
      t = fim;
    }
  });
  return linhas.join('\n') + '\n';
}

// Vídeo de fundo grátis do Pexels (opcional, precisa de PEXELS_API_KEY).
async function baixarFundo(busca, dir) {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !busca) return null;
  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(busca)}&orientation=portrait&per_page=15`;
    const res = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Pexels respondeu ${res.status}`);
    const arquivos = (await res.json()).videos
      .map((v) => v.video_files.filter((f) => f.height > f.width && f.height >= 1280).sort((a, b) => a.height - b.height)[0])
      .filter(Boolean);
    if (!arquivos.length) return null;
    const escolhido = arquivos[Math.floor(Math.random() * Math.min(arquivos.length, 5))];
    const file = path.join(dir, 'fundo.mp4');
    const video = await fetch(escolhido.link, { signal: AbortSignal.timeout(120_000) });
    fs.writeFileSync(file, Buffer.from(await video.arrayBuffer()));
    return file;
  } catch (e) {
    console.warn(`[edição] sem vídeo de fundo (${e.message}), usando degradê`);
    return null;
  }
}

async function editar({ dir, audio, tempos, total, busca }) {
  fs.writeFileSync(path.join(dir, 'legendas.ass'), legendas(tempos, total));
  const fundo = await baixarFundo(busca, dir);
  const [c0, c1, c2, c3] = nicho.cores;
  const entradaFundo = fundo
    ? ['-stream_loop', '-1', '-i', 'fundo.mp4']
    : ['-f', 'lavfi', '-i', `gradients=s=1080x1920:c0=${c0}:c1=${c1}:c2=${c2}:c3=${c3}:nb_colors=4:speed=0.015:r=30`];
  const filtro = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30${fundo ? ',eq=brightness=-0.12:saturation=1.15' : ''}[bg]`,
    `[bg][2:v]overlay=x='-w+w*t/${total.toFixed(2)}':y=H-h[pb]`,
    '[pb]ass=legendas.ass[v]',
  ].join(';');
  await run('ffmpeg', [
    '-y', ...entradaFundo, '-i', path.basename(audio), '-f', 'lavfi', '-i', 'color=c=0xFFE500:s=1080x14:r=30',
    '-filter_complex', filtro, '-map', '[v]', '-map', '1:a', '-t', total.toFixed(2),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'video.mp4',
  ], { cwd: dir });
  return path.join(dir, 'video.mp4');
}

module.exports = { editar };
