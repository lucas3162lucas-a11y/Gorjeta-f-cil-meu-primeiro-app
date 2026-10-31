// Bot de Achadinhos: posta produtos da Shein, Mercado Livre e Shopee no seu grupo do WhatsApp,
// intercalando as lojas, e divulga o link do grupo.
//   npm run achadinhos              -> liga o bot
//   npm run achadinhos -- --simular -> mostra os próximos posts sem conectar no WhatsApp
const fs = require('node:fs');
const path = require('node:path');
const r = require('./rodizio');
const busca = require('./buscar');

const SIMULAR = process.argv.includes('--simular');
const MIN = 60 * 1000;
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('pt-BR')}]`, ...a);
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const variar = (ms) => Math.round(ms * (0.8 + Math.random() * 0.4)); // ±20% para não parecer robô

r.garantirArquivos();

// ---------- modo simulação ----------
if (SIMULAR) {
  const config = r.lerConfig();
  let produtos = r.lerProdutos();
  if (!Object.values(produtos).some((l) => r.ativos(l).length)) {
    console.log('(Você ainda não cadastrou produtos — mostrando os de exemplo.)');
    produtos = JSON.parse(fs.readFileSync(path.join(__dirname, 'produtos.exemplo.json'), 'utf8'));
    for (const l of Object.values(produtos)) for (const p of l) p.link = p.link.replace(/SEU-LINK|LINK-DO-PRODUTO/, 'exemplo');
  }
  const estado = { ...r.lerEstado(), ultimoEnvio: {} };
  const qtd = Number(process.argv[process.argv.indexOf('--simular') + 1]) || 12;
  for (let i = 1; i <= qtd; i++) {
    const escolha = r.proximoProduto(config, produtos, estado);
    if (!escolha) { console.log('Nenhum produto cadastrado em achadinhos/produtos.json'); break; }
    r.registrarEnvio(estado, escolha);
    console.log(`\n===== POST ${i} — ${escolha.loja}${escolha.produto.afiliado ? ' (seu afiliado)' : ''} =====\n${r.textoProduto(escolha.loja, escolha.produto)}`);
    for (const extra of r.extrasDepoisDoPost(config, estado)) console.log(`\n----- mensagem extra -----\n${extra}`);
  }
  console.log(`\n===== DIVULGAÇÃO (outros grupos) =====\n${r.textoDivulgacao(config)}`);
  process.exit(0);
}

// ---------- WhatsApp ----------
const pino = require('pino');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');

const PASTA_LOGIN = path.join(r.PASTA_DADOS, 'login-whatsapp');
let sock = null;
let conectado = false;
const iniciadoEm = Math.floor(Date.now() / 1000);
const NUMERO_EXEMPLO = '5511999999999';
let proximoPostEm = 0;
let enviando = false;
let primeiraConexao = true;

// Aceita o número com ou sem +, espaço, traço e o 55 do Brasil.
function numeroParaCodigo() {
  let n = String(r.lerConfig().numeroWhatsApp || '').replace(/\D/g, '');
  if (!n || n === NUMERO_EXEMPLO) return null;
  if (n.length === 10 || n.length === 11) n = '55' + n; // só DDD + número
  return n;
}

async function conectar() {
  fs.mkdirSync(PASTA_LOGIN, { recursive: true });
  let { state, saveCreds } = await useMultiFileAuthState(PASTA_LOGIN);
  // Tentativa anterior que não terminou de conectar deixa um login "pela metade": começa do zero.
  if (primeiraConexao && !state.creds.registered) {
    fs.rmSync(PASTA_LOGIN, { recursive: true, force: true });
    fs.mkdirSync(PASTA_LOGIN, { recursive: true });
    ({ state, saveCreds } = await useMultiFileAuthState(PASTA_LOGIN));
  }
  primeiraConexao = false;
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
  const s = makeWASocket({ auth: state, version, logger: pino({ level: 'silent' }), browser: Browsers.ubuntu('Chrome'), markOnlineOnConnect: false });
  sock = s;
  let pediuCodigo = false;

  s.ev.on('creds.update', saveCreds);
  s.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      const numero = numeroParaCodigo();
      if (numero && !pediuCodigo) {
        pediuCodigo = true;
        try {
          const codigo = await s.requestPairingCode(numero);
          const bonito = String(codigo).replace(/^(.{4})(.{4})$/, '$1-$2');
          log(`\n\n📱 CÓDIGO DE CONEXÃO para o número +${numero}:\n\n        ${bonito}\n\n` +
            'No celular desse número, abra o WhatsApp → ⋮ (três pontinhos) → Dispositivos conectados → Conectar dispositivo\n' +
            '→ toque em "Conectar com número de telefone" (embaixo, em vez de ler o QR Code) → digite o código.\n' +
            'O código vale por pouco tempo. Se aparecer um código novo aqui, use sempre o MAIS NOVO.\n');
        } catch (e) { log('Não consegui gerar o código:', e.message, '— confira o numeroWhatsApp no config.json (ex.: 5511987654321).'); }
      } else if (!numero) {
        log('Leia este QR Code no WhatsApp (Aparelhos conectados → Conectar aparelho):');
        console.log(await QRCode.toString(qr, { type: 'terminal', small: true }));
      }
    }
    if (connection === 'open') {
      conectado = true;
      log(`✅ WhatsApp conectado (${(s.user?.id || '').split(':')[0]})`);
      if (!proximoPostEm) proximoPostEm = Date.now() + 15 * 1000;
    }
    if (connection === 'close') {
      conectado = false;
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        log('WhatsApp foi desconectado pelo celular. Apague a pasta data/achadinhos/login-whatsapp e ligue de novo para conectar.');
        process.exit(1);
      }
      log('Conexão caiu, reconectando...');
      setTimeout(() => conectar().catch((e) => log('Erro ao reconectar:', e.message)), 3000);
    }
  });

  s.ev.on('messages.upsert', ({ messages }) => {
    for (const m of messages) tratarComando(m).catch((e) => log('Erro no comando:', e.message));
  });
}

// Aceita o nome do grupo (do jeito que aparece no WhatsApp) ou o ID (termina em @g.us).
async function acharGrupos(nomes) {
  const todos = Object.values(await sock.groupFetchAllParticipating());
  const norm = (t) => String(t || '').trim().toLowerCase();
  const achados = [];
  for (const nome of nomes.filter(Boolean)) {
    const g = String(nome).endsWith('@g.us') ? todos.find((x) => x.id === nome) : todos.find((x) => norm(x.subject) === norm(nome));
    if (g) achados.push(g);
    else log(`⚠️ Grupo não encontrado: "${nome}". No "Conversar comigo" mande !grupos e depois !usargrupo com o número.`);
  }
  return achados;
}

async function gruposOrdenados() {
  return Object.values(await sock.groupFetchAllParticipating()).sort((a, b) => String(a.subject).localeCompare(String(b.subject), 'pt-BR'));
}

async function enviarProduto(jid, loja, produto) {
  const texto = r.textoProduto(loja, produto);
  if (produto.imagem) {
    try {
      return await sock.sendMessage(jid, { image: { url: produto.imagem }, caption: texto });
    } catch (e) { log('Imagem falhou, enviando só texto:', e.message); }
  }
  return sock.sendMessage(jid, { text: texto });
}

// Posta o próximo produto no grupo de achadinhos (e as mensagens extras, se for a vez delas).
async function postar(forcarLoja) {
  if (enviando) return 'Já estou enviando, aguarde.';
  enviando = true;
  try {
    const config = r.lerConfig();
    const [grupo] = await acharGrupos([config.grupoAchadinhos]);
    if (!grupo) return 'Ainda não sei qual é o seu grupo. Mande *!grupos* e depois *!usargrupo* com o número dele.';
    const estado = r.lerEstado();
    const escolha = r.proximoProduto(config, r.lerProdutos(), estado, forcarLoja);
    if (!escolha) return forcarLoja ? `Não tem produto cadastrado da ${r.LOJAS[forcarLoja].nome}. Use !add ou !addafiliado.` : 'Nenhum produto cadastrado ainda. Use !addafiliado ou !add (veja !ajuda).';
    await enviarProduto(grupo.id, escolha.loja, escolha.produto);
    r.registrarEnvio(estado, escolha);
    const extras = r.extrasDepoisDoPost(config, estado);
    r.salvarEstado(estado);
    log(`📤 ${r.LOJAS[escolha.loja].nome}${escolha.produto.afiliado ? ' (afiliado)' : ''}: ${escolha.produto.titulo}`);
    for (const texto of extras) {
      await esperar(variar(20 * 1000));
      await sock.sendMessage(grupo.id, { text: texto });
      log('📤 mensagem extra (vitrine/convite)');
    }
    return `Enviado: ${r.LOJAS[escolha.loja].nome} — ${escolha.produto.titulo}`;
  } finally {
    enviando = false;
  }
}

// Manda o convite do seu grupo nos grupos de divulgação, um de cada vez, com pausa entre eles.
async function divulgar() {
  const config = r.lerConfig();
  if (!r.linkReal(config.linkConviteGrupo)) return 'Falta o link de convite do grupo. Use !usargrupo (sendo admin) ou !convite https://chat.whatsapp.com/...';
  const grupos = await acharGrupos(config.divulgacao?.grupos || []);
  const estado = r.lerEstado();
  estado.ultimaDivulgacao = Date.now();
  r.salvarEstado(estado);
  let ok = 0;
  for (const [i, g] of grupos.entries()) {
    if (i > 0) await esperar(variar(Number(config.divulgacao?.esperaEntreGruposSegundos || 90) * 1000));
    try {
      await sock.sendMessage(g.id, { text: r.textoDivulgacao(config) });
      ok++;
      log(`📢 Divulgado em: ${g.subject}`);
    } catch (e) { log(`Falhou em ${g.subject}:`, e.message); }
  }
  return `Divulgação enviada em ${ok} de ${grupos.length} grupo(s).`;
}

// Busca ofertas novas na Shopee quando estão acabando as que ainda não foram postadas.
let ultimaBuscaShopee = 0;
async function buscarShopee(palavra, manual) {
  const config = r.lerConfig();
  ultimaBuscaShopee = Date.now();
  const { termo, produtos } = await busca.buscarShopee(config, palavra);
  const novos = busca.adicionarNovos('shopee', produtos, r.lerEstado());
  log(`🔎 Shopee "${termo}": ${produtos.length} ofertas, ${novos} novas${manual ? ' (manual)' : ''}`);
  return `🔎 Busquei *${termo}* na Shopee: ${produtos.length} ofertas, *${novos} novas* adicionadas (já com seu link de afiliado).`;
}

async function reabastecer(config, estado) {
  if (!config.shopee?.appId || !config.shopee?.secret) return;
  if (busca.naoPostados('shopee', estado) >= 5 || Date.now() - ultimaBuscaShopee < 15 * MIN) return;
  await buscarShopee().catch((e) => log('⚠️', e.message));
}

// Relógio do bot: confere a cada 30 s se já é hora de postar ou divulgar.
async function relogio() {
  try {
    const config = r.lerConfig();
    const estado = r.lerEstado();
    if (!conectado || estado.pausado || !r.dentroDoHorario(config)) return;
    await reabastecer(config, estado);
    if (Date.now() >= proximoPostEm && !enviando) {
      proximoPostEm = Date.now() + variar(Number(config.intervaloMinutos || 30) * MIN);
      const msg = await postar();
      if (!msg.startsWith('Enviado')) log('⚠️', msg);
    }
    const d = config.divulgacao || {};
    if (d.ativo && d.grupos?.length && Date.now() - estado.ultimaDivulgacao >= Number(d.intervaloHoras || 6) * 60 * MIN) {
      await divulgar();
    }
  } catch (e) {
    log('Erro:', e.message);
  }
}

// ---------- comandos (mande no "Conversar comigo" do seu WhatsApp) ----------
const AJUDA = `🤖 *Comandos do bot de achadinhos*

