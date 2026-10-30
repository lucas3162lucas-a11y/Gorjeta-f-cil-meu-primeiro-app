# Roteiro — Como funciona o micro-ondas?

> **Versão:** v1 (Fase 1), 30/10/2026. **Origem:** roteiro escrito pelo agente, a pedido do usuário
> ("faça outro vídeo"). Tema escolhido pelo agente, seguindo a preferência anterior do usuário por
> assuntos que não envolvam dinheiro.
> **Situação:** AGUARDANDO APROVAÇÃO. A implementação e a renderização ainda não começaram.
>
> **Convenção:** timestamps em MM:SS:FF a 30 fps. Frames em intervalo semiaberto [início, fim). Os
> tempos são estimativas; depois da narração real, os cortes passam a seguir a voz.

## 1. Briefing de produção

- **Tema e recorte:** o micro-ondas doméstico. Ele gera micro-ondas no magnetron, leva essas ondas por
  um guia até a cavidade de metal, a comida absorve a energia porque as moléculas de água balançam, a
  porta tem uma tela metálica e o prato gira para espalhar o calor.
- **Personagem principal:** o garçom do canal "Explica Aí", que quer esquentar a marmita de um cliente.
- **Público e objetivo:** público leigo. A pessoa deve sair entendendo que o micro-ondas sacode a água
  da comida, que a caixa de metal e a tela da porta prendem as ondas, e por que o prato gira.
- **Formato:** 90 s, 1080 × 1920, 30 fps (2700 frames), pt-BR, para **YouTube Shorts**. O tom é
  didático e ágil.
- **Voz:** a mesma do canal, Piper `pt_BR-faber-medium`, com alinhamento por palavra.
- **Direção de arte:** o mesmo estilo low-poly do canal, num canto de cozinha com fogão e balcão. O
  **micro-ondas é translúcido** e deixa ver a cavidade, o magnetron, o guia de ondas e o prato. As
  ondas aparecem como **arcos ciano** pulsando, as moléculas de água como "bolinhas com orelhas" que
  balançam, e o calor como cor vermelha/laranja na comida.
- **Câmera:** sem tranco. Só órbitas e dollies suaves. A estabilidade será medida no MP4 final.
- **Sistema construído:** fogo (falha) → ondas que entram na comida → moléculas de água → micro-ondas →
  magnetron e guia de ondas → caixa de metal → porta com tela → prato giratório → aparelho completo.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer esquentar a marmita do cliente bem rápido. Parece que basta pôr no fogo alto. | Abre com a cozinha inteira (`orbit([-0.7,1.05,-0.5], 12, 22°, 16°)`) e faz dolly-in até o fogão (`orbit([-1.6,1.1,-0.6], 5, 15°, 14°)`). O garçom coloca a marmita na panela e a chama sobe. | Cozinha, balcão, garçom, marmita, fogão com panela, chama. | `kitchen.reveal` spring 0→1 (−8 a 30). `marmita.toPot` 0→1 de W(s1,4) a W(s1,8)+6. `stove.flame` spring 0→1 em W(s1,14). | ❓ COMO ESQUENTAR RÁPIDO? (warning, de W(s1,2) até end−6). Destaques: MARMITA, RÁPIDO, FOGO. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que o fogo esquenta só por fora. A beirada queima e o meio continua gelado. | Dolly-in na panela; a marmita aparece em corte (d=3,2), com a borda vermelha e o centro azul. Órbita de 10°. | Marmita em corte com degradê de temperatura. | `marmita.cut` 0→1 de W(s2,3) a W(s2,7). `marmita.edgeHeat` 0→1 de W(s2,4) a W(s2,10)+8. `marmita.coldCore` spring em W(s2,13). | ✖ BEIRADA QUEIMA (de W(s2,9) a W(s2,13)) → ✖ MEIO GELADO (de W(s2,13) até end−4). Destaques: FORA, QUEIMA, GELADO. |
