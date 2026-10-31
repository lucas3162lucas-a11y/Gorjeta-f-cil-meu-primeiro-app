// Melty Droid: app Android (WebView) que instala, cria e abre misturas de jogos, sem root.

import { JOGOS, jogo } from "./motor/jogos.js";
import { montarMistura, checarMistura, empacotarMistura, slug } from "./motor/gerador.js";
import { criarComIA, IA_PADRAO } from "./motor/ia.js";
import * as nativo from "./nativo.js";

const $ = (s, el = document) => el.querySelector(s);
const CHAVE_MISTURAS = "meltydroid.misturas";
const CHAVE_AJUSTES = "meltydroid.ajustes";
const FORMATO_EXPORT = "mistura/1";

// ---------- armazenamento ----------

function ler(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
}
function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    avisar("Não deu para salvar no aparelho.", true);
  }
}
const minhas = () => ler(CHAVE_MISTURAS, []);
const ajustes = () => ({ iaUrl: IA_PADRAO.url, iaModelo: IA_PADRAO.modelo, iaChave: "", catalogoUrl: "", ...ler(CHAVE_AJUSTES, {}) });

function guardarMistura(m) {
  const lista = minhas().filter((x) => x.meta.id !== m.meta.id);
  lista.unshift(m);
  gravar(CHAVE_MISTURAS, lista);
}

// ---------- utilidades de tela ----------

let timerAviso;
function avisar(texto, erro = false) {
  const el = $("#aviso");
  el.textContent = texto;
  el.classList.toggle("erro", erro);
  el.classList.add("visivel");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => el.classList.remove("visivel"), 3500);
}

function el(tag, props = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "style") e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) e.append(f);
  return e;
}

function iconeJogo(jogoId) {
  const j = JOGOS[jogoId];
  return el("div", { class: "icone", style: `background:${j?.cor ?? "#555"}` }, (j?.nome ?? "?")[0]);
}

function abrirJanela(titulo, ...conteudo) {
  $("#janela-titulo").textContent = titulo;
  $("#janela-corpo").replaceChildren(...conteudo.filter((c) => c != null && c !== false));
  $("#janela").showModal();
}
function fecharJanela() {
  if ($("#janela").open) $("#janela").close();
}

// ---------- navegação ----------

const historico = [];
function ir(tela, empilhar = true) {
  const atual = document.querySelector(".tela.ativa")?.id.replace("tela-", "");
  if (empilhar && atual && atual !== tela) historico.push(atual);
  document.querySelectorAll(".tela").forEach((t) => t.classList.toggle("ativa", t.id === `tela-${tela}`));
  document.querySelectorAll(".abas button").forEach((b) => b.classList.toggle("ativa", b.dataset.ir === tela));
  window.scrollTo(0, 0);
  if (tela === "inicio") desenharInicio();
}

// Chamado pelo botão Voltar do Android. Retorna true se tratou.
globalThis.voltar = () => {
  if ($("#janela").open) {
    fecharJanela();
    return true;
  }
  const anterior = historico.pop();
  if (anterior) {
    ir(anterior, false);
    return true;
  }
  return false;
};

// ---------- conteúdo do app ----------

const cacheTemplates = {};
async function template(jogoId) {
  if (cacheTemplates[jogoId]) return cacheTemplates[jogoId];
  const j = jogo(jogoId);
  const arquivos = {};
  for (const caminho of j.template) {
    const r = await fetch(`conteudo/templates/${jogoId}/${caminho}`);
    if (!r.ok) throw new Error(`Não achei o template ${jogoId}/${caminho}.`);
    arquivos[caminho] = await r.text();
  }
  return (cacheTemplates[jogoId] = arquivos);
}

let receitas = [];
async function carregarReceitas() {
  const ids = ["souls", "sobrevivencia"];
  receitas = await Promise.all(ids.map((id) => fetch(`conteudo/receitas/${id}.json`).then((r) => r.json())));
}

let catalogo = [];
async function carregarCatalogo() {
  const local = await fetch("conteudo/catalogo.json").then((r) => r.json());
  catalogo = local.misturas.map((m) => ({ ...m, fonte: "app" }));
  const url = ajustes().catalogoUrl;
  if (!url) return;
  const r = await nativo.http(url);
  if (r.status !== 200) {
    avisar(`Catálogo online indisponível (${r.status || "sem internet"}).`, true);
    return;
  }
  try {
    const online = JSON.parse(r.corpo);
    for (const m of online.misturas ?? []) {
      if (!JOGOS[m.jogo] || !m.id || !m.titulo) continue;
      catalogo.push({ ...m, id: "online:" + m.id, fonte: "online" });
    }
  } catch {
    avisar("O catálogo online não é um JSON válido.", true);
  }
}

