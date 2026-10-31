// Converte um valor JSON simples (objetos, listas, números, textos, booleanos) para uma tabela Lua.

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function paraLua(valor, nivel = 0) {
  const pad = "  ".repeat(nivel + 1);
  const fim = "  ".repeat(nivel);
  if (valor === null || valor === undefined) return "nil";
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) throw new Error("Número inválido na receita: " + valor);
    return String(valor);
  }
  if (typeof valor === "boolean") return String(valor);
  if (typeof valor === "string") return JSON.stringify(valor); // aspas e escapes do JSON são válidos em Lua
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "{}";
    return "{\n" + valor.map((v) => pad + paraLua(v, nivel + 1)).join(",\n") + ",\n" + fim + "}";
  }
  const chaves = Object.keys(valor);
  if (chaves.length === 0) return "{}";
  const linhas = chaves.map((k) => {
    const chave = IDENT.test(k) ? k : "[" + JSON.stringify(k) + "]";
    return pad + chave + " = " + paraLua(valor[k], nivel + 1);
  });
  return "{\n" + linhas.join(",\n") + ",\n" + fim + "}";
}
