#!/usr/bin/env node
// Ponte MCP (stdio) para cada instância do Claude Code entrar na sala com ferramentas nativas.
// Registre em cada Claude com um nome diferente:
//   claude mcp add sala -e SALA_NOME=claude-1 -- node /caminho/broadcast/mcp.js
// Ferramentas: sala_enviar, sala_ler, sala_quem_esta, sala_lote_video.
// Implementa o mínimo do protocolo MCP (JSON-RPC 2.0 por linha) sem dependências extras.
const readline = require('node:readline');
const { send, read, peers, format } = require('./lib/client');

const NAME = process.env.SALA_NOME || `claude-${process.pid}`;
let cursor = Number(process.env.SALA_DESDE || 0); // id da última mensagem já entregue a este Claude

const TOOLS = [
  {
    name: 'sala_enviar',
    description: 'Envia uma mensagem para a sala de broadcast. TODOS (o humano e os outros Claudes) recebem.',
    inputSchema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Conteúdo da mensagem' },
        para: { type: 'string', description: 'Opcional: nome de quem você quer mencionar (todos continuam vendo)' },
      },
      required: ['texto'],
    },
  },
  {
    name: 'sala_ler',
    description: 'Lê as mensagens novas da sala desde a última leitura (mensagens do humano e dos outros Claudes). Use "esperar" para aguardar novas mensagens.',
    inputSchema: {
      type: 'object',
      properties: {
        esperar: { type: 'number', description: 'Segundos para aguardar se não houver nada novo (0–60). Padrão 0.' },
        desde: { type: 'number', description: 'Opcional: reler a partir deste id' },
      },
    },
  },
  {
    name: 'sala_quem_esta',
    description: 'Lista quem está conectado à sala por WebSocket.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'sala_lote_video',
    description: 'Dispara um lote de edição de vídeo. O worker de vídeo executa com ffmpeg e publica o andamento na sala. ' +
      'Caminhos são relativos à pasta de mídia. Operações: trim{start,end|duration}, scale{width,height}, vertical{width?}, ' +
      'speed{factor}, fade{in?,out?,at?}, mute{}, audio{file}, quality{crf?,preset?}.',
    inputSchema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              input: { type: 'string' },
              output: { type: 'string' },
              ops: { type: 'array', items: { type: 'object' } },
            },
            required: ['input', 'output'],
          },
        },
        texto: { type: 'string', description: 'Descrição do lote' },
      },
      required: ['jobs'],
    },
  },
];

async function callTool(name, args = {}) {
  switch (name) {
    case 'sala_enviar': {
      const m = await send({ from: NAME, role: 'claude', text: args.texto, to: args.para });
      return `enviado: ${format(m)}`;
    }
    case 'sala_ler': {
      const since = args.desde !== undefined ? Number(args.desde) : cursor;
      const wait = Math.max(0, Math.min(Number(args.esperar || 0), 60));
      const { messages, lastId } = await read(since, wait);
      // Não devolve as próprias mensagens, só o que os outros disseram.
      const outros = messages.filter((m) => m.from !== NAME);
      cursor = Math.max(cursor, messages.at(-1)?.id ?? since);
      if (!outros.length) return `(nada novo; último id ${lastId})`;
      return outros.map(format).join('\n');
    }
    case 'sala_quem_esta': {
      const { peers: list } = await peers();
      return list.length ? list.map((p) => `${p.name} (${p.role})`).join('\n') : '(ninguém conectado via WebSocket)';
    }
    case 'sala_lote_video': {
      const jobs = args.jobs || [];
      const m = await send({ type: 'video.batch', from: NAME, role: 'claude', text: args.texto || `lote com ${jobs.length} vídeo(s)`, payload: { jobs } });
      return `lote publicado como mensagem #${m.id}. Acompanhe com sala_ler (mensagens video.status).`;
    }
    default:
      throw new Error(`ferramenta desconhecida: ${name}`);
  }
}

function reply(id, result, error) {
  process.stdout.write(JSON.stringify(error ? { jsonrpc: '2.0', id, error } : { jsonrpc: '2.0', id, result }) + '\n');
}

readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { return; }
  if (req.id === undefined) return; // notificação
  try {
    switch (req.method) {
      case 'initialize':
        return reply(req.id, {
          protocolVersion: req.params?.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name: 'sala-broadcast', version: '1.0.0' },
          instructions: `Você é "${NAME}" numa sala compartilhada com o humano e outros Claudes. ` +
            'Use sala_ler para ouvir e sala_enviar para falar; tudo que você enviar é lido por todos.',
        });
      case 'ping':
        return reply(req.id, {});
      case 'tools/list':
        return reply(req.id, { tools: TOOLS });
      case 'tools/call': {
        try {
          const text = await callTool(req.params?.name, req.params?.arguments);
          return reply(req.id, { content: [{ type: 'text', text }] });
        } catch (e) {
          return reply(req.id, { content: [{ type: 'text', text: `erro: ${e.message}` }], isError: true });
        }
      }
      default:
        return reply(req.id, undefined, { code: -32601, message: `método não suportado: ${req.method}` });
    }
  } catch (e) {
    reply(req.id, undefined, { code: -32603, message: e.message });
  }
});
