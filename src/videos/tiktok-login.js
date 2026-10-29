// Conecta sua conta do TikTok (só precisa fazer uma vez; o acesso se renova sozinho por até 1 ano).
const readline = require('node:readline/promises');
const crypto = require('node:crypto');
require('../config');
const tiktok = require('./tiktok');

(async () => {
  const state = crypto.randomBytes(8).toString('hex');
  console.log('\n1) Abra este link no navegador, entre no TikTok e autorize:\n');
  console.log(tiktok.linkDeLogin(state));
  console.log('\n2) Você vai cair no seu "Redirect URI". Copie o endereço inteiro da barra do navegador.\n');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const colado = (await rl.question('Cole aqui o endereço (ou só o code): ')).trim();
  rl.close();
  let code = colado;
  if (colado.startsWith('http')) {
    const url = new URL(colado);
    if (url.searchParams.get('state') !== state) throw new Error('O "state" não confere. Gere o link de novo.');
    code = url.searchParams.get('code');
  }
  if (!code) throw new Error('Não achei o code no endereço colado.');
  const token = await tiktok.trocarCodigo(decodeURIComponent(code));
  console.log(`\n✅ TikTok conectado (open_id ${token.open_id}). Permissões: ${token.scope}`);
})().catch((e) => {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
});
