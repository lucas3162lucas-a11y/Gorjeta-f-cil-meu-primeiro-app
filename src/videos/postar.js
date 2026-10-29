// Aprova e posta um vídeo pronto no TikTok.
// Uso: npm run postar            (o vídeo mais recente)
//      npm run postar -- <id>    (um vídeo específico, a pasta em data/videos/)
const path = require('node:path');
require('../config');
const tiktok = require('./tiktok');
const nicho = require('./nicho');
const { readJson, writeJson, findVideo } = require('./util');

async function aprovarEPostar(id) {
  const { dir } = findVideo(id);
  const statusFile = path.join(dir, 'status.json');
  const status = readJson(statusFile);
  if (status.estado === 'postado') throw new Error(`Esse vídeo já foi postado (${status.tiktok?.status}).`);

  writeJson(statusFile, { ...status, estado: 'aprovado', aprovado_em: new Date().toISOString() });
  const modo = process.env.TIKTOK_MODO || 'rascunho';
  console.log(`📤 Enviando "${status.titulo}" para o TikTok (modo ${modo})...`);
  try {
    const resultado = await tiktok.postar(path.join(dir, 'video.mp4'), {
      titulo: `${status.legenda} ${nicho.hashtags.join(' ')}`,
      modo,
      privacidade: process.env.TIKTOK_PRIVACIDADE || 'SELF_ONLY',
    });
    writeJson(statusFile, { ...readJson(statusFile), estado: 'postado', postado_em: new Date().toISOString(), tiktok: resultado });
    console.log(modo === 'rascunho'
      ? '✅ Enviado! Abra o app do TikTok, toque na notificação da caixa de entrada e publique (aí dá para pôr um som em alta).'
      : `✅ Postado no TikTok (${resultado.status}).`);
    return resultado;
  } catch (e) {
    writeJson(statusFile, { ...readJson(statusFile), estado: 'erro', erro: e.message });
    throw e;
  }
}

if (require.main === module) {
  aprovarEPostar(process.argv[2]).catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}

module.exports = { aprovarEPostar };
