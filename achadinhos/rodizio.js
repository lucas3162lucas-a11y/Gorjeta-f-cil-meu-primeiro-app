// Escolhe o próximo post e monta as mensagens (sem WhatsApp aqui — só regras).
const fs = require('node:fs');
const path = require('node:path');

const PASTA = __dirname;
const PASTA_DADOS = path.join(__dirname, '..', 'data', 'achadinhos');
const ARQ_CONFIG = path.join(PASTA, 'config.json');
const ARQ_PRODUTOS = path.join(PASTA, 'produtos.json');
const ARQ_ESTADO = path.join(PASTA_DADOS, 'estado.json');

const LOJAS = {
  shein: { nome: 'SHEIN', emoji: '👗' },
  mercadolivre: { nome: 'MERCADO LIVRE', emoji: '📦' },
  shopee: { nome: 'SHOPEE', emoji: '🧡' },
};
const APELIDOS = { ml: 'mercadolivre', mercado: 'mercadolivre', meli: 'mercadolivre', mercadolivre: 'mercadolivre', shein: 'shein', shopee: 'shopee' };

const lojaPorApelido = (txt) => APELIDOS[String(txt || '').toLowerCase().replace(/[^a-z]/g, '')] || null;

// Na primeira vez, cria config.json e produtos.json a partir dos exemplos.
function garantirArquivos() {
  for (const [arq, ex] of [[ARQ_CONFIG, 'config.exemplo.json'], [ARQ_PRODUTOS, 'produtos.exemplo.json']]) {
    if (!fs.existsSync(arq)) fs.copyFileSync(path.join(PASTA, ex), arq);
  }
  fs.mkdirSync(PASTA_DADOS, { recursive: true });
}

function lerJson(arq, padrao) {
  try {
    return JSON.parse(fs.readFileSync(arq, 'utf8'));
  } catch (e) {
    if (fs.existsSync(arq)) throw new Error(`Erro no arquivo ${path.basename(arq)}: ${e.message}`);
    return padrao;
  }
}

const salvarJson = (arq, dados) => {
  fs.writeFileSync(arq + '.tmp', JSON.stringify(dados, null, 2));
  fs.renameSync(arq + '.tmp', arq);
};

// Lidos de novo a cada envio: dá para editar os arquivos com o bot ligado.
const lerConfig = () => lerJson(ARQ_CONFIG, {});
const lerProdutos = () => {
  const p = lerJson(ARQ_PRODUTOS, {});
  for (const loja of Object.keys(LOJAS)) if (!Array.isArray(p[loja])) p[loja] = [];
  return p;
};
const salvarProdutos = (p) => salvarJson(ARQ_PRODUTOS, p);
const salvarConfig = (c) => salvarJson(ARQ_CONFIG, c);

const ESTADO_PADRAO = { indiceLoja: 0, totalShein: 0, afiliadosShein: 0, postsSemVitrine: 0, postsSemConvite: 0, ultimoEnvio: {}, ultimaDivulgacao: 0, pausado: false, totalPosts: 0 };
const lerEstado = () => ({ ...ESTADO_PADRAO, ...lerJson(ARQ_ESTADO, {}) });
const salvarEstado = (e) => salvarJson(ARQ_ESTADO, e);

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const chave = (loja, p) => `${loja}|${p.link}`;

// Entre os candidatos, pega o que está há mais tempo sem ser enviado (nunca enviado vem primeiro).
function menosRecente(loja, candidatos, estado) {
  if (!candidatos.length) return null;
  const quando = (p) => estado.ultimoEnvio[chave(loja, p)] || 0;
  const menor = Math.min(...candidatos.map(quando));
  return sortear(candidatos.filter((p) => quando(p) === menor));
}

// Ignora os produtos de exemplo (links falsos) para não irem parar no grupo.
const ehExemplo = (p) => /SEU-LINK|LINK-DO-PRODUTO/.test(p.link);
const ativos = (lista) => lista.filter((p) => p && p.link && p.ativo !== false && !ehExemplo(p));

// Na Shein, mantém a porcentagem configurada de produtos com o seu link de afiliado.
function escolherShein(produtos, config, estado) {
  const lista = ativos(produtos.shein);
  const afiliados = lista.filter((p) => p.afiliado);
  const outros = lista.filter((p) => !p.afiliado);
  const pct = Math.max(0, Math.min(100, Number(config.shein?.porcentagemAfiliados ?? 50))) / 100;
  const querAfiliado = estado.afiliadosShein < pct * (estado.totalShein + 1);
  const preferidos = querAfiliado ? afiliados : outros;
  return menosRecente('shein', preferidos.length ? preferidos : lista, estado);
}