| 00:14:00 – 00:22:00 | 420 – 660 | Pra esquentar mais fundo, dá pra usar ondas invisíveis, parecidas com as do rádio, que entram alguns centímetros na comida. | A chama apaga. A câmera vai para a marmita em corte sobre o balcão (`orbit([-0.9,1.25,-0.4], 3.6, 20°, 12°)`). Arcos ciano chegam de fora e entram na comida até uma "linha de alcance" de alguns centímetros. | Ondas em arco (`waves`), linha tracejada de alcance. | `stove.flame` 1→0. `waves.show` 0→1 de W(s3,7) a W(s3,8)+10. `waves.depth` 0→1 de W(s3,15) a W(s3,17)+10. | ℹ ONDAS INVISÍVEIS (de W(s3,7) a W(s3,14)) → ✔ ENTRAM NA COMIDA, com a legenda "alguns centímetros" (de W(s3,15) até end−6). Destaques: ONDAS, RÁDIO, ENTRAM, CENTÍMETROS. |
| 00:22:00 – 00:30:00 | 660 – 900 | Elas fazem as moléculas de água balançarem bilhões de vezes por segundo. Esse sacode vira calor. São as micro-ondas. | Dolly-in até um close das moléculas de água (d=1,9→1,6). Elas giram e balançam com a onda e passam de azul para vermelho. | Moléculas de água low-poly (O vermelho + 2 H brancos). | `molecules.pop` spring em W(s4,3). `molecules.shake` 0→1 de W(s4,6) a W(s4,7)+6 (rotação = seno do frame × shake). `molecules.heat` 0→1 de W(s4,13) a W(s4,15)+8. | ℹ ÁGUA BALANÇA, com a legenda "bilhões de vezes por segundo" (de W(s4,5) a W(s4,12)) → ✔ MICRO-ONDAS, com a legenda "sacode a água e vira calor" (de W(s4,16) até end−6). Destaques: ÁGUA, BALANÇAREM, CALOR, MICRO-ONDAS. |
| 00:30:00 – 00:36:00 | 900 – 1080 | Mas quem cria essas ondas? Precisa de uma peça que transforme eletricidade em micro-ondas. | Dolly-out. O micro-ondas translúcido sobe no balcão e a marmita entra nele (`orbit([0.3,1.3,-0.8], 4.5, 10°, 10°)`). Em "eletricidade", um plugue acende na tomada. | Micro-ondas (`microwave`), tomada e plugue. | `molecules.out` 0→1. `marmita.toMicro` 0→1. `microwave.rise` spring em W(s5,2). `plug.pop` spring em W(s5,11). | ❓ QUEM CRIA AS ONDAS? (warning, de W(s5,0) até end−4). Destaques: CRIA, PEÇA, ELETRICIDADE. |
| 00:36:00 – 00:44:00 | 1080 – 1320 | É o magnetron. Ele fica escondido do lado da caixa e manda as ondas por um tubo até a comida. | Tracking até o compartimento lateral (`orbit([0.62,1.3,-0.8], 2.8, 45°, 14°)`): o magnetron (cilindro com aletas) acende. As ondas percorrem o guia por cima e entram na cavidade (`orbit([0.15,1.25,-0.8], 3, 12°→20°, 12–14°)`). | Magnetron, guia de ondas (`waveguide`), ondas na cavidade. | `magnetron.on` spring em W(s6,2). `waveguide.flow` 0→1 de W(s6,11) a W(s6,16)+6. `cavity.waves` 0→1 de W(s6,17) a W(s6,19)+10. | ✔ MAGNETRON, com a legenda "cria as micro-ondas" (de W(s6,2) a W(s6,11)) → ℹ GUIA DE ONDAS, com a legenda "o tubo até a comida" (de W(s6,14) até end−6). Destaques: MAGNETRON, ESCONDIDO, TUBO, COMIDA. |
| 00:44:00 – 00:50:00 | 1320 – 1500 | Só que ondas soltas escapariam pela cozinha. E aí? Como prender tudo lá dentro? | Dolly-out (d=6,5). As paredes ficam "apagadas" e alguns arcos atravessam a caixa e se espalham pela cozinha (**situação hipotética, marcada como esquemática**). | Ondas vazando (`waves.leak`). | `waves.leak` 0→1 de W(s7,2) a W(s7,6)+6. | ✖ ONDAS ESCAPANDO (de W(s7,3) a W(s7,7)) → ❓ COMO PRENDER? (de W(s7,9) até end−4). Destaques: SOLTAS, ESCAPARIAM, PRENDER. |
| 00:50:00 – 00:58:00 | 1500 – 1740 | Por isso a caixa é de metal. As paredes refletem as ondas, que ficam batendo lá dentro até a comida absorver. | As paredes ganham brilho metálico, os arcos que vazavam voltam e ricocheteiam por dentro. A câmera sobe para uma vista de cima (`orbit([0.15,1.3,-0.8], 3.5, 10°→30°, 55°)`); a marmita esquenta. | Paredes de metal (`walls.metal`), ricochetes (`waves.bounce`). | `waves.leak` 1→0. `walls.metal` 0→1 de W(s8,3) a W(s8,6)+6. `waves.bounce` 0→1 de W(s8,9) a W(s8,14). `marmita.absorb` 0→1 de W(s8,17) a end−8. | ✔ CAIXA DE METAL, com a legenda "reflete as ondas" (de W(s8,6) a W(s8,12)) → ✔ ONDAS PRESAS (de W(s8,14) até end−6). Destaques: METAL, REFLETEM, BATENDO, ABSORVER. |
| 00:58:00 – 01:04:00 | 1740 – 1920 | E a porta de vidro? Dá pra ver a comida, mas as ondas não saem. | A câmera desce para a frente da porta (`orbit([0.15,1.27,-0.48], 2.8, 4°, 6°)`); a porta acende e um ícone de olho aparece. | Porta com vidro (`door`). | `door.highlight` 0→1 de W(s9,2) a W(s9,4)+8. `door.eye` spring em W(s9,6). | ❓ E A PORTA DE VIDRO? (de W(s9,1) a W(s9,10)) → ℹ ONDAS NÃO SAEM (de W(s9,11) até end−4). Destaques: PORTA, VIDRO, VER, NÃO. |
| 01:04:00 – 01:12:00 | 1920 – 2160 | Ela tem uma tela de metal com furinhos. A luz passa, mas as micro-ondas são grandes demais pra atravessar. | Close na tela da porta (d=1,6→1,4): os furinhos crescem na tela. Raios amarelos de luz atravessam e um arco ciano bem maior que o furo bate e volta. | Tela metálica (`mesh`), raios de luz (`light`), onda bloqueada. | `mesh.zoom` 0→1 de W(s10,3) a W(s10,7)+8. `light.pass` 0→1 de W(s10,8) a W(s10,10)+6. `waves.blocked` 0→1 de W(s10,12) a W(s10,18). | ✔ TELA DE METAL, com a legenda "furinhos menores que a onda" (de W(s10,3) a W(s10,8)) → ✔ LUZ PASSA, ONDA NÃO (de W(s10,11) até end−6). Destaques: TELA, FURINHOS, LUZ, GRANDES. |
| 01:12:00 – 01:21:00 | 2160 – 2430 | Ainda tem um problema: as ondas se juntam em alguns pontos e deixam outros frios. Por isso o prato gira. | Vista de cima: um mapa sobre a marmita mostra manchas vermelhas (quentes) e azuis (frias). Em "gira", o prato começa a rodar e as manchas se misturam até ficar tudo laranja. | Mapa de pontos quentes (`hotspots`), prato giratório (`turntable`). | `hotspots.show` 0→1 de W(s11,4) a W(s11,7)+6. `turntable.spin` 0→1 (velocidade) de W(s11,18) a end. `hotspots.even` 0→1 de W(s11,18)+10 a end−4. | ✖ PONTOS FRIOS (de W(s11,7) a W(s11,15)) → ✔ PRATO GIRATÓRIO, com a legenda "espalha o calor" (de W(s11,17) até end−6). Destaques: PROBLEMA, PONTOS, FRIOS, GIRA. |
| 01:21:00 – 01:30:00 | 2430 – 2700 | Pronto: o micro-ondas sacode a água da comida e esquenta tudo em minutos. E a marmita sai no ponto! | Dolly-out até a cozinha inteira (`orbit([-0.7,1.05,-0.5], 12, 22°→34°, 16°)`), com o aparelho completo funcionando e rótulos 3D. Em "minutos", o sininho toca; o garçom serve a marmita fumegante; fade final. | Micro-ondas completo, rótulos MAGNETRON / GUIA DE ONDAS / CAIXA DE METAL / TELA / PRATO GIRATÓRIO. | `final.labels` escalonado a partir de W(s12,3). `bell.ding` spring em W(s12,12). `waiter.serve` spring em W(s12,15). `fade` 0→1 de end−20 a end. | ℹ COMO FUNCIONA O MICRO-ONDAS, com a legenda "sacode a água da comida" (`size:"large"`, de W(s12,3) até end). Destaques: SACODE, ÁGUA, MINUTOS, PONTO. |

