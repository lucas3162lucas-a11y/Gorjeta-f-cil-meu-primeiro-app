# Roteiro — Como funciona a panela de pressão?

> **Versão:** v1 (Fase 1), 30/10/2026. **Origem:** roteiro escrito pelo agente, a pedido do usuário
> ("faça outro vídeo"). O tema foi escolhido pelo agente, sem envolver dinheiro.
> **Situação:** AGUARDANDO APROVAÇÃO. A implementação e a renderização ainda não começaram.
>
> **Convenção:** MM:SS:FF a 30 fps; frames em [início, fim). Os tempos são estimativas: depois da voz
> real, os cortes seguem a narração.

## 1. Briefing de produção

- **Tema:** a panela de pressão doméstica. A tampa trava e a borracha veda, o vapor fica preso, a
  pressão sobe, a água passa a ferver acima de 100 °C e a comida cozinha mais rápido. O pino com peso
  limita a pressão e há uma válvula de segurança extra.
- **Personagem:** o garçom do canal "Explica Aí", com pressa para cozinhar o feijão do almoço.
- **Formato:** 90 s, 1080 × 1920, 30 fps, em português do Brasil, para **YouTube Shorts**. A voz é a do
  canal (Piper `faber`).
- **Arte:** low-poly do canal, com o fogão no centro. A panela aparece **em corte** para mostrar a água,
  as bolhas, o vapor (nuvens brancas mais densas conforme a pressão), o feijão (duro → macio), um
  termômetro com a marca de 100 °C e um manômetro sem números.
- **Sem tremedeira:** só órbitas e dollies suaves. O pino balança devagar (cerca de 2 Hz) e a
  estabilidade será medida no MP4, como nos outros vídeos.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer cozinhar o feijão do almoço bem rápido. Parece que basta deixar o fogo no máximo. | Abre na cozinha (`orbit([-0.4,1.05,-0.4], 12, 20°, 16°)`) e faz dolly-in até o fogão (d=5). O garçom despeja o feijão na panela aberta e aumenta a chama. | Cozinha, garçom, fogão, panela aberta, feijão, chama. | `kitchen.reveal` spring (−8 a 30). `beans.toPot` de W(s1,4) a W(s1,6)+8. `stove.flame` spring em W(s1,14). | ❓ COMO COZINHAR RÁPIDO? Destaques: FEIJÃO, RÁPIDO, FOGO, MÁXIMO. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que a água fervendo não passa de cem graus. Fogo mais alto só faz ela evaporar mais rápido. | Close da panela em corte (d=2,8): a água ferve, o termômetro sobe e **para na marca de 100 °C**, e o vapor aumenta. Órbita de 10°. | Água com bolhas, termômetro com marca de 100 °C, vapor. | `pot.boil` 0→1. `thermo.pop` spring; `thermo.level` 0,3→0,62 (para em 100 °C). `steam.amount` 0,2→1. | ✖ TRAVA NOS 100 °C → ✖ SÓ EVAPORA MAIS. Destaques: FERVENDO, CEM, GRAUS, EVAPORAR. |