// ---------- ações com misturas ----------

function instalar(m) {
  let pacote;
  try {
    pacote = empacotarMistura(m);
  } catch (e) {
    abrirJanela("Não deu para instalar", el("p", { class: "status erro" }, e.message));
    return;
  }
  const j = jogo(m.meta.jogo);
  const instalado = nativo.jogosInstalados([j.pacoteAndroid])[j.pacoteAndroid];
  let resultado;
  if (j.instalacao === "abrir") {
    resultado = nativo.abrirComJogo(pacote.nomeArquivo, pacote.bytes, pacote.mime, j.pacoteAndroid);
  } else {
    resultado = nativo.salvarDownloads(pacote.nomeArquivo, pacote.bytes, pacote.mime);
  }

  const ok = resultado === "ok" || resultado === "baixado";
  abrirJanela(
    ok ? `Instalando ${m.meta.nome}` : "Algo deu errado",
    !ok && el("p", { class: "status erro" }, String(resultado)),
    nativo.noApp ? null : el("p", { class: "dica" }, "Você está no navegador: o arquivo foi baixado. No app ele abre direto no jogo."),
    !instalado && nativo.noApp && el("p", { class: "dica" }, `${j.nome} não parece estar instalado neste celular.`),
    el("ol", { class: "passos" }, j.passos.map((p) => el("li", {}, p))),
    el(
      "div",
      { class: "acoes" },
      el("button", { class: "botao principal", onclick: () => jogar(m.meta.jogo) }, `Abrir ${j.nome}`),
      el("button", { class: "botao", onclick: () => compartilharPacote(m) }, "Enviar arquivo")
    )
  );
}

function jogar(jogoId) {
  const j = jogo(jogoId);
  if (!nativo.abrirJogo(j.pacoteAndroid)) {
    avisar(`${j.nome} não está instalado. Abrindo a loja…`);
    nativo.abrirLoja(j.pacoteAndroid);
  }
}

function compartilharPacote(m) {
  try {
    const p = empacotarMistura(m);
    const r = nativo.compartilhar(p.nomeArquivo, p.bytes, p.mime);
    if (r !== "ok") avisar(r, true);
  } catch (e) {
    avisar(e.message, true);
  }
}

function exportar(m) {
  const conteudo = JSON.stringify({ formato: FORMATO_EXPORT, meta: m.meta, arquivos: m.arquivos }, null, 2);
  const r = nativo.compartilhar(`${m.meta.modname}.mistura.json`, new TextEncoder().encode(conteudo), "application/json");
  if (r !== "ok") avisar(r, true);
}

function verCodigo(m) {
  const caminhos = Object.keys(m.arquivos).sort();
  const pre = el("pre", { class: "codigo" });
  const mostrar = (c) => (pre.textContent = m.arquivos[c]);
  const sel = el("select", { onchange: (e) => mostrar(e.target.value) }, caminhos.map((c) => el("option", { value: c }, c)));
  const principal = jogo(m.meta.jogo).arquivoPrincipal;
  sel.value = caminhos.includes(principal) ? principal : caminhos[0];
  mostrar(sel.value);
  abrirJanela(m.meta.nome, sel, pre);
}

function apagar(m) {
  abrirJanela(
    "Apagar mistura?",
    el("p", { class: "dica" }, `"${m.meta.nome}" sai do app. O que já foi instalado no jogo continua lá (remova pelo próprio jogo).`),
    el(
      "div",
      { class: "acoes" },
      el(
        "button",
        {
          class: "botao perigo",
          onclick: () => {
            gravar(CHAVE_MISTURAS, minhas().filter((x) => x.meta.id !== m.meta.id));
            fecharJanela();
            desenharInicio();
            avisar("Mistura apagada.");
          },
        },
        "Apagar"
      ),
      el("button", { class: "botao", onclick: fecharJanela }, "Cancelar")
    )
  );
}