**Soma:** 7 + 7 + 8 + 8 + 6 + 8 + 6 + 8 + 6 + 8 + 9 + 9 = **90 s = 2700 frames**. As cenas são contíguas
e começam no frame 0.

## 3. Estrutura de dados

O contrato completo, com as 12 cenas, está em [`scene-plan.ts`](./scene-plan.ts), nos mesmos tipos do
template (vira `src/data/scenes.ts` na Fase 2). A linha do tempo é determinística: tudo é calculado a
partir do frame, e as ondas e moléculas são funções puras do frame. É 3D real com React Three Fiber,
com a camada 2D de badges e legendas por cima. Não há tranco de câmera.

## 4. Áudio e montagem

**Narração integral** (213 palavras; ~78 s na voz do canal):

> Você quer esquentar a marmita do cliente bem rápido. Parece que basta pôr no fogo alto. Só que o
> fogo esquenta só por fora. A beirada queima e o meio continua gelado. Pra esquentar mais fundo, dá
> pra usar ondas invisíveis, parecidas com as do rádio, que entram alguns centímetros na comida. Elas
> fazem as moléculas de água balançarem bilhões de vezes por segundo. Esse sacode vira calor. São as
> micro-ondas. Mas quem cria essas ondas? Precisa de uma peça que transforme eletricidade em
> micro-ondas. É o magnetron. Ele fica escondido do lado da caixa e manda as ondas por um tubo até a
> comida. Só que ondas soltas escapariam pela cozinha. E aí? Como prender tudo lá dentro? Por isso a
> caixa é de metal. As paredes refletem as ondas, que ficam batendo lá dentro até a comida absorver. E
> a porta de vidro? Dá pra ver a comida, mas as ondas não saem. Ela tem uma tela de metal com
> furinhos. A luz passa, mas as micro-ondas são grandes demais pra atravessar. Ainda tem um problema:
> as ondas se juntam em alguns pontos e deixam outros frios. Por isso o prato gira. Pronto: o
> micro-ondas sacode a água da comida e esquenta tudo em minutos. E a marmita sai no ponto!

