# Roteiro: Pra onde vão os 10% da sua conta?

> **Versão:** v1 (Fase 1), criada em 29/10/2026. **Origem:** roteiro escrito pelo agente a partir do tema
> escolhido pelo usuário ("como funciona a taxa de serviço de 10% num restaurante").
> **Situação:** APROVADO pelo usuário ("aprovado, pode gerar") em 29/10/2026. Fase 2 executada; os
> ajustes técnicos estão na seção 7. O texto da narração e a ordem das cenas não mudaram.
>
> **Convenção de tempo:** os timestamps estão em MM:SS:FF a 30 fps, com FF de 00 a 29. Os frames usam
> intervalo semiaberto [início, fim): o último frame de uma cena é o primeiro da cena seguinte. Todos os
> tempos são estimativas até existir a narração final. Depois dela, os cortes passam a seguir a voz real.

## 1. Briefing de produção

- **Tema e recorte:** a taxa de serviço (gorjeta cobrada na conta) em bares e restaurantes no **Brasil**.
  Vamos acompanhar uma única conta de restaurante: o cliente paga, o dinheiro passa pelo caixa, vai para
  o pote da gorjeta, é dividido entre a equipe e uma parte cobre os encargos.
- **Público:** leigo. É quem paga os 10% sem saber para onde eles vão.
- **Objetivo:** entender por que a taxa existe, de quem ela é, como é dividida, por que parte dela pode
  ficar retida e que pagá-la é opcional para o cliente.
- **Formato:** 90 s, 1080 × 1920 (9:16), 30 fps (2700 frames, de 0 a 2699), em português do Brasil.
- **Tom:** didático, informal e ágil, sempre falando com "você". Sem saudação, sem apresentar canal e sem
  pedir curtida.
- **Voz (TTS):** edge-tts, gratuito, com a voz `pt-BR-AntonioNeural` e velocidade +5%. Pode trocar por
  `pt-BR-FranciscaNeural`. Só uso ElevenLabs ou outra voz paga com sua autorização.
- **Direção de arte:** diorama 3D low-poly de um **restaurante em corte**, como uma casa de bonecas sem a
  parede da frente. À esquerda fica o **salão** (mesa, cliente, garçom). No centro, o **balcão do caixa**
  com o **pote da gorjeta**. À direita, atrás de um meio-muro com janela de passagem, a **cozinha**
  (cozinheira e ajudante na pia). Paleta quente: piso de madeira caramelo, paredes creme, toalha vinho,
  moedas douradas e notas verde-claras. Fundo em degradê pêssego → âmbar ao anoitecer.
  Cores de significado: problema em vermelho com ✖, solução em verde com ✔, termo em azul com i,
  pergunta em amarelo com ?.
- **Sistema que vai sendo montado:** começa com uma mesa e uma nota. Ao longo do vídeo entram a conta
  com a linha SERVIÇO, o pote único, a separação entre o caixa da casa e o caixa da gorjeta, o disco do
  rateio no chão, o cofre de encargos e, por fim, o fluxo completo de moedas até cada funcionário. Tudo o
  que entra continua visível até o fim.
