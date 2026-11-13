// Gera o PDF do e-book. Uso: node gerar.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { categorias, dicasTransicao, experiencias, kit } = require('./conteudo');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let num = 0;
categorias.forEach((c) => c.itens.forEach((i) => { i.n = ++num; i.cat = c; }));
const todas = categorias.flatMap((c) => c.itens);

let paginaAtual = 0;
const pagina = (conteudo, { classe = '', rodape = true } = {}) => {
  paginaAtual++;
  return `<section class="page ${classe}">${conteudo}${rodape ? `<footer><span>60 Brincadeiras Sem Tela</span><span>${paginaAtual}</span></footer>` : ''}</section>`;
};

const card = (i) => {
  const [nome, idade, tempo, materiais, como] = i;
  return `<article class="card" style="--cor:${i.cat.cor};--clara:${i.cat.clara}">
    <div class="card-top"><span class="num">${i.n}</span><h3>${esc(nome)}</h3></div>
    <div class="chips"><span>👧 ${esc(idade)} anos</span><span>⏱️ ${esc(tempo)}</span></div>
    <p class="mat"><b>Materiais:</b> ${esc(materiais)}</p>
    <p class="como">${esc(como)}</p>
    <div class="check">☐ Já brincamos</div>
  </article>`;
};

const paginas = [];

// 1. Capa
paginas.push(pagina(`
  <div class="capa">
    <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div>
    <div class="capa-emojis">🧸 🎨 ⚽ 📚 🌈</div>
    <p class="capa-kicker">Guia prático para famílias</p>
    <h1><span class="big">60</span> Brincadeiras<br>Sem Tela</h1>
    <p class="capa-sub">para crianças de 3 a 10 anos</p>
    <p class="capa-desc">Atividades com o que você já tem em casa para tirar as crianças do celular, sem gastar e sem precisar planejar.</p>
    <div class="capa-tags">
      ${categorias.map((c) => `<span style="background:${c.cor}">${c.emoji} ${c.titulo}</span>`).join('')}
    </div>
  </div>`, { classe: 'page-capa', rodape: false }));

// 2. Como usar
paginas.push(pagina(`
  <h2 class="titulo">Como usar este guia</h2>
  <p class="lead">Aqui você encontra <b>60 brincadeiras</b> testadas e simples, divididas em 4 grupos de 15. Não precisa seguir a ordem: escolha pela energia da criança e pelo tempo que vocês têm.</p>
  <div class="legenda">
    <div><span class="ico">👧</span><b>Idade sugerida</b><br>É só uma referência. Crianças mais novas podem brincar com ajuda.</div>
    <div><span class="ico">⏱️</span><b>Tempo médio</b><br>Muitas brincadeiras podem durar bem mais, se a criança se envolver.</div>
    <div><span class="ico">✂️</span><b>Materiais</b><br>Quase tudo já existe em casa ou vai para o lixo reciclável.</div>
    <div><span class="ico">☐</span><b>Já brincamos</b><br>Marque as que vocês fizeram e veja a lista crescer.</div>
  </div>
  <h3 class="sub">Os 4 grupos</h3>
  <div class="grupos">
    ${categorias.map((c) => `<div class="grupo" style="--cor:${c.cor};--clara:${c.clara}">
      <div class="g-emoji">${c.emoji}</div><div><b>${c.titulo}</b><br><span>Brincadeiras ${c.itens[0].n} a ${c.itens[c.itens.length - 1].n}</span><p>${esc(c.intro)}</p></div></div>`).join('')}
  </div>
  <h3 class="sub">Escolha rápida</h3>
  <table class="rapida">
    <tr><td>Criança agitada, muita energia</td><td>⚡ Para gastar energia</td></tr>
    <tr><td>Fim de tarde, perto da hora de dormir</td><td>🌧️ Calmas, para dias de chuva</td></tr>
    <tr><td>Fim de semana, com mais tempo</td><td>🎨 Para pensar e criar</td></tr>
    <tr><td>Férias, para não esquecer o que aprendeu</td><td>🔢 Para aprender brincando</td></tr>
  </table>
  <div class="aviso">⚠️ <b>Segurança em primeiro lugar.</b> Todas as atividades devem ter supervisão de um adulto. Tesouras com ponta, grampeador e objetos pequenos ficam com o adulto. Atenção redobrada com crianças menores de 4 anos e com qualquer atividade que use água.</div>
`));

