// Estação Abissal: servidor local que serve o jogo e repassa as falas das IAs para a IA que você escolher.
// Funciona no Termux (Android), Linux, Mac e Windows. Precisa só do Node 18 ou mais novo, sem instalar pacotes.
//
// Configure no arquivo .env (na mesma pasta) ou em variáveis de ambiente:
//   IA_PROVEDOR = nvidia | openrouter | ollama | outro
//   IA_CHAVE    = sua chave (NVIDIA: nvapi-...; OpenRouter: sk-or-...). O Ollama não precisa.
//   IA_MODELO   = (opcional) troca o modelo padrão do provedor
//   IA_URL      = (opcional) endereço de /chat/completions, para "outro" ou para trocar o padrão
//   IA_PARALELO = (opcional) quantas IAs pensam ao mesmo tempo (padrão 2; Ollama 1)
//   PORTA       = (opcional) padrão 8080
//
// Depois: node servidor.js  e abra http://localhost:8080 no navegador do celular.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PASTA = __dirname;

// .env simples (CHAVE=valor por linha)
try {
  for (const linha of fs.readFileSync(path.join(PASTA, ".env"), "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // sem .env: usa só as variáveis de ambiente
}

const PRESETS = {
  nvidia: { nome: "NVIDIA", url: "https://integrate.api.nvidia.com/v1/chat/completions", modelo: "openai/gpt-oss-120b", chave: true, paralelo: 2 },
  openrouter: { nome: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", modelo: "meta-llama/llama-3.3-70b-instruct:free", chave: true, paralelo: 2 },
  ollama: { nome: "Ollama (local)", url: "http://127.0.0.1:11434/v1/chat/completions", modelo: "qwen2.5:3b", chave: false, paralelo: 1 },
  outro: { nome: "API compatível", url: "", modelo: "", chave: false, paralelo: 2 },
};

const provedorId = (process.env.IA_PROVEDOR || "nvidia").toLowerCase();
const preset = PRESETS[provedorId] || PRESETS.outro;
const IA = {
  provedor: preset.nome,
  url: process.env.IA_URL || preset.url,
  modelo: process.env.IA_MODELO || preset.modelo,
  chave: process.env.IA_CHAVE || "",
  paralelo: Number(process.env.IA_PARALELO) || preset.paralelo,
};
const porta = Number(process.env.PORTA || process.env.PORT || 8080);

function problemaConfig() {
  if (!PRESETS[provedorId]) return `IA_PROVEDOR "${provedorId}" desconhecido: use nvidia, openrouter, ollama ou outro.`;
  if (!IA.url) return "Falta IA_URL no .env.";
  if (!IA.modelo) return "Falta IA_MODELO no .env.";
  if (preset.chave && !IA.chave) return `Falta IA_CHAVE no .env (chave da ${IA.provedor}).`;
  return null;
}

function json(res, status, dados) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(dados));
}

function lerCorpo(req, limite = 300 * 1024) {
  return new Promise((ok, falha) => {
    let tam = 0;
    const partes = [];
    req.on("data", (p) => {
      tam += p.length;
      if (tam > limite) { falha(new Error("pedido grande demais")); req.destroy(); return; }
      partes.push(p);
    });
    req.on("end", () => ok(Buffer.concat(partes).toString("utf8")));
    req.on("error", falha);
  });
}

async function perguntar(prompt) {
  const headers = { "Content-Type": "application/json" };
  if (IA.chave) headers.Authorization = `Bearer ${IA.chave}`;
  if (provedorId === "openrouter") { headers["HTTP-Referer"] = "http://localhost"; headers["X-Title"] = "Estacao Abissal"; }
  const r = await fetch(IA.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: IA.modelo,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 900,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const texto = await r.text();
  if (!r.ok) {
    const e = new Error(`${IA.provedor} respondeu ${r.status}: ${texto.slice(0, 200)}`);
    e.status = r.status;
    throw e;
  }
  const dados = JSON.parse(texto);
  const msg = dados.choices?.[0]?.message || {};
  return msg.content || msg.reasoning_content || "";
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/ia/status") {
      const problema = problemaConfig();
      return json(res, 200, problema
        ? { ok: false, motivo: problema }
        : { ok: true, provedor: IA.provedor, modelo: IA.modelo, paralelo: IA.paralelo });
    }
    if (url.pathname === "/ia" && req.method === "POST") {
      const problema = problemaConfig();
      if (problema) return json(res, 503, { erro: problema });
      const { prompt } = JSON.parse(await lerCorpo(req));
      if (typeof prompt !== "string" || !prompt.trim()) return json(res, 400, { erro: "prompt vazio" });
      const texto = await perguntar(prompt);
      return json(res, 200, { texto });
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return fs.createReadStream(path.join(PASTA, "index.html")).pipe(res);
    }
    res.writeHead(404).end("não encontrado");
  } catch (e) {
    console.error("[ia]", e.message);
    json(res, e.status === 429 ? 429 : 502, { erro: e.message });
  }
});

// Só aceita conexões do próprio aparelho: sua chave não fica exposta na rede.
servidor.listen(porta, "127.0.0.1", () => {
  const problema = problemaConfig();
  console.log(`Estação Abissal rodando: abra http://localhost:${porta}`);
  console.log(problema ? `Atenção: ${problema} (o jogo usa bots simples até você arrumar)` : `IA: ${IA.provedor} · ${IA.modelo}`);
});