- **Problemas que fazem o sistema evoluir:** (1) a nota na mesa só chega ao garçom → pote único;
  (2) o dinheiro se mistura ao caixa da casa → a gorjeta é dos funcionários e aparece separada;
  (3) dividir entre funções diferentes → rateio combinado com os trabalhadores; (4) a gorjeta gera
  encargos → parte retida para pagá-los; (5) "sou obrigado?" → a taxa é opcional.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você adorou o atendimento e quer agradecer. Parece que basta deixar uma nota na mesa pro garçom. | Abre na mesa do salão: câmera `orbit([-1.6,0.9,0.6], 11, 28°, 16°)`, com push-in lento até d=8 enquanto o cliente pega a carteira. Em "nota", close na mão que deixa a cédula; em "garçom", leve giro (az 28°→14°) que enquadra o garçom sorrindo. | Restaurante em corte (`restaurant`), mesa com prato vazio (`table`), cliente sentado (`customer`), garçom de pé (`waiter`), cédula verde (`tipNote`). A cozinha aparece desfocada ao fundo, ainda sem destaque. | `restaurant.reveal` spring 0→1 nos frames locais 0–30 (damping 12): o diorama sobe do chão. `tipNote.place` interpolate 0→1 (out) de W(s1,12)−4 a W(s1,12)+14, saindo da mão e pousando na mesa. `waiter.wave` spring 0→1 em W(s1,16). Deriva contínua da câmera de 0,6°/s. | ❓ COMO AGRADECER? (warning, `icon:"?"`, de W(s1,5) até end−6). Destaques: AGRADECER, NOTA, GARÇOM. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que o garçom não fez seu prato. Na cozinha, mais gente trabalhou, e não viu nada. | Câmera em tracking da mesa até a cozinha: `orbit([2.2,1.0,-0.4], 10, −15°, 14°)`, passando pela janela de passagem (ease soft). Em "não viu nada", leve dolly-out para mostrar ao mesmo tempo a nota (só no salão) e a cozinha vazia de moedas. | Cozinha (`kitchen`) com fogão e panelas, cozinheira (`cook`), ajudante na pia com pratos (`dishwasher`). Seta tracejada vermelha da nota até o garçom, mostrando que o dinheiro fica só ali. | `kitchen.highlight` interpolate 0→1 de W(s2,9) a W(s2,9)+12. `cook.work` e `dishwasher.work` em loop determinístico (seno do frame), sempre ligados. `tipArrow.draw` 0→1 de W(s2,13) a W(s2,13)+12. `kitchen.dim` 0→0,35 em "nada" (cozinha "apaga" um pouco). | ✖ SÓ O GARÇOM RECEBE (negative, de W(s2,13) até end−4). Destaques: PRATO, COZINHA, NADA. |