// 3. Saindo da tela
paginas.push(pagina(`
  <h2 class="titulo">Da tela para a brincadeira, sem briga</h2>
  <p class="lead">A parte mais difícil não é brincar: é desligar a tela. Estas 8 dicas deixam a troca mais tranquila para a criança e para você.</p>
  <div class="dicas">
    ${dicasTransicao.map(([t, d], k) => `<div class="dica"><span class="dn">${k + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}
  </div>
  <div class="frase">"A criança não precisa de brinquedo caro. Precisa de alguém que diga: <b>vem brincar comigo?</b>"</div>
`));

// 4. Categorias
categorias.forEach((c) => {
  const partes = [c.itens.slice(0, 8), c.itens.slice(8)];
  partes.forEach((parte, k) => {
    paginas.push(pagina(`
      ${k === 0
        ? `<div class="cat-head" style="--cor:${c.cor};--clara:${c.clara}"><span class="cat-emoji">${c.emoji}</span><div><h2>${c.titulo}</h2><p>${esc(c.intro)}</p></div></div>`
        : `<div class="cat-head mini" style="--cor:${c.cor};--clara:${c.clara}"><span class="cat-emoji">${c.emoji}</span><h2>${c.titulo} <small>(continuação)</small></h2></div>`}
      <div class="grid">${parte.map(card).join('')}</div>`));
  });
});

// 5. Massinha
paginas.push(pagina(`
  <h2 class="titulo">Receita de massinha caseira</h2>
  <p class="lead">Rende massinha para a semana toda, custa poucos centavos e a criança ajuda a fazer.</p>
  <div class="receita">
    <div class="ingr">
      <h3>🥣 Ingredientes</h3>
      <ul>
        <li>2 xícaras de farinha de trigo</li>
        <li>½ xícara de sal</li>
        <li>1 colher (sopa) de óleo</li>
        <li>¾ de xícara de água morna (aos poucos)</li>
        <li>Corante alimentício (ou suco em pó)</li>
      </ul>
    </div>
    <div class="modo">
      <h3>👩‍🍳 Modo de fazer</h3>
      <ol>
        <li>Misture a farinha e o sal em uma tigela.</li>
        <li>Junte o óleo e o corante na água morna (o adulto confere a temperatura).</li>
        <li>Vá colocando a água aos poucos e misturando com as mãos.</li>
        <li>Sove por uns 5 minutos até desgrudar das mãos. Grudou? Mais farinha. Esfarelou? Um pouco de água.</li>
        <li>Separe em bolinhas e pinte cada uma de uma cor.</li>
      </ol>
    </div>
  </div>
  <div class="caixas">
    <div class="box"><b>🧊 Como guardar</b><p>Em pote fechado ou saquinho, na geladeira, por até 1 semana. Se ressecar, amasse com algumas gotas de água.</p></div>
    <div class="box"><b>💡 Ideias para usar</b><p>Bicho que não existe (nº 11), comidinhas para a loja de mentirinha (nº 10), letras e números de massinha, carimbar com garfos e tampinhas.</p></div>
  </div>
  <div class="aviso">⚠️ A massinha <b>não é para comer</b>: tem muito sal. Contém trigo: não use com crianças com alergia ou doença celíaca. Use apenas corante alimentício.</div>
`));

// 6. Experiências
paginas.push(pagina(`
  <h2 class="titulo">3 experiências simples</h2>
  <p class="lead">Ciência de cozinha que dá aquele "uau!". Faça sobre uma bandeja ou na pia, e explique o porquê no final.</p>
  <div class="exps">
    ${experiencias.map((e) => `<div class="exp">
      <h3>🧪 ${esc(e.nome)}</h3>
      <div class="chips"><span>👧 ${esc(e.idade)} anos</span><span>⏱️ ${esc(e.tempo)}</span></div>
      <p class="mat"><b>Materiais:</b> ${esc(e.materiais)}</p>
      <ol>${e.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      <p class="porque"><b>Por que acontece?</b> ${esc(e.porque)}</p>
    </div>`).join('')}
  </div>
  <div class="aviso">⚠️ Os materiais das experiências não devem ser ingeridos nem levados aos olhos. Lave as mãos no final. Sempre com um adulto.</div>
`));

// 7. Pote de sorteio
paginas.push(pagina(`
  <h2 class="titulo">Para imprimir: pote de sorteio</h2>
  <p class="lead small">Recorte nas linhas, dobre cada tira e coloque em um pote. Quando bater o "não sei o que fazer", a criança sorteia.</p>
  <div class="tiras">
    ${todas.map((i) => `<div class="tira" style="--cor:${i.cat.cor}"><b>${i.n}</b> ${i.cat.emoji} ${esc(i[0])}</div>`).join('')}
  </div>
`, { classe: 'imprimir' }));

// 8. Plano da semana
const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
paginas.push(pagina(`
  <h2 class="titulo">Para imprimir: plano da semana</h2>
  <p class="lead small">Escolham juntos uma brincadeira por dia. Prenda na geladeira e marque as que vocês fizeram.</p>
  <p class="semana">Semana de ____/____ a ____/____</p>
  <table class="plano">
    <thead><tr><th>Dia</th><th>Brincadeira (nº e nome)</th><th>Fizemos?</th><th>Como foi?</th></tr></thead>
    <tbody>${dias.map((d) => `<tr><td><b>${d}</b></td><td></td><td class="c">☐</td><td class="c caras">😀 😐 😕</td></tr>`).join('')}</tbody>
  </table>
  <div class="box notas"><b>✏️ A brincadeira favorita da semana foi:</b><div class="linha"></div><div class="linha"></div></div>
`, { classe: 'imprimir' }));

// 9. Kit básico
paginas.push(pagina(`
  <h2 class="titulo">Para imprimir: kit básico</h2>
  <p class="lead small">Com estes itens guardados em uma caixa, você consegue fazer quase todas as 60 brincadeiras. Marque o que já tem.</p>
  <div class="kit">${kit.map((k) => `<div>☐ ${esc(k)}</div>`).join('')}</div>
  <div class="dica-kit">💡 <b>Dica:</b> comece a guardar rolos, caixas, tampinhas e garrafas a partir de hoje. Em duas semanas o kit está completo, sem gastar nada.</div>
  <div class="fim">
    <p class="fim-t">Bom brincar! 🎈</p>
    <p>Volte a este guia sempre que precisar. Uma mesma brincadeira fica diferente a cada vez, porque a criança cresce e inventa regras novas.</p>
  </div>
  <p class="legal">Material recreativo e educativo. Todas as atividades devem ter supervisão de um adulto. As idades e os tempos são sugestões e podem variar de criança para criança. Adapte cada brincadeira à realidade e à segurança da sua casa.</p>
`, { classe: 'imprimir' }));

const css = fs.readFileSync(path.join(__dirname, 'estilo.css'), 'utf8');
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>60 Brincadeiras Sem Tela</title><style>${css}</style></head><body>${paginas.join('\n')}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'ebook.html'), html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'ebook.html'));
  await page.waitForTimeout(500);
  const overflow = await page.$$eval('section.page', (ps) => ps.map((p, k) => (!p.classList.contains('page-capa') && [...p.querySelectorAll(':scope > :not(footer):not(.legal)')].some(el => el.getBoundingClientRect().bottom > p.getBoundingClientRect().bottom - 17*3.78) ? k + 1 : null)).filter(Boolean));
  if (overflow.length) console.log('ATENÇÃO: conteúdo passando da página em', overflow.join(', '));
  await page.pdf({ path: path.join(__dirname, '60-Brincadeiras-Sem-Tela.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('PDF gerado com', paginas.length, 'páginas');
})();