| 00:14:00 – 00:21:00 | 420 – 630 | E o vapor carrega o calor embora. Com a panela aberta, ele escapa pelo ar da cozinha. | A câmera sobe acompanhando o vapor (`orbit([0,1.45,-0.65], 3.6, 20°, 10°)`); pontinhos laranja de calor vão junto com as nuvens e somem no ar. | Vapor, partículas de calor. | `heat.inSteam` 0→1. `steam.escape` 0→1. | ✖ VAPOR LEVA O CALOR → ✖ PANELA ABERTA. Destaques: VAPOR, CALOR, ABERTA, ESCAPA. |
| 00:21:00 – 00:30:00 | 630 – 900 | Por isso a panela de pressão tem uma tampa que trava e uma borracha que veda tudo. O vapor fica preso lá dentro. | A tampa desce e gira até travar (d=2,6, órbita 24°→40°); a borracha acende em verde ao redor da borda; o vapor para de sair e fica dentro. | Tampa com trava, borracha de vedação, vapor preso. | `lid.drop` spring; `lid.lock` 0→1 (giro). `gasket.glow` 0→1. `steam.escape` 1→0. `steam.trapped` 0→1. | ✔ TAMPA QUE TRAVA → ✔ BORRACHA DE VEDAÇÃO → ✔ VAPOR PRESO. Destaques: TAMPA, TRAVA, BORRACHA, VEDA, PRESO. |
| 00:30:00 – 00:36:00 | 900 – 1080 | Preso, o vapor se acumula e aperta tudo. A pressão lá dentro sobe. | Dolly-in na panela; as nuvens de vapor ficam mais densas e com setas apontando para as paredes; o manômetro aparece e o ponteiro sobe. | Vapor denso, setas de pressão, manômetro sem números. | `steam.density` 0→1. `gauge.pop` spring; `gauge.needle` 0,1→0,7. | ℹ PRESSÃO SOBE. Destaques: PRESO, ACUMULA, APERTA, PRESSÃO. |
| 00:36:00 – 00:44:00 | 1080 – 1320 | E com mais pressão, a água só ferve acima dos cem graus. Mais quente, o feijão cozinha bem mais rápido. | A panela volta para o corte; o termômetro **passa da marca de 100 °C**; os grãos de feijão mudam de duros (marrom-escuro, angulosos) para macios (mais claros e redondos). | Termômetro, feijão. | `pot.cut` 0→1. `thermo.level` →0,85. `beans.cook` 0→1. | ✔ FERVE ACIMA DE 100 °C → ✔ COZINHA MAIS RÁPIDO. Destaques: PRESSÃO, ACIMA, QUENTE, RÁPIDO. |
| 00:44:00 – 00:50:00 | 1320 – 1500 | Mas pressão demais seria perigosa. Como evitar que ela passe do ponto? | Dolly-out para o manômetro: o ponteiro vai para a faixa vermelha, que pisca devagar. | Manômetro com faixa vermelha. | `pot.cut` 1→0. `gauge.needle` →0,95. `gauge.alert` 0→1. | ✖ PRESSÃO DEMAIS → ❓ COMO EVITAR? Destaques: DEMAIS, PERIGOSA, EVITAR. |
| 00:50:00 – 00:59:00 | 1500 – 1770 | Em cima da tampa tem um pino com peso. Quando a pressão passa do limite, ele levanta e solta um pouco de vapor. | Dolly-in no pino (d=1,6), que aparece em corte: um canal fino tampado pelo peso. Em "levanta", o peso sobe alguns milímetros e sai um jato de vapor; o ponteiro do manômetro volta para 0,7. | Pino com peso em corte, jato de vapor. | `valve.highlight`, `valve.cut`, `valve.lift` 0→1, `jet.on` 0→1, `gauge.needle` →0,7. | ℹ PINO COM PESO → ✔ LEVANTA E SOLTA VAPOR. Destaques: PINO, PESO, LIMITE, LEVANTA, VAPOR. |
| 00:59:00 – 01:06:00 | 1770 – 1980 | É a válvula de pressão. É por isso que a panela chia e o pino fica balançando. | Órbita lenta em volta do pino, que balança devagar (≈2 Hz) soltando vapor em pulsos. | Pino balançando, jato pulsante. | `valve.wobble` 0→1 (inclinação = seno lento do frame). | ✔ VÁLVULA DE PRESSÃO → ℹ CHIA E BALANÇA. Destaques: VÁLVULA, PRESSÃO, CHIA, BALANÇANDO. |
| 01:06:00 – 01:14:00 | 1980 – 2220 | E se a válvula entupir? Ainda tem uma segunda saída de segurança, que libera o vapor antes de virar problema. | O pino fica cinza com um "X" (entupido, **esquemático**). A câmera desliza até a válvula de segurança na tampa (d=1,6), que acende e solta vapor. | Válvula de segurança. | `valve.clog` 0→1. `jet.on` →0. `safety.highlight` spring. `safety.release` 0→1. | ❓ E SE ENTUPIR? → ✔ VÁLVULA DE SEGURANÇA. Destaques: ENTUPIR, SEGUNDA, SEGURANÇA, LIBERA. |
| 01:14:00 – 01:21:00 | 2220 – 2430 | Por isso, só abra a panela depois que todo o vapor sair e a pressão baixar. | Dolly-out: a chama apaga, o vapor sai até acabar e o ponteiro do manômetro desce até o zero. | Chama, vapor, manômetro. | `stove.flame` →0. `gauge.needle` →0,05. `jet.on` 0,6→0. | ⚠ SÓ ABRA SEM PRESSÃO, com a legenda "espere todo o vapor sair". Destaques: ABRA, DEPOIS, VAPOR, BAIXAR. |
| 01:21:00 – 01:30:00 | 2430 – 2700 | Pronto: a panela prende o vapor, sobe a pressão e cozinha mais quente. E o feijão sai no ponto! | Rótulos 3D (TAMPA/BORRACHA, PINO COM PESO, VÁLVULA DE SEGURANÇA, MANÔMETRO), depois a câmera abre para a cozinha inteira; a tampa abre e o garçom serve um prato de feijão fumegante; fade final. | Rótulos, prato servido. | `final.labels` 0→1 e →0 em W(s12,13). `lid.open` spring. `waiter.serve` spring. `fade`. | ℹ PANELA DE PRESSÃO, com a legenda "prende o vapor e cozinha mais quente" (large). Destaques: PRENDE, VAPOR, PRESSÃO, QUENTE, PONTO. |

