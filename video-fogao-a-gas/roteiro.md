# Roteiro — Como funciona o fogão a gás?

> **Versão:** v1.1 (Fase 1), 31/10/2026 — v1 + troca da voz para ElevenLabs. **Origem:** roteiro escrito pelo agente, a pedido do usuário
> ("outro vídeo"). O tema foi escolhido pelo agente, sem envolver dinheiro.
> **Situação:** AGUARDANDO APROVAÇÃO. A implementação e a renderização ainda não começaram.
>
> **Convenção:** MM:SS:FF a 30 fps; frames em [início, fim). Os tempos são estimativas: depois da voz
> real, os cortes seguem a narração.

## 1. Briefing de produção

- **Tema:** o fogão a gás doméstico. O gás precisa de faísca (acendedor) e de ar misturado (tubo
  misturador / injetor) para virar chama azul. O botão controla uma válvula que regula o tamanho da
  chama. Em muitos fogões, um sensor de calor fecha o gás se a chama apagar. O gás de cozinha recebe
  um cheiro de propósito, para que vazamentos sejam percebidos.
- **Personagem:** o garçom do canal "Explica Aí", que quer esquentar uma sopa.
- **Formato:** 90 s, 1080 × 1920, 30 fps, em português do Brasil, para **YouTube Shorts**.
- **Voz (v1.1):** **ElevenLabs**, voz **Marcos Alves** (`vg59CKS3V0y1IGGzYVgn`, brasileira, conversacional,
  indicada para conteúdo educativo e redes sociais), modelo `eleven_multilingual_v2`. Pedido do usuário:
  "Use a voz do eleven labs a partir de agora". Custo estimado: ~1.000 créditos (≈ US$ 0,10) por
  versão da narração inteira. Os tempos por palavra virão do alinhamento automático, como antes.
- **Arte:** low-poly do canal. O fogão aparece **em corte lateral**, mostrando o botão, a válvula, o
  injetor, o tubo misturador com entrada de ar, o queimador com furinhos, o acendedor e o sensor. O gás
  é representado por partículas amarelo-claras, o ar por partículas azul-claras e a chama em amarelo
  (ruim) ou azul (boa).
- **Sem tremedeira:** só órbitas e dollies suaves. A chama tremula de leve, só nos próprios cones. A
  estabilidade será medida no MP4.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer acender a boca do fogão pra esquentar a sopa. Parece que basta abrir o gás. | Abre na cozinha (`orbit([-0.4,1.0,-0.4], 12, 20°, 16°)`) e faz dolly-in até o fogão (d=4,5). O garçom põe a panela de sopa na boca e gira o botão; o gás começa a sair. | Cozinha, garçom, fogão, panela de sopa, botão, partículas de gás. | `kitchen.reveal` spring. `pot.place` spring. `knob.turn` 0→0,6. `gas.flow` 0→1. | ❓ COMO ACENDER? Destaques: ACENDER, SOPA, GÁS. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que o gás sozinho não pega fogo. Ele precisa de uma faísca pra começar a queimar. | Dolly-in no queimador, que aparece em corte (d=2,2): o gás sai pelos furinhos, mas não acende, e um "✖" aparece sobre ele. | Queimador em corte, gás saindo. | `burner.cut` 0→1. `noFire.mark` spring. | ✖ GÁS NÃO PEGA FOGO SOZINHO → ℹ PRECISA DE FAÍSCA. Destaques: GÁS, SOZINHO, FAÍSCA, QUEIMAR. |