// Escolhe a próxima loja da fila (pulando lojas sem produto) e o produto dela.
// forcarLoja: usado no comando !enviar shein, por exemplo.
function proximoProduto(config, produtos, estado, forcarLoja) {
  const ordem = (config.ordemLojas || Object.keys(LOJAS)).map(lojaPorApelido).filter(Boolean);
  const tentativas = forcarLoja ? [forcarLoja] : ordem.map((_, i) => ordem[(estado.indiceLoja + i) % ordem.length]);
  for (let i = 0; i < tentativas.length; i++) {
    const loja = tentativas[i];
    const produto = loja === 'shein' ? escolherShein(produtos, config, estado) : menosRecente(loja, ativos(produtos[loja] || []), estado);
    if (produto) {
      const proximoIndice = forcarLoja ? estado.indiceLoja : (estado.indiceLoja + i + 1) % ordem.length;
      return { loja, produto, proximoIndice };
    }
  }
  return null;
}

function registrarEnvio(estado, escolha) {
  const { loja, produto, proximoIndice } = escolha;
  estado.ultimoEnvio[chave(loja, produto)] = Date.now();
  estado.indiceLoja = proximoIndice;
  estado.totalPosts++;
  if (loja === 'shein') {
    estado.totalShein++;
    if (produto.afiliado) estado.afiliadosShein++;
  }
}

function numero(preco) {
  if (preco == null || preco === '') return null;
  const n = Number(String(preco).replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}
const reais = (n) => 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function textoProduto(loja, p) {
  const info = LOJAS[loja];
  const preco = numero(p.preco);
  const antigo = numero(p.precoAntigo);
  const linhas = [`${info.emoji} *ACHADINHO ${info.nome}* ${info.emoji}`, '', `*${p.titulo || 'Oferta imperdível'}*`, ''];
  if (preco && antigo && antigo > preco) {
    const off = Math.round((1 - preco / antigo) * 100);
    linhas.push(`~De ${reais(antigo)}~`, `🔥 *Por ${reais(preco)}* (${off}% OFF)`);
  } else if (preco) {
    linhas.push(`🔥 *Por ${reais(preco)}*`);
  }
  if (p.cupom) linhas.push(`🎟️ Cupom: *${p.cupom}*`);
  if (p.descricao) linhas.push('', p.descricao);
  linhas.push('', `🛒 Compre aqui 👇`, p.link, '', '_⚠️ Preço e estoque podem mudar a qualquer momento._');
  return linhas.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Links de exemplo do config ("COLE-...") nunca vão para o grupo.
const linkReal = (l) => /^https?:\/\//.test(l || '') && !/COLE-/.test(l);
const preencher = (modelo, link) => String(modelo).replaceAll('{link}', link || '');

// Mensagens extras que entram entre os produtos: vitrine da Shein e convite do grupo.
function extrasDepoisDoPost(config, estado) {
  const extras = [];
  estado.postsSemVitrine++;
  estado.postsSemConvite++;
  const aCadaVitrine = Number(config.shein?.enviarVitrineACada || 0);
  if (aCadaVitrine > 0 && linkReal(config.shein?.linkVitrine) && estado.postsSemVitrine >= aCadaVitrine && config.shein?.mensagensVitrine?.length) {
    extras.push(preencher(sortear(config.shein.mensagensVitrine), config.shein.linkVitrine));
    estado.postsSemVitrine = 0;
  }
  const aCadaConvite = Number(config.convidarNoGrupoACada || 0);
  if (aCadaConvite > 0 && linkReal(config.linkConviteGrupo) && estado.postsSemConvite >= aCadaConvite && config.mensagensConvite?.length) {
    extras.push(preencher(sortear(config.mensagensConvite), config.linkConviteGrupo));
    estado.postsSemConvite = 0;
  }
  return extras;
}

const textoDivulgacao = (config) => preencher(sortear(config.divulgacao?.mensagens || ['Entra no meu grupo de achadinhos 👇\n{link}']), config.linkConviteGrupo);

function horaAtual(config) {
  const h = new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: config.fusoHorario || 'America/Sao_Paulo' }).format(new Date());
  return Number(h);
}

// Se início > fim (ex.: 20 às 2), atravessa a meia-noite.
function dentroDoHorario(config) {
  const ini = Number(config.horarioInicio ?? 0);
  const fim = Number(config.horarioFim ?? 24);
  if (ini === fim) return true;
  const h = horaAtual(config);
  return ini < fim ? h >= ini && h < fim : h >= ini || h < fim;
}

module.exports = {
  LOJAS, ARQ_CONFIG, ARQ_PRODUTOS, PASTA_DADOS,
  lojaPorApelido, garantirArquivos, lerConfig, salvarConfig, lerProdutos, salvarProdutos, lerEstado, salvarEstado,
  proximoProduto, registrarEnvio, textoProduto, extrasDepoisDoPost, linkReal, textoDivulgacao, dentroDoHorario, numero, ativos,
};
