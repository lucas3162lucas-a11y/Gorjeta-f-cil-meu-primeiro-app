#!/usr/bin/env node
// CLI da sala. Exemplos:
//   node cli.js send  --name lucas --role human "Oi a todos"
//   node cli.js read  --since 10 [--wait 25]
//   node cli.js listen --name claude-2           (fica ouvindo e imprime uma linha por mensagem)
//   node cli.js peers
//   node cli.js video --name lucas lote.json     (dispara um lote de edição de vídeo)
const fs = require('node:fs');
const WebSocket = require('ws');
const { send, read, peers, wsUrl, format } = require('./lib/client');

function parse(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) opts[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
    else opts._.push(a);
  }
  return opts;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const o = parse(rest);
  const name = o.name || process.env.SALA_NOME || 'lucas';
  const role = o.role || process.env.SALA_PAPEL || (name.startsWith('claude') ? 'claude' : 'human');

  switch (cmd) {
    case 'send': {
      const text = o._.join(' ') || fs.readFileSync(0, 'utf8').trim();
      const m = await send({ from: name, role, text, to: o.to });
      console.log(format(m));
      break;
    }
    case 'read': {
      const { messages, lastId } = await read(Number(o.since || 0), Number(o.wait || 0));
      for (const m of messages) console.log(format(m));
      console.error(`(último id: ${lastId})`);
      break;
    }
    case 'peers': {
      const { peers: list } = await peers();
      for (const p of list) console.log(`${p.name} (${p.role}) desde ${p.since}`);
      if (!list.length) console.log('(ninguém conectado via WebSocket)');
      break;
    }
    case 'video': {
      const file = o._[0];
      if (!file) throw new Error('informe o arquivo JSON do lote');
      const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
      const jobs = Array.isArray(spec) ? spec : spec.jobs;
      const m = await send({ type: 'video.batch', from: name, role, text: o.text || `lote com ${jobs.length} vídeo(s)`, payload: { jobs } });
      console.log(format(m));
      break;
    }
    case 'listen': {
      const ws = new WebSocket(wsUrl(name, role, Number(o.since || 0)));
      ws.on('message', (raw) => {
        const m = JSON.parse(raw);
        if (m.type === 'welcome') {
          console.log(`Conectado como ${m.you.name}. Na sala: ${m.peers.map((p) => p.name).join(', ')}`);
          for (const h of m.history) console.log(format(h));
        } else if (m.type === 'error') console.error('erro:', m.error);
        else console.log(format(m));
      });
      ws.on('close', () => { console.log('desconectado'); process.exit(0); });
      ws.on('error', (e) => { console.error(e.message); process.exit(1); });
      // Tudo que for digitado no terminal vira mensagem na sala.
      if (process.stdin.isTTY || o.stdin) {
        process.stdin.setEncoding('utf8');
        let buf = '';
        process.stdin.on('data', (d) => {
          buf += d;
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (line && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ text: line }));
          }
        });
      }
      return;
    }
    default:
      console.log('uso: node cli.js <send|read|listen|peers|video> [--name X] [--role human|claude|worker] ...');
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((e) => { console.error('erro:', e.message); process.exit(1); });
