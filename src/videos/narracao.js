// Etapa 2: narra cada frase com o edge-tts (vozes grátis da Microsoft) e junta tudo num áudio só.
// Gerar frase por frase dá o tempo exato de cada uma, que a edição usa para sincronizar as legendas.
const path = require('node:path');
const { run, duration } = require('./util');

const PAUSA = 0.18; // segundos de respiro entre frases

async function narrar(falas, dir, { voz, velocidade, semVoz } = {}) {
  const partes = [];
  for (const [i, texto] of falas.entries()) {
    const file = path.join(dir, `fala-${i + 1}.mp3`);
    if (semVoz) {
      // Modo de teste sem internet: silêncio com a duração aproximada da fala.
      const seg = Math.max(1.2, texto.length / 15);
      await run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', seg.toFixed(2), '-q:a', '9', file]);
    } else {
      await run('edge-tts', ['--voice', voz, `--rate=${velocidade}`, '--text', texto, '--write-media', file]);
    }
    partes.push({ texto, file, dur: (await duration(file)) + PAUSA });
  }

  const inputs = partes.flatMap((p) => ['-i', p.file]);
  const filtro = partes.map((_, i) => `[${i}:a]aresample=44100,apad=pad_dur=${PAUSA}[a${i}]`).join(';')
    + ';' + partes.map((_, i) => `[a${i}]`).join('') + `concat=n=${partes.length}:v=0:a=1,loudnorm=I=-14:TP=-1.5[out]`;
  const audio = path.join(dir, 'narracao.m4a');
  await run('ffmpeg', ['-y', ...inputs, '-filter_complex', filtro, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', audio]);

  let t = 0;
  const tempos = partes.map((p) => {
    const item = { texto: p.texto, inicio: t, fim: t + p.dur - PAUSA };
    t += p.dur;
    return item;
  });
  return { audio, tempos, total: t };
}

module.exports = { narrar };
