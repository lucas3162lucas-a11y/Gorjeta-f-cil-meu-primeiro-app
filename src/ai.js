// IA da NVIDIA (API grátis em https://build.nvidia.com — compatível com o formato da OpenAI).
const config = require('./config');
const { PLANS } = require('./plans');

function buildSystemPrompt(settings, plan) {
  const lines = [
    `Você é o atendente virtual de vendas da empresa "${settings.business_name || 'nossa loja'}" no WhatsApp.`,
    `Seu tom é ${settings.tone || 'simpático e direto'}. Responda sempre em português do Brasil.`,
    'Escreva mensagens curtas, como uma pessoa no WhatsApp (no máximo 3 parágrafos curtos). Use emojis com moderação.',
    'Seu objetivo é tirar dúvidas e conduzir o cliente até a compra, sem ser insistente.',
    'Nunca invente preços, produtos, prazos ou políticas que não estejam nas informações abaixo. Se não souber, diga que vai verificar com a equipe.',
    '',
    '### Sobre o negócio',
    settings.about || '(sem informações cadastradas)',
  ];
  if (PLANS[plan].catalog && settings.catalog) {
    lines.push('', '### Produtos e preços', settings.catalog);
  }
  if (PLANS[plan].handoffKeyword) {
    lines.push('', 'Se o cliente pedir para falar com um humano/atendente, ou se for uma reclamação séria, responda que vai chamar um atendente e inclua no fim da resposta exatamente a marcação [ATENDENTE].');
  }
  return lines.join('\n');
}

async function generateReply({ plan, settings, history }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(settings, plan) },
    ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
  ];
  return complete({ plan, settings, messages, temperature: 0.5 });
}

// Mensagem de "achadinho" para grupo de ofertas. O link vai sempre no fim, sem alteração.
async function generateDealMessage({ plan, settings, deal }) {
  const system = [
    'Você escreve posts de "achadinhos" (ofertas de produtos, ex.: Shopee) para um grupo de WhatsApp brasileiro.',
    'Formato: título chamativo em *negrito* com emoji, 1 frase vendendo o benefício, 3 a 4 vantagens com ✅, e uma chamada curta de urgência no fim.',
    'Use a formatação do WhatsApp (*negrito*, _itálico_). Máximo de 700 caracteres. Português do Brasil.',
    'Nunca invente preço, desconto, frete grátis, avaliações ou características técnicas que não foram informadas.',
    'Se o preço não foi informado, escreva "💸 Confira o preço no link".',
    'NÃO escreva o link nem a palavra "link aqui"; o link é colocado automaticamente depois do texto.',
    'Responda só com o texto do post, sem explicações.',
  ].join('\n');
  const user = [
    `Produto: ${deal.title}`,
    deal.price ? `Preço: ${deal.price}` : 'Preço: (não informado)',
    deal.notes ? `Detalhes: ${deal.notes}` : '',
  ].filter(Boolean).join('\n');

  let text = await complete({
    plan, settings, temperature: 0.8,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  text = text.replaceAll(deal.link, '').replace(/https?:\/\/\S+/g, '').trim();
  return `${text}\n\n🛒 *Compre aqui:* ${deal.link}`;
}

async function complete({ plan, settings, messages, temperature }) {
  const apiKey = settings.nvidia_key || config.nvidia.apiKey;
  if (!apiKey) throw new Error('NVIDIA_API_KEY não configurada');

  const call = (model) => fetch(`${config.nvidia.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature, max_tokens: 1024 }),
    signal: AbortSignal.timeout(60_000),
  });

  let res = await call(config.nvidia.models[plan]);
  // Modelo desativado, inexistente ou fora do ar: tenta o modelo reserva.
  if ([404, 410, 500, 502, 503].includes(res.status) && config.nvidia.fallbackModel) {
    console.warn(`[ia] modelo ${config.nvidia.models[plan]} falhou (${res.status}), usando ${config.nvidia.fallbackModel}`);
    res = await call(config.nvidia.fallbackModel);
  }
  if (!res.ok) throw new Error(`NVIDIA respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return cleanReply(data.choices?.[0]?.message?.content || '');
}

// Modelos que "pensam" às vezes mandam o raciocínio junto; o cliente só vê a resposta.
function cleanReply(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*<\/think>/i, '').trim();
}

module.exports = { generateReply, generateDealMessage };