function depoisDeCriar(m) {
  guardarMistura(m);
  ir("inicio");
  abrirJanela(
    "Mistura pronta!",
    el("p", {}, el("strong", {}, m.meta.nome)),
    el("p", { class: "dica" }, m.meta.descricao),
    el(
      "div",
      { class: "acoes" },
      el("button", { class: "botao principal", onclick: () => instalar(m) }, "Instalar no jogo"),
      el("button", { class: "botao", onclick: () => verCodigo(m) }, "Ver código")
    )
  );
}

// ---------- telas ----------

function desenharInicio() {
  const pacotes = Object.values(JOGOS).map((j) => j.pacoteAndroid);
  const instalados = nativo.jogosInstalados(pacotes);
  $("#lista-jogos").replaceChildren(
    ...Object.entries(JOGOS).map(([id, j]) => {
      const tem = instalados[j.pacoteAndroid];
      return el(
        "div",
        { class: "jogo" },
        el("div", { class: "faixa", style: `background:${j.cor}` }),
        el("div", { class: "nome" }, j.nome),
        el("div", { class: "sub" }, j.subtitulo),
        el("div", { class: `estado ${tem ? "sim" : "nao"}` }, tem ? "Instalado" : nativo.noApp ? "Não instalado" : "—"),
        el(
          "button",
          { class: "botao pequeno", onclick: () => (tem ? jogar(id) : nativo.abrirLoja(j.pacoteAndroid)) },
          tem ? "Abrir" : "Ver na loja"
        )
      );
    })
  );

  const lista = minhas();
  if (!lista.length) {
    $("#lista-minhas").replaceChildren(
      el("div", { class: "vazio" }, "Nenhuma mistura ainda. Pegue uma no ", el("a", { href: "#", onclick: (e) => (e.preventDefault(), ir("catalogo")) }, "Catálogo"), " ou crie a sua.")
    );
    return;
  }
  $("#lista-minhas").replaceChildren(
    ...lista.map((m) => {
      const j = JOGOS[m.meta.jogo];
      const origem = { ia: "feita com IA", receita: "receita", importada: "importada", catalogo: "catálogo" }[m.meta.origem] ?? "";
      return el(
        "div",
        { class: "cartao" },
        el(
          "div",
          { class: "cabeca" },
          iconeJogo(m.meta.jogo),
          el("div", {}, el("div", { class: "nome" }, m.meta.nome), el("div", { class: "meta" }, `${j?.nome ?? m.meta.jogo} · ${origem}`))
        ),
        el("p", { class: "desc" }, m.meta.descricao),
        el(
          "div",
          { class: "acoes" },
          el("button", { class: "botao principal pequeno", onclick: () => instalar(m) }, "Instalar"),
          el("button", { class: "botao pequeno", onclick: () => jogar(m.meta.jogo) }, "Jogar"),
          el("button", { class: "botao pequeno", onclick: () => exportar(m) }, "Compartilhar"),
          el("button", { class: "botao pequeno fantasma", onclick: () => verCodigo(m) }, "Código"),
          el("button", { class: "botao pequeno fantasma perigo", onclick: () => apagar(m) }, "Apagar")
        )
      );
    })
  );
}

let filtroCatalogo = "todos";
function desenharCatalogo() {
  const filtros = [["todos", "Todos"], ...Object.entries(JOGOS).map(([id, j]) => [id, j.nome])];
  $("#filtros-catalogo").replaceChildren(
    ...filtros.map(([id, nome]) =>
      el("button", { class: filtroCatalogo === id ? "ativo" : "", onclick: () => ((filtroCatalogo = id), desenharCatalogo()) }, nome)
    )
  );
  const itens = catalogo.filter((c) => filtroCatalogo === "todos" || c.jogo === filtroCatalogo);
  if (!itens.length) {
    $("#lista-catalogo").replaceChildren(el("div", { class: "vazio" }, "Nada aqui ainda."));
    return;
  }
  $("#lista-catalogo").replaceChildren(
    ...itens.map((c) =>
      el(
        "div",
        { class: "cartao" },
        el(
          "div",
          { class: "cabeca" },
          iconeJogo(c.jogo),
          el("div", {}, el("div", { class: "nome" }, c.titulo), el("div", { class: "meta" }, `${JOGOS[c.jogo].nome}${c.fonte === "online" ? " · online" : ""}`))
        ),
        el("p", { class: "desc" }, c.descricao ?? ""),
        el("div", { class: "etiquetas" }, (c.tags ?? []).map((t) => el("span", { class: "etiqueta" }, t))),
        el("div", { class: "acoes" }, el("button", { class: "botao principal pequeno", onclick: () => pegarDoCatalogo(c) }, "Adicionar"))
      )
    )
  );
}