| 00:14:00 – 00:23:00 | 420 – 690 | Por isso, muitos restaurantes põem um valor extra na conta, que vai pra um pote só. É a taxa de serviço. | Câmera volta ao centro, `orbit([0.4,1.2,-0.6], 12, 10°, 14°)`. Em "conta", close na conta impressa (d=6) e, em seguida, dolly-out para pegar o pote no balcão e as moedas indo para ele. Em "taxa de serviço", órbita de 12° em volta do pote. | Conta de papel em 3D (`bill`) com as linhas CONSUMO e SERVIÇO. Pote de vidro no balcão do caixa (`tipJar`). Fluxo de moedas (`coins`) saindo de três mesas para o pote. A cozinha volta a ficar iluminada. | `bill.print` interpolate 0→1 (linear) de W(s3,7) a W(s3,9)+6, com o papel saindo da impressora. `bill.serviceLine` spring 0→1 em W(s3,9). `tipJar.drop` spring 0→1 (damping 10) em W(s3,14)−6. `coins.flow` 0→1 de W(s3,11) a W(s3,15), com partículas semeadas (`random("coin-i")`). `tipJar.fill` 0→0,4. `kitchen.dim` 0,35→0. | ✔ POTE ÚNICO (positive, de W(s3,14) a W(s3,16)−2) → ℹ TAXA DE SERVIÇO, com a legenda "gorjeta cobrada na conta" (info, de W(s3,18) até end−6). Destaques: CONTA, POTE, TAXA, SERVIÇO. |
| 00:23:00 – 00:31:00 | 690 – 930 | Por que dez por cento? Não é número da lei, é costume. A casa pode cobrar outro, desde que avise. | Close na conta (`orbit([0.4,1.25,-0.5], 5.5, 6°, 10°)`). O "10%" gira como contador. Em "costume", a câmera recua e mostra um cardápio de parede com um aviso. Deriva lenta. | Conta (`bill`) com o contador de percentual (`percentDial`). Placa de aviso na parede (`noticeBoard`) com o texto "TAXA DE SERVIÇO: X%". | `percentDial.value` interpolate 10→12→10 (inOut) de W(s4,14) a W(s4,16)+18, só para mostrar que o valor pode variar. `law.stamp` 0→1 em W(s4,7) (carimbo "LEI?" que aparece e some em ~20 f). `noticeBoard.reveal` spring 0→1 em W(s4,17). | ❓ POR QUE 10%? (warning, de W(s4,0) a W(s4,5)) → ℹ É COSTUME (info, de W(s4,10) a W(s4,17)) → ✔ PRECISA AVISAR (positive, de W(s4,18) até end−6). Destaques: DEZ, COSTUME, AVISE. |
| 00:31:00 – 00:38:00 | 930 – 1140 | Mas esse dinheiro entra no caixa, junto com o da comida. O dono pode ficar com ele? | Câmera no caixa: `orbit([0.4,1.1,-0.8], 8, −8°, 12°)`. Moedas do pote e cédulas do consumo caem na mesma gaveta, que se fecha. Em "dono", o personagem dono aparece atrás do balcão, e a câmera faz dolly-in até ele (d=6). | Caixa registradora (`register`) com a gaveta, o dono de avental escuro (`owner`), moedas da taxa (douradas) e cédulas do consumo (verdes) se misturando. | `register.mix` interpolate 0→1 de W(s5,3) a W(s5,10), com as moedas do pote passando para a gaveta. `register.drawer` 0→1→0 (abre/fecha). `owner.enter` spring 0→1 (damping 11) em W(s5,12). `owner.reach` 0→1 de W(s5,14) a W(s5,16)+8, com a mão indo na direção da gaveta. | ✖ DINHEIRO MISTURADO (negative, de W(s5,5) a W(s5,11)) → ❓ É DO DONO? (warning, de W(s5,12) até end−4). Destaques: CAIXA, COMIDA, DONO. |
| 00:38:00 – 00:45:00 | 1140 – 1350 | Não. Pela lei, a gorjeta é dos funcionários. Por isso, a taxa aparece separada na conta. | Em "Não", a mão do dono para e a câmera dá um leve tranco (shake de ~2 frames). O caixa se divide em duas gavetas, CASA e GORJETA, e as moedas douradas migram para a gaveta da gorjeta. Em "separada na conta", corta para o close da conta com a linha SERVIÇO destacada. | Duas gavetas: `register.house` e `register.tip`. Conta (`bill`) com a linha SERVIÇO separada por um traço. Ícone de balança da lei (`lawIcon`) flutuando acima do caixa. | `owner.reach` 1→0 spring em W(s6,0). `register.split` interpolate 0→1 (out) de W(s6,4) a W(s6,7)+6. `coins.sort` 0→1 de W(s6,5) a W(s6,8)+10 (as moedas douradas vão para GORJETA). `lawIcon.pop` spring em W(s6,1). `bill.serviceGlow` 0→1 em W(s6,12). | ✔ GORJETA É DOS FUNCIONÁRIOS (positive, de W(s6,4) a W(s6,11)) → ✔ SEPARADA NA CONTA (positive, de W(s6,12) até end−6). Destaques: LEI, GORJETA, FUNCIONÁRIOS, SEPARADA. |
| 00:45:00 – 00:51:00 | 1350 – 1530 | Só que dividir não é simples. Garçom, cozinheiro, ajudante... quem leva quanto? | Câmera sobe para uma vista de cima, inclinada, sobre o salão e a cozinha (`orbit([0.4,0.4,0.6], 16, 10°, 40°)`). Cada funcionário recebe um holofote no momento em que é nomeado. Em "quem leva quanto?", aparecem pilhas de moedas com pontos de interrogação. | Garçom, cozinheira e ajudante com holofote (`spotlight`). Pilha de moedas da gorjeta (`tipStack`) no centro do piso, sem divisão. | `spot.waiter`, `spot.cook` e `spot.dishwasher`: spring 0→1 em W(s7,6), W(s7,7) e W(s7,8). `tipStack.wobble` pulso (seno do frame) a partir de W(s7,9). `questionMarks` spring em W(s7,10). | ❓ QUEM LEVA QUANTO? (warning, `icon:"?"`, de W(s7,9) até end−4). Destaques: DIVIDIR, GARÇOM, COZINHEIRO, AJUDANTE. |
| 00:51:00 – 00:59:00 | 1530 – 1770 | As regras são combinadas com os trabalhadores, em acordo com o sindicato. Essa divisão se chama rateio. | Mesma vista de cima com dolly-in suave. Uma prancheta com a lista de regras desce sobre o centro. Em "sindicato", um aperto de mão estilizado. Em "rateio", a pilha vira um disco no chão, cortado em fatias, e cada fatia escorre como moedas até a função dela. Órbita de 15°. | Prancheta de regras (`rulesBoard`), ícone de aperto de mão (`handshake`), disco de rateio no chão com fatias de tamanhos diferentes e **sem números** (`splitDisc`), trilhas de moedas até cada funcionário. | `rulesBoard.drop` spring 0→1 em W(s8,1). `handshake.pop` spring em W(s8,11). `splitDisc.form` interpolate 0→1 (out) de W(s8,13) a W(s8,16)+10. `splitDisc.slices` 0→1 com atraso de 4 f por fatia. `coins.toStaff` 0→1 de W(s8,16) até end−10. | ℹ ACORDO COLETIVO (info, de W(s8,8) a W(s8,12)) → ✔ RATEIO, com a legenda "critério de divisão" (positive, de W(s8,16) até end−6). Destaques: REGRAS, TRABALHADORES, SINDICATO, RATEIO. |
| 00:59:00 – 01:06:00 | 1770 – 1980 | E tem mais: a gorjeta entra na remuneração, então gera encargos, como INSS e FGTS. | Close num holerite que sai do bolso do garçom (`orbit([-1.0,1.3,0.2], 6, 20°, 8°)`). A linha GORJETA soma ao salário. Em "encargos", duas etiquetas (INSS e FGTS) saem do holerite e puxam algumas moedas para fora. Deriva lenta. | Holerite 3D (`payslip`) com as linhas SALÁRIO e GORJETA. Etiquetas INSS e FGTS (`chargeTags`). Pequeno fluxo de moedas saindo do holerite. | `payslip.rise` spring 0→1 em W(s9,3). `payslip.tipLine` interpolate 0→1 de W(s9,5) a W(s9,7)+6. `chargeTags.pop` spring com atraso de 6 f entre INSS e FGTS, em W(s9,12) e W(s9,14). `coins.leak` 0→1 de W(s9,10) até end−8. | ℹ REMUNERAÇÃO (info, de W(s9,5) a W(s9,9)) → ✖ ENCARGOS (negative, com a legenda "INSS e FGTS", de W(s9,10) até end−4). Destaques: REMUNERAÇÃO, ENCARGOS, INSS, FGTS. |
| 01:06:00 – 01:14:00 | 1980 – 2220 | Por isso, o acordo pode prever que uma parte fique retida pra pagar esses encargos. O resto vai pra equipe. | Volta à vista de cima. Uma fatia **pequena, sem número**, se solta do disco de rateio e vai para um cofre ENCARGOS ao lado do caixa. A câmera acompanha a fatia (tracking) e depois abre (dolly-out, d=18) enquanto as outras fatias seguem para a equipe. | Cofre (`chargeVault`), fatia retida (`splitDisc.retained`), moedas indo para garçom, cozinheira e ajudante, que guardam no bolso (`staff.pocket`). | `splitDisc.retain` interpolate 0→1 (inOut) de W(s10,8) a W(s10,10)+12, com a fatia indo até o cofre. `chargeVault.pop` spring em W(s10,10). `chargeVault.lock` 0→1 em W(s10,14). `coins.toStaff` 0→1 (re-run) de W(s10,15) até end−12. `staff.pocket` spring escalonado de 5 f. | ℹ PARTE RETIDA (info, com a legenda "se o acordo prever", de W(s10,8) a W(s10,14)) → ✔ RESTO PRA EQUIPE (positive, de W(s10,15) até end−6). Destaques: ACORDO, RETIDA, ENCARGOS, EQUIPE. |
| 01:14:00 – 01:21:00 | 2220 – 2430 | E você, cliente, é obrigado a pagar? Não: a taxa é opcional, e você pode pedir pra tirar. | Volta à mesa: `orbit([-1.8,1.2,0.9], 7, 30°, 8°)`, de frente para o cliente com a conta. Em "opcional", aparece um interruptor na linha SERVIÇO. Em "tirar", o cliente toca o interruptor, a linha SERVIÇO fica riscada e o total diminui. A câmera fica na conta (d=5). | Cliente (`customer`), conta (`bill`) com um interruptor na linha SERVIÇO (`bill.toggle`) e o total animado (`bill.total`). | `customer.lookUp` spring em W(s11,1). `bill.toggle` interpolate 0→1 de W(s11,11) a W(s11,11)+10 (aparece). `bill.serviceOff` 0→1 de W(s11,17) a W(s11,17)+10 (risca a linha). `bill.total` 110→100 (interpolate, out) no mesmo intervalo. Os valores mostrados são **ilustrativos** (R$ 100 + R$ 10). | ❓ SOU OBRIGADO? (warning, de W(s11,1) a W(s11,7)) → ✔ OPCIONAL (positive, com a legenda "o restaurante deve informar", de W(s11,7) até end−6). Destaques: CLIENTE, OBRIGADO, OPCIONAL, TIRAR. |
| 01:21:00 – 01:30:00 | 2430 – 2700 | Mas, quando paga, ela chega no salão e na cozinha. Pronto: agora você sabe pra onde vão os dez por cento! | O interruptor volta para "ligado" (o cliente decide pagar). Dolly-out até o diorama completo (`orbit([0.3,1.0,0], 28, 30°→40°, 24°)`) com o fluxo inteiro rodando: conta → gaveta GORJETA → disco de rateio → equipe, mais a fatia indo ao cofre. Em "Pronto", rótulos 3D em cada etapa. Fade para o âmbar nos últimos ~20 frames. | Diorama completo e todos os objetos persistentes. Rótulos ancorados em 3D: CONTA, GORJETA, RATEIO, ENCARGOS, EQUIPE. | `bill.serviceOff` 1→0 spring em W(s12,2). `coins.loop` 0→1 (fluxo contínuo, partículas semeadas) a partir de W(s12,3). `staff.glow` em W(s12,6) (salão) e W(s12,9) (cozinha). `final.labels` spring escalonado de 5 f a partir de W(s12,10). `fade` 0→1 de end−20 a end. | ℹ TAXA DE SERVIÇO, com a legenda "pra onde vão os 10%" (info, `size:"large"`, de W(s12,10) até end). Destaques: SALÃO, COZINHA, PRONTO, DEZ. |

