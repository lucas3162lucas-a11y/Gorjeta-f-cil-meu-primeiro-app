// "Ação!": produz um vídeo do começo ao fim e espera sua aprovação para postar no TikTok.
// Uso: npm run acao                              (a IA escolhe o assunto e escreve o roteiro)
//      npm run acao -- --roteiro meu.json        (usa um roteiro pronto)
//      npm run acao -- --sim                     (aprova sozinho e já posta)
//      npm run acao -- --sem-voz                 (teste rápido sem narração)
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { execFile } = require('node:child_process');
require('../config');
const { criarRoteiro, historicoFile } = require('./roteiro');
const { narrar } = require('./narracao');
const { editar } = require('./edicao');
const { aprovarEPostar } = require('./postar');
const { readJson, writeJson, videosDir } = require('./util');

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  return i === -1 ? null : args[i + 1] || true;
};

(async () => {
  console.log('🎬 Ação!\n');

  console.log('1/3 ✍️  Escolhendo o assunto e escrevendo o roteiro...');
  const roteiro = await criarRoteiro({ arquivo: opcao('--roteiro') });
  const id = `${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
  const dir = path.join(videosDir, id);
  fs.mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, 'roteiro.json'), roteiro);
  console.log(`    "${roteiro.titulo}"`);
  roteiro.falas.forEach((f) => console.log(`    • ${f}`));

  console.log('\n2/3 🎙️  Narrando...');
  const narracao = await narrar(roteiro.falas, dir, {
    voz: process.env.TTS_VOZ || 'pt-BR-AntonioNeural',
    velocidade: process.env.TTS_VELOCIDADE || '+10%',
    semVoz: Boolean(opcao('--sem-voz')),
  });

  console.log(`3/3 ✂️  Editando o vídeo (${narracao.total.toFixed(1)}s)...`);
  const video = await editar({ dir, ...narracao, busca: roteiro.busca });
  for (const f of fs.readdirSync(dir)) if (f.startsWith('fala-')) fs.rmSync(path.join(dir, f));

  writeJson(path.join(dir, 'status.json'), {
    id, estado: 'aguardando_aprovacao', criado_em: new Date().toISOString(),
    titulo: roteiro.titulo, legenda: roteiro.legenda, duracao: narracao.total,
  });
  writeJson(historicoFile, [...readJson(historicoFile, []), roteiro.titulo]);
  console.log(`\n✅ Vídeo pronto: ${video}`);
  console.log(`   Legenda: ${roteiro.legenda}`);

  // No Termux, abre o vídeo no celular para você assistir antes de aprovar.
  if (process.env.PREFIX?.includes('com.termux')) execFile('termux-open', [video], () => {});

  let aprovado = Boolean(opcao('--sim'));
  if (!aprovado && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const r = (await rl.question('\nAprovar e postar no TikTok? [s] postar  [n] descartar  [Enter] decidir depois: ')).trim().toLowerCase();
    rl.close();
    if (r === 'n') {
      writeJson(path.join(dir, 'status.json'), { ...readJson(path.join(dir, 'status.json')), estado: 'descartado' });
      return console.log('🗑️  Descartado. Rode "npm run acao" para fazer outro.');
    }
    aprovado = r === 's';
  }
  if (!aprovado) return console.log(`⏸️  Aguardando aprovação. Para postar: npm run postar -- ${id}`);
  await aprovarEPostar(id);
})().catch((e) => {
  console.error(`\n❌ ${e.message}`);
  process.exit(1);
});