async function pegarDoCatalogo(c) {
  try {
    // Já adicionada antes: reaproveita (mesmos UUIDs, então o jogo atualiza em vez de duplicar).
    const existente = minhas().find((x) => x.meta.catalogoId === c.id);
    if (existente) {
      depoisDeCriar(existente);
      return;
    }
    let m;
    if (c.mistura) {
      m = { meta: { ...c.mistura.meta, origem: "catalogo" }, arquivos: c.mistura.arquivos };
    } else {
      const receita = typeof c.receita === "object" ? c.receita : receitas.find((r) => r.id === c.receita);
      if (!receita) throw new Error(`Receita "${c.receita}" não encontrada.`);
      m = montarMistura({
        jogoId: c.jogo,
        nome: c.titulo,
        descricao: c.descricao,
        template: await template(c.jogo),
        receita: structuredClone(receita),
        origem: "catalogo",
      });
    }
    m.meta.catalogoId = c.id;
    const { erros } = checarMistura(m);
    if (erros.length) throw new Error(erros.join("\n"));
    depoisDeCriar(m);
  } catch (e) {
    abrirJanela("Não deu para adicionar", el("p", { class: "status erro" }, e.message));
  }
}

// --- Criar ---

let jogoEscolhido = "minecraft-bedrock";
const SUGESTOES = [
  "Combate soulslike: estamina, esquiva e chefes com barra de vida",
  "Chuva de meteoros que explodem a cada 2 minutos",
  "Cada mob que eu matar vira um mais forte",
  "Super pulo e planar como num jogo de herói",
  "Modo fuga: um caçador me persegue a noite toda",
];

function desenharCriar() {
  $("#escolha-jogo").replaceChildren(
    ...Object.entries(JOGOS).map(([id, j]) =>
      el("button", { class: id === jogoEscolhido ? "ativo" : "", onclick: () => ((jogoEscolhido = id), desenharCriar()) }, j.nome)
    )
  );
  $("#sugestoes").replaceChildren(...SUGESTOES.map((s) => el("button", { onclick: () => ($("#pedido").value = s) }, s)));

  const sel = $("#receita-base");
  if (!sel.options.length) {
    sel.replaceChildren(...receitas.map((r) => el("option", { value: r.id }, r.nome)));
    sel.addEventListener("change", desenharCamposReceita);
    desenharCamposReceita();
  }
}

const CAMPOS_RECEITA = [
  ["estamina", "max", "Estamina máxima"],
  ["estamina", "regenPorSegundo", "Recuperação/s"],
  ["esquiva", "custo", "Custo da esquiva"],
  ["frasco", "cargas", "Cargas do frasco"],
  ["frasco", "cura", "Cura por gole"],
  ["fogueira", "raio", "Alcance da fogueira"],
];
function desenharCamposReceita() {
  const r = receitas.find((x) => x.id === $("#receita-base").value);
  $("#campos-receita").replaceChildren(
    ...CAMPOS_RECEITA.map(([g, c, rotulo]) =>
      el(
        "div",
        {},
        el("label", { class: "rotulo", for: `campo-${g}-${c}` }, rotulo),
        el("input", { id: `campo-${g}-${c}`, type: "number", min: "0", step: "any", value: String(r.mecanicas[g][c]) })
      )
    )
  );
}

async function criarPorReceita() {
  try {
    const base = structuredClone(receitas.find((x) => x.id === $("#receita-base").value));
    for (const [g, c] of CAMPOS_RECEITA) {
      const v = Number($(`#campo-${g}-${c}`).value);
      if (!Number.isFinite(v) || v < 0) throw new Error("Os números precisam ser maiores ou iguais a zero.");
      base.mecanicas[g][c] = g === "frasco" && c === "cargas" ? Math.round(v) : v;
    }
    const nome = $("#nome-receita").value.trim() || `${JOGOS[jogoEscolhido].nome} ${base.nome}`;
    const m = montarMistura({
      jogoId: jogoEscolhido,
      nome,
      descricao: base.descricao,
      template: await template(jogoEscolhido),
      receita: base,
      origem: "receita",
    });
    depoisDeCriar(m);
  } catch (e) {
    avisar(e.message, true);
  }
}