**Soma:** 7 + 7 + 9 + 8 + 7 + 7 + 6 + 8 + 7 + 8 + 7 + 9 = **90 s = 2700 frames**. As cenas são contíguas
e começam no frame 0.

## 3. Estrutura de dados (State / Props) para o Remotion

O contrato completo, com tipos e as 12 cenas, está em [`scene-plan.ts`](./scene-plan.ts). Ele usa
exatamente os tipos `VideoConfig` e `ScenePlan` do template, então na Fase 2 vira
`src/data/scenes.ts` sem tradução. Os parâmetros de `utils/timing.ts` estão no topo desse arquivo:
`SECONDS = 90`, `VO_KEYS` de s1 a s12, `PLANNED_SECONDS` e `GAPS`.

- **Linha do tempo determinística.** Tudo é calculado a partir do frame atual (`useCurrentFrame`), sem
  timers, sem `Date.now`, sem estado incremental e sem `Math.random`. As moedas usam `random(seed)` do
  Remotion. Dentro de cada `Sequence`, os componentes trabalham com frames locais.
- **3D real:** `@remotion/three` com Three.js / React Three Fiber, materiais foscos com `flatShading` e
  câmera em perspectiva com FOV de ~24°. O mundo persistente fica em `components/World.tsx`, e cada
  objeto lê seu estado com `track("alvo.prop", frameGlobal)`.
