// Serve a interface do app no PC para testar no navegador: npm run web → http://localhost:8080
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WWW = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "src", "main", "assets", "www");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".lua": "text/plain", ".conf": "text/plain" };
const porta = Number(process.env.PORT || 8080);

createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "") || "index.html";
  if (caminho.startsWith("..")) return res.writeHead(403).end();
  try {
    const dados = await readFile(join(WWW, caminho));
    res.writeHead(200, { "Content-Type": (TIPOS[extname(caminho)] || "application/octet-stream") + "; charset=utf-8" }).end(dados);
  } catch {
    res.writeHead(404).end("não encontrado");
  }
}).listen(porta, () => console.log(`Melty Droid no navegador: http://localhost:${porta}`));
