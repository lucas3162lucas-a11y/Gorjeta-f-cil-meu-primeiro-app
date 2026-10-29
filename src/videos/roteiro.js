// Etapa 1: escolhe o tema e escreve o roteiro com a IA da NVIDIA (ou lê um roteiro pronto em JSON).
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const nicho = require('./nicho');
const { readJson, videosDir } = require('./util');

const historicoFile = path.join(videosDir, 'historico.json');

function prompt(tema, formato, jaFeitos) {
  return [
    `Você escreve roteiros de vídeos curtos (TikTok) do canal "${nicho.nome}", em português do Brasil.`,
    `Tema de hoje: ${tema}. Escolha UM assunto real, verificável e pouco conhecido sobre esse tema.`,
    `Formato obrigatório (copiado de vídeos que viralizaram):`,
    `- Gancho: ${formato.gancho}`,
    `- Estrutura: ${formato.estrutura}`,
    `- Chamada final: ${formato.chamada}`,
    jaFeitos.length ? `Não repita estes assuntos já feitos: ${jaFeitos.slice(-40).join('; ')}.` : '',
    'Regras:',
    '- 4 a 7 frases curtas e faladas (no máximo 18 palavras cada), total de 15 a 25 segundos de narração.',
    '- A 1ª frase é o gancho e precisa prender nos 2 primeiros segundos. Nada de "Olá" ou apresentação.',
    '- Um vídeo, uma ideia só.',
    '- Nada de informação falsa, exagerada ou perigosa. Números só se tiver certeza. Na dúvida, escolha outro assunto.',
    'Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:',
    '{"titulo": "título chamativo em até 8 palavras com 1 emoji", "falas": ["frase 1", "frase 2"], "legenda": "legenda do post com até 120 caracteres", "busca": "2 ou 3 palavras em inglês para buscar um vídeo de fundo do animal"}',
  ].filter(Boolean).join('\n');
}

async function chamarNvidia(content) {
  const { apiKey, baseUrl, models, fallbackModel } = config.nvidia;
  if (!apiKey) throw new Error('Sem NVIDIA_API_KEY no .env. Coloque a chave ou use --roteiro arquivo.json');
  const call = (model) => fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], temperature: 0.9, max_tokens: 2048 }),
    signal: AbortSignal.timeout(120_000),
  });
  let res = await call(models.plus);
  if ([404, 410, 500, 502, 503].includes(res.status) && fallbackModel) res = await call(fallbackModel);
  if (!res.ok) throw new Error(`NVIDIA respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const text = (await res.json()).choices?.[0]?.message?.content || '';
  const json = text.replace(/<think>[\s\S]*?<\/think>/gi, '').match(/\{[\s\S]*\}/);
  if (!json) throw new Error(`A IA não devolveu JSON: ${text.slice(0, 300)}`);
  return JSON.parse(json[0]);
}

function validar(r) {
  if (!r || !r.titulo || !Array.isArray(r.falas) || r.falas.length < 2) {
    throw new Error('Roteiro inválido: precisa de "titulo" e de "falas" (lista de frases)');
  }
  return {
    titulo: String(r.titulo).trim(),
    falas: r.falas.map((f) => String(f).trim()).filter(Boolean),
    legenda: String(r.legenda || r.titulo).trim(),
    busca: String(r.busca || '').trim(),
    tema: r.tema || '',
    formato: r.formato || '',
  };
}

async function criarRoteiro({ arquivo } = {}) {
  if (arquivo) return validar(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const tema = sortear(nicho.temas);
  const formato = sortear(nicho.formatos);
  const jaFeitos = readJson(historicoFile, []);
  return validar({ ...(await chamarNvidia(prompt(tema, formato, jaFeitos))), tema, formato: formato.nome });
}

module.exports = { criarRoteiro, historicoFile };