- **2D por cima:** badges, legendas palavra a palavra e rótulos ancorados em pontos 3D, todos em
  componentes do template. Não é 2.5D.
- **Valores em dinheiro:** só os da conta da cena 11, marcados como ilustrativos. O disco de rateio e a
  fatia retida não mostram percentuais.

## 4. Áudio e montagem

**Narração integral** (idêntica à tabela; 211 palavras):

> Você adorou o atendimento e quer agradecer. Parece que basta deixar uma nota na mesa pro garçom. Só que
> o garçom não fez seu prato. Na cozinha, mais gente trabalhou, e não viu nada. Por isso, muitos
> restaurantes põem um valor extra na conta, que vai pra um pote só. É a taxa de serviço. Por que dez por
> cento? Não é número da lei, é costume. A casa pode cobrar outro, desde que avise. Mas esse dinheiro
> entra no caixa, junto com o da comida. O dono pode ficar com ele? Não. Pela lei, a gorjeta é dos
> funcionários. Por isso, a taxa aparece separada na conta. Só que dividir não é simples. Garçom,
> cozinheiro, ajudante... quem leva quanto? As regras são combinadas com os trabalhadores, em acordo com o
> sindicato. Essa divisão se chama rateio. E tem mais: a gorjeta entra na remuneração, então gera
> encargos, como INSS e FGTS. Por isso, o acordo pode prever que uma parte fique retida pra pagar esses
> encargos. O resto vai pra equipe. E você, cliente, é obrigado a pagar? Não: a taxa é opcional, e você
> pode pedir pra tirar. Mas, quando paga, ela chega no salão e na cozinha. Pronto: agora você sabe pra
> onde vão os dez por cento!