*!grupos* — lista seus grupos numerados
*!usargrupo 2* — escolhe o grupo nº 2 como seu grupo de achadinhos
*!vitrine https://...* — salva seu link de afiliado/vitrine da Shein
*!convite https://chat.whatsapp.com/...* — salva o link de convite do grupo
*!intervalo 30* — posta a cada 30 minutos
*!shopeechave APPID SENHA* — liga a busca automática da Shopee
*!buscar shopee* (ou *!buscar shopee fone*) — busca ofertas agora
*!palavras fone, maquiagem, cozinha* — o que buscar na Shopee
*!status* — como o bot está
*!enviar* — posta o próximo produto agora
*!enviar shein* (ou ml / shopee) — posta dessa loja agora
*!divulgar* — manda o convite nos grupos de divulgação agora
*!pausar* / *!voltar* — para ou volta a postar
*!lista shein* (ou ml / shopee) — produtos cadastrados
*!add shein link | título | preço | preço antigo | cupom* — cadastra produto
*!addafiliado link | título | preço | preço antigo* — produto Shein com SEU link de afiliado
*!remover shein 3* — remove o produto nº 3 da lista
*!foto shein 3 https://link-da-imagem* — coloca foto no produto nº 3`;

function textoDaMensagem(m) {
  const x = m.message || {};
  return x.conversation || x.extendedTextMessage?.text || x.ephemeralMessage?.message?.extendedTextMessage?.text || '';
}