**Soma:** 7 + 7 + 7 + 9 + 6 + 8 + 6 + 9 + 7 + 8 + 7 + 9 = **90 s = 2700 frames**. As cenas são contíguas.

## 3. Estrutura de dados

As 12 cenas estão em [`scene-plan.ts`](./scene-plan.ts), nos tipos do template: o plano compilou e a
timeline foi validada. Tudo é calculado a partir do frame, com 3D real (React Three Fiber) e badges e
legendas em 2D por cima. Não há tranco de câmera.

## 4. Áudio

**Narração** (216 palavras, ~75 s na voz do canal):

> Você quer cozinhar o feijão do almoço bem rápido. Parece que basta deixar o fogo no máximo. Só que a
> água fervendo não passa de cem graus. Fogo mais alto só faz ela evaporar mais rápido. E o vapor
> carrega o calor embora. Com a panela aberta, ele escapa pelo ar da cozinha. Por isso a panela de
> pressão tem uma tampa que trava e uma borracha que veda tudo. O vapor fica preso lá dentro. Preso, o
> vapor se acumula e aperta tudo. A pressão lá dentro sobe. E com mais pressão, a água só ferve acima
> dos cem graus. Mais quente, o feijão cozinha bem mais rápido. Mas pressão demais seria perigosa. Como
> evitar que ela passe do ponto? Em cima da tampa tem um pino com peso. Quando a pressão passa do
> limite, ele levanta e solta um pouco de vapor. É a válvula de pressão. É por isso que a panela chia e
> o pino fica balançando. E se a válvula entupir? Ainda tem uma segunda saída de segurança, que libera
> o vapor antes de virar problema. Por isso, só abra a panela depois que todo o vapor sair e a pressão
> baixar. Pronto: a panela prende o vapor, sobe a pressão e cozinha mais quente. E o feijão sai no
> ponto!

**Efeitos sintetizados:** chama, bolhas, vapor, "clunk" da tampa, chiado da válvula e "ding". A trilha
lo-fi do canal fica por baixo da voz.

## 5. Rigor do conteúdo

- **100 °C:** é o ponto de ebulição da água ao nível do mar. Em lugares altos ele fica um pouco
  abaixo. O roteiro simplifica para "cem graus", e o termômetro só marca a linha de 100 °C, sem outros
  números.
- **Acima de 100 °C:** com mais pressão, a água ferve a uma temperatura mais alta (em panelas
  domésticas, algo como 110–120 °C, conforme o modelo). O vídeo diz só "acima dos cem graus" e não cita
  um número exato.
- **Válvulas:** as panelas vendidas no Brasil têm o pino (válvula de pressão, com peso) e uma válvula de
  segurança. A cena do pino "entupido" é esquemática.
- **Segurança:** a única orientação prática do vídeo é **esperar o vapor sair e a pressão baixar antes
  de abrir**, que é uma orientação básica de uso seguro. O vídeo não ensina a forçar, desmontar ou
  adaptar válvulas.

## 6. Critérios de aceite (Fase 1)

- [x] Gancho imediato; cadeia causal: fogo alto falha → 100 °C → vapor escapa → tampa e borracha →
      pressão sobe → ferve mais quente → pressão demais → pino com peso → chiado → válvula de segurança
      → abrir só sem pressão → feijão pronto.
- [x] 12 cenas e 7 colunas; soma de 2700 frames; plano compilado e validado.
- [x] 216 palavras, compatível com 90 s; sem tranco de câmera.
- [ ] **Ainda não feito:** TTS, render e validação visual. Isso fica para a Fase 2.