- **Duração estimada:** 211 palavras a ~155 palavras/min dão ~81,7 s de fala. Somando 0,45 s de abertura,
  11 pausas de 0,55 s e 0,4 s de respiro final, o total fica em ~88,6 s, dentro dos 90 s.
- **Ajuste depois do TTS:** os cortes passam a ser derivados da voz real em `utils/timing.ts`. Cada fala
  começa 0,25 s depois do corte da sua cena. Se a fala passar de ~88 s, primeiro encurto o texto (e peço
  sua aprovação para isso), em vez de acelerar a voz além de +10%.
- **Intenção da voz:** curiosa e próxima, com um leve sorriso; pausas curtas antes de "Não." (cenas 6
  e 11) e de "Pronto".
- **Efeitos** (sintetizados com `scripts/sfx.py`, sem direitos de terceiros): whoosh suave na abertura;
  "pop" na entrada de cada badge; tilintar de moedas em `coins.flow`, `coins.sort` e `coins.toStaff`;
  "ka-ching" na gaveta (cena 5); clique do interruptor (cenas 11 e 12); "clunk" no cofre (cena 10).
- **Trilha** (`scripts/music.py`): lo-fi leve, de bistrô, que abaixa ~10 dB sob a voz e sobe só no final.
- **Mixagem:** normalizada para −14 LUFS / −1,5 dBTP.
- **Legendas:** palavra por palavra, com tempos finais vindos do alinhamento com o áudio real. Antes
  disso, os blocos são provisórios.

## 5. Rigor do conteúdo e fontes consultadas