async function criarIA() {
  const status = $("#status-ia");
  const botao = $("#botao-criar-ia");
  const a = ajustes();
  status.className = "status";
  if (!a.iaChave) {
    status.textContent = "Primeiro coloque sua chave da API em Ajustes.";
    status.classList.add("erro");
    return;
  }
  botao.disabled = true;
  try {
    const tpl = await template(jogoEscolhido);
    const j = jogo(jogoEscolhido);
    const resultado = await criarComIA({
      jogoId: jogoEscolhido,
      pedido: $("#pedido").value,
      chave: a.iaChave,
      url: a.iaUrl,
      modelo: a.iaModelo,
      exemplo: tpl[j.arquivoPrincipal],
      post: (url, headers, corpo) => nativo.http(url, { metodo: "POST", headers, corpo }),
      aoProgresso: (t) => (status.textContent = t),
    });
    const m = montarMistura({
      jogoId: jogoEscolhido,
      nome: resultado.nome,
      descricao: resultado.descricao,
      template: tpl,
      codigoIA: resultado.codigo,
      origem: "ia",
    });
    const { erros } = checarMistura(m);
    if (erros.length) throw new Error("O código da IA veio com problemas, tente de novo:\n" + erros.join("\n"));
    status.textContent = "";
    $("#pedido").value = "";
    depoisDeCriar(m);
  } catch (e) {
    status.textContent = e.message;
    status.classList.add("erro");
  } finally {
    botao.disabled = false;
  }
}

// --- Ajustes ---

function desenharAjustes() {
  const a = ajustes();
  $("#ia-chave").value = a.iaChave;
  $("#ia-modelo").value = a.iaModelo;
  $("#ia-url").value = a.iaUrl;
  $("#catalogo-url").value = a.catalogoUrl;
}

function salvarAjustes() {
  gravar(CHAVE_AJUSTES, {
    iaChave: $("#ia-chave").value.trim(),
    iaModelo: $("#ia-modelo").value.trim() || IA_PADRAO.modelo,
    iaUrl: $("#ia-url").value.trim() || IA_PADRAO.url,
    catalogoUrl: $("#catalogo-url").value.trim(),
  });
  avisar("Ajustes salvos.");
}

async function importar(arquivo) {
  try {
    const dados = JSON.parse(await arquivo.text());
    if (dados.formato !== FORMATO_EXPORT || !dados.meta || !dados.arquivos) throw new Error("Esse arquivo não é uma mistura.");
    for (const v of Object.values(dados.arquivos)) if (typeof v !== "string") throw new Error("Arquivo de mistura inválido.");
    const m = {
      meta: { ...dados.meta, modname: slug(dados.meta.modname ?? dados.meta.nome), origem: "importada" },
      arquivos: dados.arquivos,
    };
    const { erros } = checarMistura(m);
    if (erros.length) throw new Error(erros.join("\n"));
    depoisDeCriar(m);
  } catch (e) {
    abrirJanela("Não deu para importar", el("p", { class: "status erro" }, e.message));
  }
}

// ---------- início ----------

async function iniciar() {
  document.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir)));
  document.querySelectorAll("[data-link]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      nativo.abrirLink(a.dataset.link);
    })
  );
  $("#janela-fechar").addEventListener("click", fecharJanela);
  $("#botao-criar-ia").addEventListener("click", criarIA);
  $("#botao-criar-receita").addEventListener("click", criarPorReceita);
  $("#botao-salvar-ajustes").addEventListener("click", salvarAjustes);
  $("#arquivo-importar").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) importar(f);
    e.target.value = "";
  });
  $("#botao-atualizar-catalogo").addEventListener("click", async () => {
    await carregarCatalogo();
    desenharCatalogo();
    avisar("Catálogo atualizado.");
  });

  await carregarReceitas();
  desenharInicio();
  desenharCriar();
  desenharAjustes();
  await carregarCatalogo();
  desenharCatalogo();
}

// O Android avisa quando o app volta pro primeiro plano (para atualizar "instalado").
globalThis.aoVoltarProApp = () => {
  if ($("#tela-inicio").classList.contains("ativa")) desenharInicio();
};

iniciar().catch((e) => avisar("Erro ao abrir: " + e.message, true));
