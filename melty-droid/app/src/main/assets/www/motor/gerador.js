// Motor do Melty Droid: monta, confere e empacota misturas. Funções puras sobre um mapa de arquivos
// { "caminho/arquivo": "conteúdo" }, para rodarem igual no app e nos testes do Node.

import { jogo } from "./jogos.js";
import { criarZip } from "./zip.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Extensões de arquivos de jogos/apps de outras pessoas. Nunca entram numa mistura.
const PROIBIDOS = [
  ".apk", ".apks", ".xapk", ".aab", ".obb", ".dex", ".so", ".oat", ".odex", ".vdex",
  ".assets", ".unity3d", ".bundle", ".ress", ".resource", ".pak", ".ucas", ".utoc", ".pck", ".ab",
];

export function slug(texto) {
  return (
    String(texto)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "mistura"
  );
}

export function validarReceita(r) {
  const m = r?.mecanicas;
  const precisa = {
    estamina: ["max", "corridaPorSegundo", "ataque", "regenPorSegundo", "atrasoRegenSegundos"],
    esquiva: ["custo", "forca", "altura", "invulneravelSegundos"],
    frasco: ["cargas", "cura"],
    fogueira: ["raio"],
  };
  if (!r?.id || !m) throw new Error('A receita precisa de "id" e "mecanicas".');
  for (const [grupo, campos] of Object.entries(precisa)) {
    for (const c of campos) {
      const v = m[grupo]?.[c];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        throw new Error(`Receita "${r.id}": mecanicas.${grupo}.${c} precisa ser um número >= 0.`);
      }
    }
  }
  if (m.estamina.max <= 0) throw new Error(`Receita "${r.id}": estamina.max precisa ser maior que 0.`);
  m.morte ??= { titulo: "VOCÊ CAIU", subtitulo: "Volte para a última fogueira" };
  return r;
}

function substituir(caminho, texto, marcadores) {
  const json = caminho.endsWith(".json");
  for (const [k, v] of Object.entries(marcadores)) {
    // Em JSON o valor precisa ir escapado; nos outros formatos, numa linha só.
    const valor = json ? JSON.stringify(String(v)).slice(1, -1) : String(v).replace(/[\r\n]+/g, " ");
    texto = texto.split(k).join(valor);
  }
  return texto;
}

/**
 * Monta uma mistura nova.
 *   jogoId:     "minecraft-bedrock" | "luanti" | ...
 *   nome, descricao
 *   template:   { caminho: conteúdo } dos arquivos do template do jogo
 *   receita:    (opcional) receita de mecânicas → gera o arquivo de config
 *   codigoIA:   (opcional) código do arquivo principal escrito pela IA (substitui o do template)
 */
export function montarMistura({ jogoId, nome, descricao, template, receita, codigoIA, origem }) {
  const j = jogo(jogoId);
  if (!receita && !codigoIA) throw new Error("Informe uma receita ou o código gerado pela IA.");
  if (receita) validarReceita(receita);

  const meta = {
    id: globalThis.crypto.randomUUID(),
    nome: String(nome || "Minha mistura").trim().slice(0, 60),
    descricao: String(descricao || "").trim().slice(0, 300) || "Feita com o Melty Droid.",
    modname: slug(nome || "mistura"),
    jogo: jogoId,
    origem: origem ?? (codigoIA ? "ia" : "receita"),
    receita: receita?.id,
    criadaEm: new Date().toISOString(),
  };

  const marcadores = j.marcadores(meta);
  const arquivos = {};
  for (const caminho of j.template) {
    if (template[caminho] === undefined) throw new Error(`Template de ${j.nome} sem o arquivo ${caminho}.`);
    arquivos[caminho] = substituir(caminho, template[caminho], marcadores);
  }
  if (receita) arquivos[j.arquivoConfig] = j.gerarConfig(receita);
  if (codigoIA) arquivos[j.arquivoPrincipal] = codigoIA;

  return { meta, arquivos };
}