| 00:14:00 – 00:22:00 | 420 – 660 | Por isso o fogão tem um acendedor. Ao girar o botão, ele solta uma faísca bem do lado do queimador. | Close no acendedor (d=1,4), um pino ao lado do queimador que acende. O botão gira, sai uma faísca (raio branco e azul curto) e a chama acende, ainda amarela. | Acendedor, faísca, chama. | `igniter.glow`. `knob.turn` →0,9. `spark.on` spring. `flame.size` 0→0,7. | ✔ ACENDEDOR, com a legenda "faísca do lado do queimador". Destaques: ACENDEDOR, GIRAR, FAÍSCA, QUEIMADOR. |
| 00:22:00 – 00:28:00 | 660 – 840 | Mas, se o gás sair puro, a chama fica amarela, fraca e solta fuligem. | Dolly-out até a chama (d=2): ela fica amarela e baixa, e saem pontinhos pretos de fuligem que sujam o fundo da panela. | Chama amarela, fuligem. | `spark.on` →0. `flame.yellow` 0→1. `soot.on` 0→1. | ✖ CHAMA AMARELA → ✖ FULIGEM, com a legenda "queima incompleta". Destaques: PURO, AMARELA, FRACA, FULIGEM. |
| 00:28:00 – 00:37:00 | 840 – 1110 | Pra queimar direito, o gás precisa de ar. Então, antes de sair, ele passa por um tubinho que puxa o ar da cozinha. | O corpo do fogão abre em corte e a câmera vai até o tubo misturador (d=2,2). O gás sai do injetor em jato e partículas azuis de ar entram por uma janela no tubo. | Fogão em corte, injetor, tubo misturador, partículas de ar. | `stove.cut` 0→1. `mixer.glow` 0→1. `air.in` 0→1. | ℹ PRECISA DE AR → ✔ TUBO MISTURADOR, com a legenda "puxa o ar da cozinha". Destaques: AR, TUBINHO, PUXA, COZINHA. |
| 00:37:00 – 00:45:00 | 1110 – 1350 | Misturado na medida certa, ele sai pelos furinhos do queimador e vira uma chama azul e forte. | Câmera vertical acompanhando a mistura até o queimador (d=2). A chama passa de amarela a azul e cresce; a fuligem some. | Partículas misturadas, chama azul. | `mix.ok` 0→1. `flame.yellow` →0. `soot.on` →0. `flame.size` →1. | ✔ MISTURA CERTA, com a legenda "gás + ar" → ✔ CHAMA AZUL, com a legenda "queima completa". Destaques: MISTURADO, FURINHOS, AZUL, FORTE. |
| 00:45:00 – 00:50:00 | 1350 – 1500 | E como deixar o fogo mais alto ou mais baixo? | Órbita lenta em volta da chama azul. | Chama azul. | `air.in` →0. | ❓ COMO REGULAR O FOGO? Destaques: ALTO, BAIXO. |
| 00:50:00 – 00:57:00 | 1500 – 1710 | O botão abre e fecha uma válvula. Mais aberta, passa mais gás e a chama cresce. | Close no botão (d=1,6); a válvula aparece em corte atrás dele. O botão gira para "baixo" (chama pequena) e depois para "alto" (chama grande); a câmera abre (d=2,4) para mostrar as duas coisas juntas. | Botão, válvula em corte, chama. | `valve.show` 0→1. `knob.turn` →0,4 e →1. `flame.size` →0,45 e →1,25. | ✔ VÁLVULA DO BOTÃO → ✔ MAIS GÁS, MAIS CHAMA. Destaques: BOTÃO, VÁLVULA, ABERTA, CRESCE. |
| 00:57:00 – 01:03:00 | 1710 – 1890 | Mas, e se um vento apagar a chama? O gás continuaria saindo. | Uma rajada de vento (linhas brancas) passa da esquerda para a direita e a chama apaga; as partículas de gás continuam saindo, sem fogo. | Rajada de vento, gás sem chama. | `wind.gust` spring. `flame.size` →0. `gas.leakShow` 0→1. | ✖ VENTO APAGA → ✖ GÁS SAINDO SEM CHAMA. Destaques: VENTO, APAGAR, CONTINUARIA. |
| 01:03:00 – 01:11:00 | 1890 – 2130 | Muitos fogões têm um sensor de calor perto da chama. Se ela apaga, ele fecha o gás sozinho. | Close no sensor (uma haste metálica ao lado do queimador, d=1,4). Ele vai de vermelho para azul (esfriou), a válvula de segurança fecha com um "clique" e o gás para. | Sensor de calor, válvula de segurança. | `sensor.pop` spring. `sensor.cool` 0→1. `safetyValve.close` 0→1. `gas.leakShow` →0. | ✔ SENSOR DE CALOR, com a legenda "em muitos fogões" → ✔ FECHA O GÁS SOZINHO. Destaques: SENSOR, CALOR, FECHA, SOZINHO. |
| 01:11:00 – 01:20:00 | 2130 – 2400 | E tem mais: o gás de cozinha não tem cheiro. Por isso colocam um cheiro forte nele, pra você perceber um vazamento. | A câmera vai até o botijão (`orbit([1.1,0.5,-0.9], 3, 20°→30°, 14–16°)`). Aparece um nariz com "✖"; depois ondas verde-amareladas de cheiro saem do gás, e o nariz ganha um "!". | Botijão, ondas de cheiro, ícone de nariz. | `cylinder.pop`. `noSmell.mark`. `smell.on` 0→1. `nose.pop`. | ⚠ GÁS SEM CHEIRO → ✔ CHEIRO DE PROPÓSITO, com a legenda "pra você perceber um vazamento". Destaques: CHEIRO, FORTE, PERCEBER, VAZAMENTO. |
| 01:20:00 – 01:30:00 | 2400 – 2700 | Pronto: gás, ar e faísca, na medida certa. E a sopa fica no ponto! | Volta ao fogão com a chama azul e rótulos (BOTÃO E VÁLVULA, TUBO MISTURADOR, ACENDEDOR, SENSOR); depois abre para a cozinha, e o garçom serve a sopa fumegante; fade final. | Rótulos, garçom servindo. | `flame.size` →1. `final.labels` 0→1 e →0. `waiter.serve` spring. `fade`. | ℹ FOGÃO A GÁS, com a legenda "gás + ar + faísca" (large). Destaques: GÁS, AR, FAÍSCA, SOPA, PONTO. |

