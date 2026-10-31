// "Criar com IA": a pessoa descreve a mistura e um modelo de linguagem escreve o código do mod.
// Funciona com qualquer API no formato da OpenAI (/chat/completions). Padrão: NVIDIA (build.nvidia.com, grátis).

import { jogo } from "./jogos.js";
import { erroDeSintaxeJs } from "./gerador.js";

export const IA_PADRAO = {
  url: "https://integrate.api.nvidia.com/v1/chat/completions",
  modelo: "openai/gpt-oss-120b",
};

function promptSistema(j, exemplo) {
  return [
    "Você é um programador de mods de jogos. Você cria \"misturas\": trazer a ideia, as mecânicas ou o clima de um jogo para dentro de outro, usando só o sistema oficial de mods do jogo anfitrião.",
    `O jogo anfitrião é ${j.nome} (${j.subtitulo}).`,
    j.guiaIA,
    "Não copie textos, nomes registrados, músicas ou arquivos de outros jogos: recrie a mecânica com o que o anfitrião já tem e dê nomes próprios.",
    "Responda EXATAMENTE neste formato, sem nada antes ou depois:",
    "NOME: <nome curto da mistura>",
    "DESCRICAO: <uma frase dizendo o que a mistura faz e como jogar no celular>",
    "```",
    `<conteúdo completo de ${j.arquivoPrincipal}>`,
    "```",
    exemplo ? "\nExemplo de um mod que funciona nesse jogo (use como referência de estilo e de API):\n```\n" + exemplo + "\n```" : "",
  ].join("\n");
}

export function lerResposta(texto) {
  const limpo = String(texto)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*<\/think>/i, "");
  const nome = limpo.match(/^\s*NOME:\s*(.+)$/im)?.[1]?.trim();
  const descricao = limpo.match(/^\s*DESCRICAO:\s*(.+)$/im)?.[1]?.trim();
  const blocos = [...limpo.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const codigo = blocos.sort((a, b) => b.length - a.length)[0]?.trim();
  if (!codigo) throw new Error("A IA não devolveu código. Tente descrever de outro jeito.");
  return { nome: nome || "Mistura da IA", descricao: descricao || "", codigo: codigo + "\n" };
}

async function chamar({ url, chave, modelo, mensagens, post }) {
  const resposta = await post(
    url,
    { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    JSON.stringify({ model: modelo, messages: mensagens, temperature: 0.4, max_tokens: 6000 })
  );
  if (resposta.status < 200 || resposta.status >= 300) {
    throw new Error(`A IA respondeu ${resposta.status}: ${String(resposta.corpo).slice(0, 300)}`);
  }
  const dados = JSON.parse(resposta.corpo);
  const conteudo = dados.choices?.[0]?.message?.content;
  if (!conteudo) throw new Error("A IA respondeu vazio.");
  return conteudo;
}

/**
 * Pede à IA o código da mistura.
 *   post(url, headers, corpo) → Promise<{ status, corpo }>  (o app usa a ponte nativa; testes usam fetch)
 *   aoProgresso(texto)        → opcional, para mostrar na tela
 */
export async function criarComIA({ jogoId, pedido, chave, url, modelo, exemplo, post, aoProgresso = () => {} }) {
  const j = jogo(jogoId);
  if (!chave) throw new Error("Coloque sua chave da API de IA em Ajustes.");
  if (!pedido?.trim()) throw new Error("Descreva a mistura que você quer.");

  const mensagens = [
    { role: "system", content: promptSistema(j, exemplo) },
    { role: "user", content: pedido.trim() },
  ];
  const cfg = { url: url || IA_PADRAO.url, chave, modelo: modelo || IA_PADRAO.modelo, post };

  aoProgresso("A IA está escrevendo o mod…");
  let texto = await chamar({ ...cfg, mensagens });
  let resultado = lerResposta(texto);

  // Uma rodada de conserto se o JavaScript não compilar.
  if (jogoId === "minecraft-bedrock") {
    const erro = erroDeSintaxeJs(resultado.codigo);
    if (erro) {
      aoProgresso("Corrigindo um erro no código…");
      mensagens.push(
        { role: "assistant", content: texto },
        { role: "user", content: `O código tem erro de sintaxe: ${erro}. Devolva a versão corrigida, no mesmo formato.` }
      );
      texto = await chamar({ ...cfg, mensagens });
      resultado = lerResposta(texto);
    }
  }
  return resultado;
}
