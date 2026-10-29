// Etapa 5: posta no TikTok pela API oficial (Content Posting API).
// Precisa de um app em https://developers.tiktok.com e de um login feito uma vez com `npm run tiktok:login`.
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { readJson, writeJson } = require('./util');

const API = 'https://open.tiktokapis.com/v2';
const tokenFile = path.join(config.dataDir, 'tiktok.json');
const SCOPES = 'user.info.basic,video.publish,video.upload';

const app = () => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error('Preencha TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET e TIKTOK_REDIRECT_URI no .env (veja o README)');
  }
  return { clientKey, clientSecret, redirectUri };
};

function linkDeLogin(state) {
  const { clientKey, redirectUri } = app();
  const q = new URLSearchParams({ client_key: clientKey, scope: SCOPES, response_type: 'code', redirect_uri: redirectUri, state });
  return `https://www.tiktok.com/v2/auth/authorize/?${q}`;
}

async function pedirToken(campos) {
  const { clientKey, clientSecret } = app();
  const res = await fetch(`${API}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, ...campos }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`TikTok recusou o login: ${JSON.stringify(data).slice(0, 300)}`);
  const agora = Date.now();
  const token = {
    ...data,
    expira_em: agora + data.expires_in * 1000,
    refresh_expira_em: agora + data.refresh_expires_in * 1000,
  };
  writeJson(tokenFile, token);
  return token;
}

const trocarCodigo = (code) => pedirToken({ code, grant_type: 'authorization_code', redirect_uri: app().redirectUri });

async function accessToken() {
  const token = readJson(tokenFile, null);
  if (!token) throw new Error('TikTok não conectado. Rode: npm run tiktok:login');
  if (Date.now() < token.expira_em - 60_000) return token.access_token;
  if (Date.now() > token.refresh_expira_em) throw new Error('Login do TikTok expirou. Rode de novo: npm run tiktok:login');
  return (await pedirToken({ grant_type: 'refresh_token', refresh_token: token.refresh_token })).access_token;
}

async function api(rota, body) {
  const res = await fetch(`${API}${rota}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.error && data.error.code !== 'ok')) {
    throw new Error(`TikTok ${rota}: ${data.error?.code || res.status} ${data.error?.message || ''}`.trim());
  }
  return data.data;
}

// modo "publicar": vai direto para o perfil (app sem auditoria do TikTok só consegue postar como privado).
// modo "rascunho": manda para a caixa de entrada do app do TikTok, e você publica de lá com um toque.
async function postar(arquivo, { titulo, modo = 'rascunho', privacidade = 'SELF_ONLY' }) {
  const tamanho = fs.statSync(arquivo).size;
  const source_info = { source: 'FILE_UPLOAD', video_size: tamanho, chunk_size: tamanho, total_chunk_count: 1 };
  let init;
  if (modo === 'publicar') {
    const criador = await api('/post/publish/creator_info/query/');
    const opcoes = criador.privacy_level_options || [];
    if (!opcoes.includes(privacidade)) {
      throw new Error(`Privacidade "${privacidade}" não liberada para esta conta. Opções: ${opcoes.join(', ')}`);
    }
    init = await api('/post/publish/video/init/', {
      post_info: {
        title: titulo.slice(0, 2200),
        privacy_level: privacidade,
        disable_duet: false,
        disable_stitch: false,
        disable_comment: false,
        video_cover_timestamp_ms: 1000,
        is_aigc: true, // narração e roteiro feitos com IA: o TikTok pede esse aviso
      },
      source_info,
    });
  } else {
    init = await api('/post/publish/inbox/video/init/', { source_info });
  }

  const envio = await fetch(init.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(tamanho), 'Content-Range': `bytes 0-${tamanho - 1}/${tamanho}` },
    body: fs.readFileSync(arquivo),
  });
  if (!envio.ok) throw new Error(`Falha ao enviar o vídeo para o TikTok (${envio.status})`);

  // Acompanha o processamento até terminar (no máximo ~5 minutos).
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await api('/post/publish/status/fetch/', { publish_id: init.publish_id });
    if (st.status === 'FAILED') throw new Error(`TikTok recusou o vídeo: ${st.fail_reason}`);
    if (['PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX'].includes(st.status)) return { publish_id: init.publish_id, ...st };
  }
  return { publish_id: init.publish_id, status: 'PROCESSANDO' };
}

module.exports = { linkDeLogin, trocarCodigo, postar };
