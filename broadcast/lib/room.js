// Sala única em memória. Histórico num buffer circular + log opcional em JSONL
// (um arquivo de texto, uma linha por mensagem — sem banco de dados).
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const TYPES = new Set(['chat', 'system', 'video.batch', 'video.status']);

class Room extends EventEmitter {
  constructor({ historySize = 500, logFile = null } = {}) {
    super();
    this.setMaxListeners(0);
    this.historySize = historySize;
    this.history = [];
    this.nextId = 1;
    this.logFile = logFile;
    if (logFile) this.#restore();
  }

  #restore() {
    if (!fs.existsSync(this.logFile)) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
      return;
    }
    const lines = fs.readFileSync(this.logFile, 'utf8').split('\n').filter(Boolean);
    for (const line of lines.slice(-this.historySize)) {
      try { this.history.push(JSON.parse(line)); } catch { /* linha corrompida: ignora */ }
    }
    const last = this.history.at(-1);
    if (last) this.nextId = last.id + 1;
  }

  // Valida, carimba id/hora e entrega para todos os ouvintes.
  publish({ type = 'chat', from, role = 'claude', text = '', payload, to }) {
    if (!TYPES.has(type)) throw new Error(`tipo inválido: ${type}`);
    if (!from || typeof from !== 'string') throw new Error('campo "from" obrigatório');
    const msg = {
      id: this.nextId++,
      ts: new Date().toISOString(),
      type,
      from: from.slice(0, 64),
      role,
      text: String(text).slice(0, 20000),
    };
    if (payload !== undefined) msg.payload = payload;
    if (to) msg.to = String(to).slice(0, 64); // menção opcional; todos continuam recebendo
    this.history.push(msg);
    if (this.history.length > this.historySize) this.history.shift();
    if (this.logFile) fs.appendFile(this.logFile, JSON.stringify(msg) + '\n', () => {});
    this.emit('message', msg);
    return msg;
  }

  since(id = 0, limit = 200) {
    return this.history.filter((m) => m.id > id).slice(0, limit);
  }

  // Long-poll: devolve na hora se já houver mensagens novas, senão espera até `waitMs`.
  waitSince(id, waitMs) {
    const ready = this.since(id);
    if (ready.length || waitMs <= 0) return Promise.resolve(ready);
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.off('message', onMsg);
        resolve(this.since(id));
      };
      const onMsg = () => done();
      const timer = setTimeout(done, waitMs);
      this.on('message', onMsg);
    });
  }
}

module.exports = { Room };