**Soma:** 7 + 7 + 8 + 6 + 9 + 8 + 5 + 7 + 6 + 8 + 9 + 10 = **90 s = 2700 frames**. As cenas são
contíguas.

## 3. Estrutura de dados

As 12 cenas estão em [`scene-plan.ts`](./scene-plan.ts), nos tipos do template: o plano compilou e a
timeline foi validada. Tudo é calculado a partir do frame. Não há tranco de câmera.

## 4. Áudio

**Narração** (200 palavras; duração final depende da voz ElevenLabs, ajustada às cenas pela voz real):

> Você quer acender a boca do fogão pra esquentar a sopa. Parece que basta abrir o gás. Só que o gás
> sozinho não pega fogo. Ele precisa de uma faísca pra começar a queimar. Por isso o fogão tem um
> acendedor. Ao girar o botão, ele solta uma faísca bem do lado do queimador. Mas, se o gás sair puro,
> a chama fica amarela, fraca e solta fuligem. Pra queimar direito, o gás precisa de ar. Então, antes
> de sair, ele passa por um tubinho que puxa o ar da cozinha. Misturado na medida certa, ele sai pelos
> furinhos do queimador e vira uma chama azul e forte. E como deixar o fogo mais alto ou mais baixo? O
> botão abre e fecha uma válvula. Mais aberta, passa mais gás e a chama cresce. Mas, e se um vento
> apagar a chama? O gás continuaria saindo. Muitos fogões têm um sensor de calor perto da chama. Se
> ela apaga, ele fecha o gás sozinho. E tem mais: o gás de cozinha não tem cheiro. Por isso colocam um
> cheiro forte nele, pra você perceber um vazamento. Pronto: gás, ar e faísca, na medida certa. E a
> sopa fica no ponto!

**Efeitos sintetizados:** clique do botão, chiado de gás, estalo da faísca, "fwump" da chama, vento,
"clique" da válvula de segurança e "ding". A trilha lo-fi do canal fica por baixo da voz.

## 5. Rigor do conteúdo

- **Mistura com ar:** queimadores domésticos usam um injetor que solta o gás em jato dentro de um tubo
  misturador. O jato arrasta o ar (efeito Venturi), e a mistura sai pelos furinhos. Gás com pouco ar
  queima de forma incompleta: chama amarela e fuligem. Com a mistura certa, a chama fica azul.
- **Acendedor:** a maioria dos fogões atuais tem acendimento automático por faísca; modelos mais
  simples são acesos com fósforo. O vídeo mostra o acendedor.
- **Sensor:** "muitos fogões" têm um termopar ou outro sensor de chama que fecha o gás se ela apagar.
  Não é universal, e o badge diz isso.
- **Cheiro:** o gás de cozinha (GLP) quase não tem cheiro natural. Distribuidores adicionam um
  odorizante de cheiro forte para que vazamentos sejam percebidos.
- **Segurança:** o vídeo não ensina a mexer em válvulas, mangueiras ou regulador. A única mensagem
  prática é que o cheiro existe para avisar de um vazamento.

## 6. Critérios de aceite (Fase 1)

- [x] Gancho imediato; cadeia causal: abrir o gás não basta → faísca → chama amarela → ar → tubo
      misturador → chama azul → regular → válvula → vento apaga → sensor → cheiro → sopa pronta.
- [x] 12 cenas e 7 colunas; soma de 2700 frames; plano compilado e validado.
- [x] 200 palavras, compatível com 90 s; sem tranco de câmera.
- [ ] **Ainda não feito:** TTS, render e validação visual. Isso fica para a Fase 2.