- **De quem é a gorjeta.** A Lei 13.419/2017 ("Lei da Gorjeta") colocou no art. 457 da CLT que a gorjeta
  inclui tanto o valor dado espontaneamente pelo cliente quanto o valor cobrado pela empresa como
  serviço, e que ele se destina à distribuição entre os empregados. A lei também prevê critérios de
  rateio definidos em convenção ou acordo coletivo (ou em assembleia dos trabalhadores), lançamento na
  nota de consumo e retenção de parte para encargos.
  Fontes: [texto da lei no Senado](https://legis.senado.leg.br/norma/17653295/publicacao/17653304) e
  [notícia da Agência Senado](https://www12.senado.leg.br/noticias/materias/2017/03/14/lei-sancionada-regulamenta-rateio-de-gorjeta-e-taxa-de-servico).
- **Ponto de atenção jurídico.** A reforma trabalhista (Lei 13.467/2017) reescreveu o § 4º do art. 457
  (onde estava "não constitui receita própria dos empregadores"). A MP 808/2017, que tentou reorganizar o
  tema, caducou em 2018, e as fontes divergem sobre quais parágrafos da Lei da Gorjeta continuam
  valendo. Por isso o roteiro **não cita percentuais de retenção** (a lei original falava em até 20% ou
  33%), nem número de parágrafo, nem a multa. A retenção aparece como "o acordo pode prever".
  Fontes: [análise sobre a MP 808 (Migalhas)](https://www.migalhas.com.br/depeso/272792/mp-traz-mudancas-sobre-gorjeta),
  [art. 457 consolidado (LegJur)](https://www.legjur.com/legislacao/art/DCL_00054521943-457) e
  [trabalhista.blog](https://trabalhista.blog/tag/gorjetas/).
  Recomendação: um advogado trabalhista deve revisar as cenas 6, 8 e 10 antes da publicação.
- **Pagar é opcional para o cliente.** Procons e o Idec tratam a taxa como opcional. O restaurante deve
  informar o valor com clareza e não pode constranger quem recusa.
  Fontes: [Idec, "11 direitos em bares e restaurantes"](https://idec.org.br/idec-na-imprensa/11-direitos-que-voce-tem-em-restaurantes-e-bares-e-talvez-nao-saiba),
  [Procon-ES](https://www.es.gov.br/Noticia/procon-es-alerta-quanto-as-armadilhas-de-verao-2-2) e
  [Correio 24 Horas](https://www.correio24horas.com.br/minha-bahia/taxa-de-10-e-obrigatoria-veja-direitos-que-consumidores-tem-em-restaurantes-e-nao-sabem-0326).
- **Os 10% não estão na lei.** A lei não fixa o percentual; 10% é o costume, e há casas que cobram outro
  valor, desde que informado.
- **INSS e FGTS:** a gorjeta integra a remuneração (art. 457, caput, da CLT), por isso sobre ela incidem
  contribuições como INSS e FGTS.
- **Esquemático:** o disco de rateio, as fatias e o cofre são abstrações visuais, sem proporções reais.
  Os valores da conta da cena 11 são ilustrativos.

## 6. Critérios de aceite (conferidos na Fase 1)

- [x] Gancho imediato: a ação de agradecer com uma nota aparece desde o frame 0.
- [x] Cadeia causal: nota → só o garçom recebe → pote → por que 10% → mistura no caixa → é dos
      funcionários → como dividir → rateio → encargos → retenção → é opcional → sistema completo.
- [x] Cada termo técnico (taxa de serviço, rateio, encargos) só aparece depois de o problema ser mostrado.
- [x] Sistema visual persistente: o mesmo restaurante do início ao fim, e tudo o que entra continua
      visível.
- [x] A conclusão mostra o fluxo completo funcionando, com uma recompensa narrativa ("Pronto…").
- [x] Leitura no celular: badges a partir de ~262 px, legenda centrada em ~1418 px e margens seguras.
- [x] Tabela completa, com 12 linhas e 7 colunas, frames contíguos e soma de 2700.
- [x] Narração de 211 palavras, compatível com 90 s (~155 palavras/min mais as pausas).
- [x] `scene-plan.ts` com as mesmas 12 cenas, as mesmas falas e os mesmos tempos da tabela.
- [x] Nenhum asset dado como existente: todos os `audioCues` estão como `planned`.
- [ ] **Ainda não feito:** nenhum render, build, TTS, audição ou validação visual. Isso fica para a Fase 2.

## 7. Ajustes técnicos da Fase 2 (sem mudança de conteúdo)

- **Voz:** o edge-tts não funciona neste ambiente (a rede bloqueia WebSocket). Em seu lugar usei o
  **Piper** (`pt_BR-faber-medium`), que é gratuito, roda offline e tem licença aberta. O Piper não
  devolve o tempo de cada palavra, então os tempos vieram de um alinhamento com faster-whisper: as
  211 palavras do roteiro foram casadas com o áudio. A fala medida soma 77,0 s (~164 palavras/min).
- **Cortes realinhados à voz:** as pausas entre as falas são de 0,9 s. Duração de cada cena (s):
  7,07 · 6,43 · 7,67 · 7,90 · 6,37 · 7,83 · 6,03 · 7,70 · 7,43 · 7,60 · 7,73 · 10,23, somando
  exatamente 90 s (2700 frames).
- **Cenário:** o meio-muro da cozinha ficou com 1 m de altura (balcão de passagem), para não tapar a
  câmera. O pote e o caixa trocaram de lado no balcão. A conta flutua à esquerda do balcão. A placa de
  aviso foi para a parede da esquerda. O holerite fica ao lado do garçom, com as etiquetas INSS e FGTS
  embaixo. O cofre de encargos fica entre o balcão e o disco do rateio.
- **Câmera:** os planos do balcão (cenas 3 a 6) ficaram mais altos (18–26°) e o garçom sai de quadro
  nessas cenas (trilha `waiter.walk`), voltando na cena 7. A vista de cima das cenas 7, 8 e 10 passou
  a olhar ao longo do eixo salão → cozinha (azimute −90°), para caber o garçom, a cozinheira e o
  ajudante no quadro vertical.
- **Conta:** some nas cenas 7 e 8 (vista de cima) e volta na cena 11, quando vai até a mesa do cliente
  (trilha `bill.atTable`). Na conta, o total é calculado a partir do percentual e do interruptor.
- **Fonte:** Montserrat (OFL), servida localmente de `public/fonts/`.