const base = (jid) => String(jid || '').split('@')[0].split(':')[0];

// Vale comando que você manda no "Conversar comigo" ou que vem de um número em "donos".
function ehDono(m) {
  const chat = base(m.key.remoteJid);
  if (m.key.fromMe) return [sock.user?.id, sock.user?.lid].filter(Boolean).map(base).includes(chat);
  const donos = (r.lerConfig().donos || []).map((n) => String(n).replace(/\D/g, ''));
  return donos.includes(chat);
}

async function tratarComando(m) {
  const texto = textoDaMensagem(m).trim();
  if (!texto.startsWith('!') || Number(m.messageTimestamp) < iniciadoEm - 5) return;
  if (String(m.key.remoteJid).endsWith('@g.us') || !ehDono(m)) return;
  const responder = (t) => sock.sendMessage(m.key.remoteJid, { text: t });
  const [cmd, ...resto] = texto.slice(1).split(/\s+/);
  const args = resto.join(' ');

  switch (cmd.toLowerCase()) {
    case 'ajuda': case 'menu': case 'comandos':
      return responder(AJUDA);
    case 'status': {
      const c = r.lerConfig(); const e = r.lerEstado(); const p = r.lerProdutos();
      const falta = Math.max(0, Math.round((proximoPostEm - Date.now()) / MIN));
      return responder(`📊 *Status*\n${e.pausado ? '⏸️ Pausado' : '▶️ Postando'} | horário ${c.horarioInicio}h–${c.horarioFim}h ${r.dentroDoHorario(c) ? '(agora dentro)' : '(agora fora)'}\nPróximo post em ~${falta} min\nPosts feitos: ${e.totalPosts} (Shein: ${e.totalShein}, seus afiliados: ${e.afiliadosShein})\nProdutos: Shein ${r.ativos(p.shein).length} (${r.ativos(p.shein).filter((x) => x.afiliado).length} afiliados) | Mercado Livre ${r.ativos(p.mercadolivre).length} | Shopee ${r.ativos(p.shopee).length}`);
    }
    case 'enviar': case 'postar': {
      const loja = args ? r.lojaPorApelido(args) : undefined;
      if (args && !loja) return responder('Loja inválida. Use: shein, ml ou shopee.');
      return responder(await postar(loja));
    }
    case 'divulgar':
      return responder(await divulgar());
    case 'pausar': case 'voltar': case 'retomar': {
      const e = r.lerEstado(); e.pausado = cmd.toLowerCase() === 'pausar'; r.salvarEstado(e);
      return responder(e.pausado ? '⏸️ Bot pausado. Mande !voltar para continuar.' : '▶️ Bot voltou a postar.');
    }
    case 'grupos': {
      const gs = await gruposOrdenados();
      return responder(`👥 *Seus grupos*\n\n${gs.map((g, i) => `*${i + 1}.* ${g.subject}`).join('\n') || 'Nenhum grupo.'}\n\nPara escolher o grupo de achadinhos mande, por exemplo: *!usargrupo 2*`);
    }
    case 'usargrupo': {
      const gs = await gruposOrdenados();
      const g = gs[Number(args) - 1] || gs.find((x) => x.subject.trim().toLowerCase() === args.trim().toLowerCase());
      if (!g) return responder('Não achei esse grupo. Mande *!grupos* e depois *!usargrupo* com o número dele.');
      const c = r.lerConfig();
      c.grupoAchadinhos = g.id;
      let extra = '';
      try {
        c.linkConviteGrupo = 'https://chat.whatsapp.com/' + (await sock.groupInviteCode(g.id));
        extra = `\n🔗 Link de convite salvo: ${c.linkConviteGrupo}`;
      } catch {
        extra = '\n⚠️ Não consegui pegar o link de convite (o número precisa ser admin). Mande *!convite* com o link do grupo.';
      }
      r.salvarConfig(c);
      proximoPostEm = Date.now() + 10 * 1000;
      return responder(`✅ Grupo de achadinhos: *${g.subject}*${extra}\n\nO primeiro post sai em instantes (se tiver produto cadastrado e estiver no horário).`);
    }
    case 'vitrine': case 'convite': {
      if (!/^https?:\/\//.test(args)) return responder(`Use: !${cmd} https://...`);
      const c = r.lerConfig();
      if (cmd.toLowerCase() === 'vitrine') c.shein = { ...(c.shein || {}), linkVitrine: args.trim() };
      else c.linkConviteGrupo = args.trim();
      r.salvarConfig(c);
      return responder(cmd.toLowerCase() === 'vitrine' ? '✅ Link da sua vitrine Shein salvo.' : '✅ Link de convite do grupo salvo.');
    }
    case 'shopeechave': {
      const [appId, secret] = resto;
      if (!appId || !secret) return responder('Use: !shopeechave APPID SENHA (pegue em affiliate.shopee.com.br → Open API)');
      const c = r.lerConfig(); c.shopee = { ...(c.shopee || {}), appId, secret }; r.salvarConfig(c);
      try { return responder('✅ Chave da Shopee salva. Testando...\n\n' + (await buscarShopee(undefined, true))); }
      catch (e) { return responder('Salvei a chave, mas a busca falhou:\n' + e.message); }
    }
    case 'buscar': {
      const [apelido, ...palavra] = resto;
      if (r.lojaPorApelido(apelido) !== 'shopee') return responder('Por enquanto a busca automática é só na Shopee: !buscar shopee (ou !buscar shopee fone bluetooth)');
      try { return responder(await buscarShopee(palavra.join(' ') || undefined, true)); }
      catch (e) { return responder(e.message); }
    }
    case 'palavras': {
      const lista = args.split(',').map((x) => x.trim()).filter(Boolean);
      const c = r.lerConfig();
      if (!lista.length) return responder(`🔎 Palavras de busca na Shopee:\n${(c.shopee?.palavrasChave?.length ? c.shopee.palavrasChave : busca.PALAVRAS_PADRAO).join(', ')}\n\nPara trocar: !palavras fone bluetooth, maquiagem, cozinha`);
      c.shopee = { ...(c.shopee || {}), palavrasChave: lista }; r.salvarConfig(c);
      return responder(`✅ Vou buscar na Shopee: ${lista.join(', ')}`);
    }
    case 'intervalo': {
      const min = Number(args);
      if (!(min >= 5)) return responder('Use: !intervalo 30 (em minutos, mínimo 5)');
      const c = r.lerConfig(); c.intervaloMinutos = min; r.salvarConfig(c);
      proximoPostEm = Math.min(proximoPostEm, Date.now() + min * MIN);
      return responder(`✅ Vou postar a cada ~${min} minutos.`);
    }
    case 'lista': {
      const loja = r.lojaPorApelido(args);
      if (!loja) return responder('Use: !lista shein (ou ml / shopee)');
      const lista = r.lerProdutos()[loja];
      return responder(`📋 *${r.LOJAS[loja].nome}* (${lista.length})\n\n${lista.map((p, i) => `${i + 1}. ${p.afiliado ? '⭐ ' : ''}${p.ativo === false ? '(desativado) ' : ''}${p.titulo} — R$ ${p.preco || '?'}`).join('\n') || 'Vazio.'}\n\n⭐ = seu link de afiliado`);
    }
    case 'add': case 'addafiliado': {
      const afiliado = cmd.toLowerCase() === 'addafiliado';
      let corpo = args;
      let loja = 'shein';
      if (!afiliado) {
        loja = r.lojaPorApelido(corpo.split(/\s+/)[0]);
        if (!loja) return responder('Use: !add shein link | título | preço | preço antigo | cupom');
        corpo = corpo.split(/\s+/).slice(1).join(' ');
      }
      const [link, titulo, preco, precoAntigo, cupom] = corpo.split('|').map((s) => s.trim());
      if (!/^https?:\/\//.test(link || '')) return responder('Faltou o link (começando com http). Ex.: !add shopee https://... | Fone bluetooth | 49,90 | 99,90');
      const produtos = r.lerProdutos();
      const novo = { titulo: titulo || 'Oferta imperdível', preco: preco || '', precoAntigo: precoAntigo || '', link, imagem: '', cupom: cupom || '' };
      if (loja === 'shein') novo.afiliado = afiliado;
      produtos[loja].push(novo);
      r.salvarProdutos(produtos);
      return responder(`✅ Adicionado na ${r.LOJAS[loja].nome}${afiliado ? ' como seu afiliado ⭐' : ''} (nº ${produtos[loja].length}).`);
    }
    case 'remover': case 'foto': {
      const [apelido, num, url] = resto;
      const loja = r.lojaPorApelido(apelido);
      const produtos = loja && r.lerProdutos();
      const i = Number(num) - 1;
      if (!loja || !produtos[loja][i]) return responder(`Use: !${cmd} shein 3${cmd === 'foto' ? ' https://link-da-imagem' : ''} (veja os números com !lista)`);
      if (cmd.toLowerCase() === 'remover') {
        const [tirado] = produtos[loja].splice(i, 1);
        r.salvarProdutos(produtos);
        return responder(`🗑️ Removido: ${tirado.titulo}`);
      }
      if (!/^https?:\/\//.test(url || '')) return responder('Faltou o link da imagem.');
      produtos[loja][i].imagem = url;
      r.salvarProdutos(produtos);
      return responder(`🖼️ Foto colocada em: ${produtos[loja][i].titulo}`);
    }
    default:
      return responder('Comando não reconhecido. Mande !ajuda');
  }
}

log('🛍️ Bot de achadinhos iniciando... (comandos: mande !ajuda no "Conversar comigo" do seu WhatsApp)');
try { r.lerConfig(); r.lerProdutos(); } catch (e) { log(e.message); process.exit(1); }
conectar().catch((e) => { log('Erro ao conectar:', e.message); process.exit(1); });
setInterval(relogio, 30 * 1000);