/** Confere uma mistura. Retorna { erros: [], avisos: [] }. */
export function checarMistura({ meta, arquivos }) {
  const erros = [];
  const avisos = [];
  let j;
  try {
    j = jogo(meta?.jogo);
  } catch (e) {
    return { erros: [e.message], avisos };
  }
  if (!/^[a-z0-9_]+$/.test(meta.modname ?? "")) erros.push(`Nome interno inválido: "${meta.modname}".`);

  for (const [caminho, conteudo] of Object.entries(arquivos ?? {})) {
    const minusculo = caminho.toLowerCase();
    if (PROIBIDOS.some((ext) => minusculo.endsWith(ext))) {
      erros.push(`${caminho}: parece arquivo de outro jogo/app. Misturas não podem levar arquivos de jogos.`);
    }
    if (caminho.includes("..") || caminho.startsWith("/")) erros.push(`${caminho}: caminho inválido.`);
    if (typeof conteudo !== "string") continue;
    const sobra = conteudo.match(/__[A-Z][A-Z_]*__/);
    if (sobra) erros.push(`${caminho}: marcador "${sobra[0]}" não foi substituído.`);
    if (caminho.endsWith(".json")) {
      try {
        JSON.parse(conteudo);
      } catch (e) {
        erros.push(`${caminho}: JSON inválido (${e.message}).`);
      }
    }
    if (conteudo.length > 512 * 1024) avisos.push(`${caminho}: arquivo muito grande.`);
  }

  if (!arquivos?.[j.arquivoPrincipal]) erros.push(`Falta o arquivo principal ${j.arquivoPrincipal}.`);

  if (meta.jogo === "minecraft-bedrock") {
    try {
      const m = JSON.parse(arquivos["BP/manifest.json"] ?? "");
      const ids = [m.header?.uuid, ...(m.modules ?? []).map((x) => x.uuid)];
      for (const u of ids) if (!UUID.test(String(u))) erros.push(`manifest.json: UUID inválido "${u}".`);
      if (new Set(ids).size !== ids.length) erros.push("manifest.json: UUIDs repetidos.");
      for (const mod of m.modules ?? []) {
        if (mod.type === "script" && !arquivos[`BP/${mod.entry}`]) erros.push(`manifest.json: falta BP/${mod.entry}.`);
      }
    } catch {
      erros.push("BP/manifest.json ausente ou inválido.");
    }
    const principal = arquivos["BP/scripts/main.js"] ?? "";
    if (principal.includes("./config.js") && !arquivos["BP/scripts/config.js"]) {
      erros.push("main.js importa ./config.js, mas o arquivo não existe.");
    }
    const erro = erroDeSintaxeJs(principal);
    if (erro) erros.push(`BP/scripts/main.js: erro de sintaxe (${erro}).`);
  }

  if (meta.jogo === "luanti") {
    const conf = arquivos["mod.conf"] ?? "";
    const nome = conf.match(/^name\s*=\s*(.+)$/m)?.[1]?.trim();
    if (nome !== meta.modname) erros.push(`mod.conf: name precisa ser "${meta.modname}".`);
    const principal = arquivos["init.lua"] ?? "";
    if (principal.includes("config.lua") && !arquivos["config.lua"]) {
      erros.push("init.lua carrega config.lua, mas o arquivo não existe.");
    }
  }

  return { erros, avisos };
}

/**
 * Checagem de sintaxe aproximada para módulos JS: remove os `import`/`export` do topo e tenta
 * compilar o resto (sem executar). Retorna a mensagem de erro ou null.
 */
export function erroDeSintaxeJs(codigo) {
  const corpo = codigo
    .replace(/^\s*import\s[^;]*?from\s*["'][^"']+["'];?/gms, "")
    .replace(/^\s*import\s*["'][^"']+["'];?/gm, "")
    .replace(/^\s*export\s+default\s+/gm, "")
    .replace(/^\s*export\s+(?=(const|let|var|function|class|async)\b)/gm, "");
  try {
    // eslint-disable-next-line no-new-func
    new Function(corpo);
    return null;
  } catch (e) {
    return e.message;
  }
}

/** Gera o pacote que o jogo importa. Retorna { nomeArquivo, mime, bytes: Uint8Array }. */
export function empacotarMistura(mistura) {
  const { erros } = checarMistura(mistura);
  if (erros.length) throw new Error("A mistura tem problemas:\n• " + erros.join("\n• "));
  const { meta, arquivos } = mistura;
  const j = jogo(meta.jogo);
  const entradas = Object.keys(arquivos)
    .filter(j.pacote.incluir)
    .sort()
    .map((caminho) => ({ nome: j.pacote.caminhoNoZip(caminho, meta), dados: arquivos[caminho] }));
  return {
    nomeArquivo: meta.modname + j.pacote.extensao,
    mime: j.pacote.mime,
    bytes: criarZip(entradas),
  };
}
