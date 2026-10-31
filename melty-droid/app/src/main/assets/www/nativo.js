// Ponte com o lado Android (classe Ponte.java, exposta como window.Nativo).
// No navegador comum (para testar no PC) cai em alternativas web.

const N = globalThis.Nativo;
export const noApp = Boolean(N);

const pendentes = new Map();
let contador = 0;

// O Java chama isto quando uma requisição HTTP termina.
globalThis.__nativoResposta = (id, status, corpo) => {
  const p = pendentes.get(id);
  if (!p) return;
  pendentes.delete(id);
  p({ status, corpo });
};

function paraBase64(bytes) {
  let bin = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) bin += String.fromCharCode(...bytes.subarray(i, i + passo));
  return btoa(bin);
}

function baixarNoNavegador(nome, bytes, mime) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** POST/GET pelo Android (sem bloqueio de CORS). No navegador usa fetch. */
export function http(url, { metodo = "GET", headers = {}, corpo = "" } = {}) {
  if (N) {
    const id = "r" + ++contador;
    return new Promise((resolve) => {
      pendentes.set(id, resolve);
      N.http(id, url, metodo, JSON.stringify(headers), corpo);
    });
  }
  return fetch(url, { method: metodo, headers, body: metodo === "GET" ? undefined : corpo })
    .then(async (r) => ({ status: r.status, corpo: await r.text() }))
    .catch((e) => ({ status: 0, corpo: String(e.message || e) }));
}

/** { "com.pacote": true|false } */
export function jogosInstalados(pacotes) {
  if (!N) return Object.fromEntries(pacotes.map((p) => [p, false]));
  try {
    return JSON.parse(N.jogosInstalados(pacotes.join(",")));
  } catch {
    return {};
  }
}

export function abrirJogo(pacote) {
  return N ? N.abrirJogo(pacote) : false;
}

export function abrirLoja(pacote) {
  const url = `https://play.google.com/store/apps/details?id=${pacote}`;
  if (N) N.abrirLoja(pacote);
  else window.open(url, "_blank");
}

export function abrirLink(url) {
  if (N) N.abrirLink(url);
  else window.open(url, "_blank");
}

/** Abre o arquivo com o jogo (o jogo importa). Retorna "ok" ou uma mensagem de erro. */
export function abrirComJogo(nome, bytes, mime, pacote) {
  if (!N) {
    baixarNoNavegador(nome, bytes, mime);
    return "baixado";
  }
  return N.abrirComJogo(nome, paraBase64(bytes), mime, pacote);
}

/** Salva em Downloads. Retorna "ok" ou mensagem de erro. */
export function salvarDownloads(nome, bytes, mime) {
  if (!N) {
    baixarNoNavegador(nome, bytes, mime);
    return "ok";
  }
  return N.salvarDownloads(nome, paraBase64(bytes), mime);
}

export function compartilhar(nome, bytes, mime) {
  if (!N) {
    baixarNoNavegador(nome, bytes, mime);
    return "ok";
  }
  return N.compartilhar(nome, paraBase64(bytes), mime);
}
