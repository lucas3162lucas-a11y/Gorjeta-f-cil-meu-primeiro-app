// Busca ofertas sozinho na Shopee pela API oficial de afiliados (os links já saem com a SUA comissão).
// Credenciais: affiliate.shopee.com.br → Open API → App ID e Senha (Secret).
const crypto = require('node:crypto');
const r = require('./rodizio');

const URL_SHOPEE = 'https://open-api.affiliate.shopee.com.br/graphql';
const CAMPOS = 'itemId productName priceMin priceMax priceDiscountRate imageUrl offerLink sales ratingStar';
const CAMPOS_MINIMOS = 'itemId productName priceMin imageUrl offerLink';
const VENDIDOS_PRIMEIRO = 2; // sortType: mais vendidos

const PALAVRAS_PADRAO = ['achadinhos casa', 'organizador', 'cozinha utilidades', 'fone bluetooth', 'maquiagem', 'skincare', 'acessórios celular', 'decoração quarto', 'garrafa térmica', 'luminária led'];

const sortear = (l) => l[Math.floor(Math.random() * l.length)];

async function chamarShopee(appId, secret, query) {
  const corpo = JSON.stringify({ query });
  const ts = Math.floor(Date.now() / 1000);
  const assinatura = crypto.createHash('sha256').update(`${appId}${ts}${corpo}${secret}`).digest('hex');
  const resp = await fetch(URL_SHOPEE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `SHA256 Credential=${appId}, Timestamp=${ts}, Signature=${assinatura}` },
    body: corpo,
    signal: AbortSignal.timeout(30000),
  });
  const json = await resp.json().catch(() => ({}));
  if (json.errors?.length) {
    const e = new Error(json.errors[0].message || 'erro da Shopee');
    e.codigo = json.errors[0].extensions?.code;
    throw e;
  }
  return json.data;
}

function explicarErro(e) {
  const m = String(e.message || e);
  if (e.codigo === 10035 || /do not have access/i.test(m)) return 'Sua conta ainda não tem acesso à Open API da Shopee. Peça acesso em affiliate.shopee.com.br → Open API.';
  if (e.codigo === 10020 || /signature|credential|authoriz/i.test(m)) return 'App ID ou Senha da Shopee errados. Confira e mande de novo: !shopeechave APPID SENHA';
  if (e.codigo === 10030) return 'A Shopee limitou as buscas por alguns minutos. Tento de novo depois.';
  return 'Erro da Shopee: ' + m;
}

// Retorna produtos no formato do produtos.json.
async function buscarShopee(config, palavra) {
  const s = config.shopee || {};
  if (!s.appId || !s.secret) throw new Error('Falta configurar a Shopee. Mande: !shopeechave APPID SENHA');
  const palavras = s.palavrasChave?.length ? s.palavrasChave : PALAVRAS_PADRAO;
  const termo = palavra || sortear(palavras);
  const consulta = (campos) => `{productOfferV2(keyword: ${JSON.stringify(termo)}, sortType: ${VENDIDOS_PRIMEIRO}, page: 1, limit: 40) { nodes { ${campos} } }}`;
  let dados;
  try {
    dados = await chamarShopee(s.appId, s.secret, consulta(CAMPOS));
  } catch (e) {
    // Acesso/senha/limite: não adianta tentar de novo. Outro erro: tenta com menos campos.
    if ([10020, 10030, 10035].includes(e.codigo) || /do not have access|signature|credential/i.test(e.message)) throw new Error(explicarErro(e));
    dados = await chamarShopee(s.appId, s.secret, consulta(CAMPOS_MINIMOS)).catch((e2) => { throw new Error(explicarErro(e2)); });
  }
  const descontoMin = Number(s.descontoMinimo ?? 20);
  const vendasMin = Number(s.vendasMinimas ?? 50);
  const itens = (dados?.productOfferV2?.nodes || []).filter((n) => n.offerLink && n.productName);
  const bons = itens.filter((n) => (n.priceDiscountRate == null || n.priceDiscountRate >= descontoMin) && (n.sales == null || n.sales >= vendasMin));
  return { termo, produtos: (bons.length ? bons : itens).map((n) => {
    const preco = Number(n.priceMin);
    const desc = Number(n.priceDiscountRate || 0);
    const antigo = desc > 0 && desc < 100 ? preco / (1 - desc / 100) : null;
    return {
      titulo: String(n.productName).slice(0, 120),
      preco: preco ? preco.toFixed(2).replace('.', ',') : '',
      precoAntigo: antigo ? antigo.toFixed(2).replace('.', ',') : '',
      link: n.offerLink,
      imagem: n.imageUrl || '',
      cupom: '',
      auto: true,
      itemId: String(n.itemId || ''),
    };
  }) };
}

// Coloca os produtos novos no produtos.json, sem repetir, e limita a quantidade dos automáticos.
function adicionarNovos(loja, novos, estado, maximoAuto = 80) {
  const produtos = r.lerProdutos();
  const lista = produtos[loja];
  const jaTem = new Set(lista.flatMap((p) => [p.link, p.itemId].filter(Boolean)));
  const entrando = novos.filter((p) => !jaTem.has(p.link) && !(p.itemId && jaTem.has(p.itemId)));
  lista.push(...entrando);
  // Se passou do limite, tira os automáticos que já foram postados há mais tempo.
  const autos = lista.filter((p) => p.auto);
  if (autos.length > maximoAuto) {
    const quando = (p) => estado.ultimoEnvio[`${loja}|${p.link}`] || Infinity;
    const sair = new Set(autos.sort((a, b) => quando(a) - quando(b)).slice(0, autos.length - maximoAuto));
    produtos[loja] = lista.filter((p) => !sair.has(p));
  }
  r.salvarProdutos(produtos);
  return entrando.length;
}

// Quantos produtos da loja ainda não foram postados.
function naoPostados(loja, estado) {
  return r.ativos(r.lerProdutos()[loja]).filter((p) => !estado.ultimoEnvio[`${loja}|${p.link}`]).length;
}

module.exports = { buscarShopee, adicionarNovos, naoPostados, PALAVRAS_PADRAO };