- **Efeitos** (sintetizados): whoosh, chama, zumbido do magnetron, "clunk" metálico, motor do prato,
  "ding" do micro-ondas, mais os sons dos badges.
- **Trilha:** a linha lo-fi do canal, abaixando sob a voz.
- **Mixagem:** −14 LUFS / −1,5 dBTP.

## 5. Rigor do conteúdo

- **"Esquenta de dentro pra fora" é mito, e o roteiro evita.** As micro-ondas penetram alguns
  centímetros e aquecem essa camada diretamente; o centro de peças grossas esquenta por condução. Por
  isso a narração diz "entram alguns centímetros na comida".
- **"Bilhões de vezes por segundo":** fornos domésticos usam frequência de cerca de 2,45 GHz, ou seja,
  2,45 bilhões de oscilações por segundo. O número em si não aparece na tela.
- **Tela da porta:** os furos têm poucos milímetros e o comprimento de onda tem cerca de 12 cm. A luz
  visível passa; as micro-ondas não.
- **Prato giratório:** as ondas formam pontos de máxima e mínima intensidade (ondas estacionárias). O
  prato gira para a comida passar por eles. Alguns modelos usam um ventilador de ondas em vez do prato;
  o vídeo mostra o prato, que é o mais comum.
- **Cena 7 é hipotética:** as ondas "escapando" representam o que aconteceria sem a caixa de metal. Um
  micro-ondas real em bom estado não vaza dessa forma.
- **Segurança:** o vídeo não ensina a abrir nem a consertar o aparelho.

## 6. Critérios de aceite (conferidos na Fase 1)

- [x] Gancho imediato com o garçom e a marmita desde o frame 0.
- [x] Cadeia causal: fogo falha → ondas → água balança → micro-ondas → magnetron → ondas escapariam →
      caixa de metal → porta → tela → pontos frios → prato gira → aparelho completo.
- [x] Termos técnicos só aparecem depois de o problema ser mostrado.
- [x] Tabela com 12 linhas e 7 colunas, frames contíguos e soma de 2700; plano compilado e validado.
- [x] 213 palavras, compatível com 90 s na voz do canal; sem tranco de câmera.
- [ ] **Ainda não feito:** TTS, render e validação visual. Isso fica para a Fase 2.
