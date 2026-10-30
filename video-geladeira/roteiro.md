# Roteiro — Como a geladeira gela?

> **Versão:** v1 (Fase 1), 30/10/2026. **Origem:** roteiro escrito pelo agente. O usuário pediu
> "outro vídeo assim", sobre algo que não envolva dinheiro e sem a tremedeira do vídeo anterior.
> **Situação:** AGUARDANDO APROVAÇÃO. A implementação e a renderização ainda não começaram.
>
> **Convenção:** timestamps em MM:SS:FF a 30 fps (FF de 00 a 29). Frames em intervalo semiaberto
> [início, fim). Os tempos são estimativas; depois da narração real, os cortes passam a seguir a voz.

## 1. Briefing de produção

- **Tema e recorte:** o ciclo de refrigeração por compressão de vapor de uma **geladeira doméstica
  comum**: evaporador, compressor, condensador, tubo capilar e termostato. O vídeo não cita nenhum
  gás específico e não mostra modelos sem compressor (por exemplo, as termoelétricas).
- **Personagem principal:** o **garçom do canal "Explica Aí"** (o mesmo modelo 3D do vídeo anterior
  e da foto de perfil). Ele quer servir um suco gelado e acompanha a geladeira se montando à sua frente.
- **Público e objetivo:** público leigo. Ao final, a pessoa deve entender que a geladeira **não cria
  frio**: ela tira o calor de dentro e joga para fora, num ciclo.
- **Formato:** 90 s, 1080 × 1920 (9:16), 30 fps (2700 frames), em português do Brasil. O tom é
  didático, informal e ágil.
- **Voz:** a mesma do vídeo anterior: Piper `pt_BR-faber-medium`, gratuita e offline, com tempos por
  palavra obtidos por alinhamento (faster-whisper). Assim o canal mantém a mesma voz.
- **Direção de arte:** diorama low-poly de um **canto de cozinha de restaurante**: piso de ladrilho,
  parede e balcão. No centro fica uma **geladeira com a carcaça translúcida** ("raio X"), que deixa ver
  o circuito de tubos. Cores do fluido: **azul-claro** = frio e baixa pressão; **vermelho/laranja** =
  quente e alta pressão. Pontinhos **laranja** representam calor saindo da comida; **ondas vermelhas**
  representam calor indo para o ar. Fundo em degradê azul-gelo → creme.
  Cores de significado: problema em vermelho com ✖, solução em verde com ✔, termo em azul com i,
  pergunta em amarelo com ?.
- **Sem tremedeira:** nenhuma cena usa "tranco" de câmera. Os movimentos são só órbitas e dollies
  suaves, mais uma deriva lenta (abaixo de 1° por segundo). A Fase 2 vai **medir** isso no MP4 final,
  comparando a diferença entre frames seguidos ao longo do vídeo todo.
- **Sistema construído diante do espectador:** caixa fechada (falha) → tubo com refrigerante
  (evaporador) → compressor → condensador → tubo capilar → termostato → ciclo completo em loop.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer servir um suco gelado. Parece que basta guardar numa caixa bem fechada. | Abre no balcão com o garçom segurando a jarra (`orbit([-1.4,1.1,0.2], 9, 22°, 14°)`) e faz push-in até d=6. Em "caixa", o garçom coloca a jarra dentro de uma caixa sobre o balcão e a tampa fecha. | Cozinha (`kitchen`), balcão (`counter`), garçom (`waiter`), jarra de suco (`juice`), caixa com tampa (`box`). | `kitchen.reveal` spring 0→1 nos frames −8 a 30 (damping 12). `juice.inBox` interpolate 0→1 (inOut) de W(s1,9) a W(s1,11)+10. `box.lid` spring 0→1 em W(s1,13). | ❓ COMO GELAR O SUCO? (warning, `icon:"?"`, de W(s1,2) até end−6). Destaques: SUCO, GELADO, CAIXA. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que caixa fechada não esfria nada. Ela só guarda, e o calor do suco continua lá dentro. | Dolly-in na caixa em corte (`orbit([-1.4,1.1,-0.3], 4.5, 12°, 10°)`): a parede da frente fica translúcida e mostra a jarra lá dentro, com pontinhos laranja de calor girando sem sair. Termômetro ao lado. | Caixa em corte (`box.xray`), partículas de calor (`heat`), termômetro 3D sem números (`thermo`). | `box.xray` 0→1 de W(s2,2) a W(s2,4)+8. `heat.inside` 0→1 em W(s2,12) (pontos orbitando a jarra). `thermo.level` fica em 0,85 (quente), com um leve pulso. | ✖ CAIXA NÃO ESFRIA (negative, de W(s2,4) até end−6). Destaques: NÃO, ESFRIA, CALOR. |
| 00:14:00 – 00:22:00 | 420 – 660 | Pra esfriar, é preciso tirar calor. E um líquido que evapora faz isso: ele rouba calor do que está em volta. | Close na jarra (`orbit([-1.4,1.2,-0.2], 4, 18°, 10°)`). Uma gota de líquido no copo ao lado evapora em fumacinha azul, que "puxa" os pontinhos laranja para longe; o copo ganha gelo na borda. Leve órbita de 14°. | Copo com gota (`demoCup`), vapor (`vapor`), partículas de calor sendo puxadas (`heat`), gelo na borda (`frost`). | `heat.out` 0→1 de W(s3,4) a W(s3,5)+12 (setas laranja saindo). `vapor.rise` 0→1 de W(s3,10) a W(s3,15). `heat.toVapor` 0→1 de W(s3,14) a W(s3,20). `frost.cup` 0→1 de W(s3,15) a end−10. | ℹ ESFRIAR = TIRAR CALOR (info, de W(s3,4) a W(s3,9)) → ✔ EVAPORAR ROUBA CALOR (positive, de W(s3,10) até end−6). Destaques: TIRAR, CALOR, EVAPORA, ROUBA. |
| 00:22:00 – 00:31:00 | 660 – 930 | Por isso, a geladeira tem um tubo com fluido refrigerante. Ele evapora lá dentro e puxa o calor. É o evaporador. | A caixa some e a geladeira translúcida sobe do chão no centro. A câmera vai do balcão até a frente da geladeira (`orbit([0.4,1.3,-0.55], 8, 8°, 10°)`) e faz dolly-in até o topo interno (`orbit([0.4,1.8,-0.7], 5, 16°, 10°)`), onde a serpentina do evaporador acende em azul. A jarra aparece na prateleira. | Geladeira (`fridge`, carcaça translúcida), serpentina do evaporador (`evaporator`), fluido (`fluid`), jarra na prateleira (`juice`). | `box.vanish` 1→0. `fridge.rise` spring 0→1 (damping 11) de W(s4,2)−6 a W(s4,2)+30. `evaporator.draw` 0→1 (linear) de W(s4,6) a W(s4,9)+10. `fluid.evap` 0→1 em W(s4,11) (bolhas azuis virando gás). `heat.toEvap` 0→1 de W(s4,15) a end−10 (pontinhos laranja da jarra para a serpentina). | ℹ FLUIDO REFRIGERANTE (info, de W(s4,8) a W(s4,18)) → ✔ EVAPORADOR (positive, legenda "rouba o calor de dentro", de W(s4,18) até end−6). Destaques: TUBO, REFRIGERANTE, EVAPORA, EVAPORADOR. |
| 00:31:00 – 00:38:00 | 930 – 1140 | Mas, depois de evaporar, esse gás fica carregado de calor. Se ficar parado ali, o frio acaba. | Mesma serpentina; os pontinhos laranja grudam no gás, que fica cheio e parado. Dolly-out leve (d=5→6,5) mostrando a geladeira por dentro. | Gás saturado na serpentina (`fluid`), ícone de "cheio" (anel laranja na serpentina), termômetro interno subindo (`thermo`). | `fluid.saturate` 0→1 de W(s5,4) a W(s5,9)+8 (cor do gás azul→laranja-claro). `fluid.flow` = 0 (parado). `thermo.level` 0,45→0,7 de W(s5,10) a W(s5,16). | ✖ GÁS CHEIO DE CALOR (negative, de W(s5,5) a W(s5,10)) → ✖ O FRIO ACABA (negative, de W(s5,14) até end−4). Destaques: GÁS, CALOR, PARADO, ACABA. |
| 00:38:00 – 00:45:00 | 1140 – 1350 | Então um motor suga o gás e aperta. Apertado, ele esquenta ainda mais. É o compressor. | A câmera desce pela lateral até a base traseira (`orbit([0.4,0.35,-1.15], 4.5, 68°, 14°)`). O compressor (cilindro preto) acende; o gás desce pelo tubo de sucção e é "espremido": as partículas ficam mais juntas e passam de laranja-claro a vermelho. | Tubo de sucção (`pipeSuction`), compressor (`compressor`), pistão no corte (`compressor.piston`), partículas do fluido (`fluid`). | `compressor.on` spring 0→1 em W(s6,2). `fluid.flow` 0→1 de W(s6,3) a W(s6,3)+12 (o loop começa a andar). `compressor.piston` oscila (seno do frame) quando ligado. `fluid.hot` 0→1 de W(s6,8) a W(s6,12) (cor vermelha na saída). | ✔ COMPRESSOR (positive, legenda "aperta e esquenta o gás", de W(s6,13) até end−6). Destaques: MOTOR, APERTA, ESQUENTA, COMPRESSOR. |
| 00:45:00 – 00:50:00 | 1350 – 1500 | E agora? Esse gás quente precisa jogar o calor fora, longe da comida. | Tracking subindo pelo tubo de descarga até a parte de trás (`orbit([0.4,1.2,-1.1], 7, 75°, 16°)`). Seta vermelha aponta para fora da geladeira, para o ar da cozinha. | Tubo de descarga vermelho (`pipeDischarge`), seta 3D (`heatArrow`). | `pipeDischarge.glow` 0→1 em W(s7,3). `heatArrow` spring 0→1 em W(s7,6). | ❓ ONDE JOGAR O CALOR? (warning, `icon:"?"`, de W(s7,1) até end−4). Destaques: QUENTE, FORA, COMIDA. |
| 00:50:00 – 00:58:00 | 1500 – 1740 | Ele passa por uma grade atrás da geladeira, solta calor pro ar da cozinha e vira líquido. É o condensador. | Mesma vista de trás com dolly-in (d=7→5,5) e órbita de 12°. O gás vermelho percorre a grade em zigue-zague, ondas vermelhas sobem para o ar e o fluido muda de gás vermelho para gotas laranja (líquido). | Grade do condensador (`condenser`), ondas de calor no ar (`heatWaves`), fluido (`fluid`). | `condenser.draw` 0→1 de W(s8,2) a W(s8,4)+10. `heatWaves` 0→1 de W(s8,8) a end−10. `fluid.condense` 0→1 de W(s8,14) a W(s8,16)+12 (partículas viram gotas). | ✔ CONDENSADOR (positive, legenda "solta o calor no ar", de W(s8,17) até end−6). Destaques: GRADE, SOLTA, CALOR, LÍQUIDO, CONDENSADOR. |
| 00:58:00 – 01:05:00 | 1740 – 1950 | Só que esse líquido ainda está quente e apertado. Desse jeito, ele não gela nada. | Close na saída do condensador (`orbit([0.95,0.9,-1.0], 5, 55°, 10°)`). O líquido laranja chega a uma "porta" fechada no tubo, e um termômetro pequeno mostra que ainda está quente. | Fluido (`fluid`), termômetro do fluido (`fluidThermo`), manômetro sem números (`gauge`, ponteiro alto). | `gauge.needle` 0,2→0,9 de W(s9,6) a W(s9,8)+10. `fluidThermo.level` em 0,8 com pulso. | ✖ AINDA QUENTE (negative, de W(s9,6) a W(s9,9)) → ✖ ASSIM NÃO GELA (negative, de W(s9,11) até end−4). Destaques: QUENTE, APERTADO, NÃO, GELA. |
| 01:05:00 – 01:14:00 | 1950 – 2220 | Por isso ele passa por um tubo fininho, o capilar. A pressão cai, e ele sai gelado, pronto pra evaporar de novo. | Dolly-in no tubo capilar enrolado (`orbit([0.95,1.1,-0.95], 4, 50°, 8°)`), que acende. O fluido entra laranja, o ponteiro do manômetro cai e as partículas saem azul-claras, espalhadas. A câmera acompanha o tubo subindo até a entrada do evaporador (`orbit([0.4,1.8,-0.7], 5.5, 30°, 12°)`). | Tubo capilar em espiral (`capillary`), manômetro (`gauge`), fluido (`fluid`). | `capillary.glow` 0→1 em W(s10,6). `gauge.needle` 0,9→0,15 (out) de W(s10,11) a W(s10,12)+10. `fluid.cold` 0→1 de W(s10,12) a W(s10,16) (cor azul após o capilar). | ✔ TUBO CAPILAR (positive, legenda "derruba a pressão", de W(s10,7) a W(s10,15)) → ✔ GELADO DE NOVO (positive, de W(s10,16) até end−6). Destaques: FININHO, CAPILAR, PRESSÃO, GELADO. |
| 01:14:00 – 01:22:00 | 2220 – 2460 | Mas gelar sem parar congelaria até o suco. Por isso, um termostato controla o compressor e segura a temperatura. | Volta à frente da geladeira (`orbit([0.4,1.25,-0.3], 5, 0°, 6°)`). A jarra começa a ganhar cristais de gelo; em "termostato", o botão girante na parede interna acende e o compressor (visível embaixo, pela carcaça) desacelera e para por um instante; os cristais somem. | Termostato (`thermostat`, botão girante + LED), jarra (`juice.ice`), compressor (`compressor`). | `juice.ice` 0→1 de W(s11,2) a W(s11,7) e 1→0 de W(s11,14) a W(s11,17). `thermostat.pop` spring em W(s11,11). `thermostat.knob` 0→1 (giro) de W(s11,12) a W(s11,14). `compressor.on` 1→0,2 de W(s11,13) a W(s11,15)+10 (desacelera). | ❓ CONGELA TUDO? (warning, de W(s11,1) a W(s11,8)) → ✔ TERMOSTATO (positive, legenda "controla o compressor", de W(s11,11) até end−6). Destaques: CONGELARIA, TERMOSTATO, TEMPERATURA. |
| 01:22:00 – 01:30:00 | 2460 – 2700 | Pronto: a geladeira não cria frio. Ela leva o calor de dentro pra fora, sem parar. E o suco fica no ponto! | Dolly-out até o diorama inteiro (`orbit([0.2,1.1,-0.4], 14, 30°→42°, 18°)`) com o ciclo todo rodando: azul dentro, vermelho atrás, ondas de calor saindo. Rótulos 3D nas quatro peças. Em "suco", o garçom tira a jarra gelada (com gotinhas) e sorri; fade nos últimos ~20 frames. | Geladeira completa, garçom servindo (`waiter.serve`), rótulos EVAPORADOR / COMPRESSOR / CONDENSADOR / CAPILAR. | `compressor.on` 0,2→1 em W(s12,1). `fluid.loop` 0→1 a partir de W(s12,6) (fluxo contínuo, partículas semeadas). `heat.toEvap` e `heatWaves` em loop. `final.labels` spring escalonado de 5 f a partir de W(s12,6). `waiter.serve` spring em W(s12,18). `fade` 0→1 de end−20 a end. | ℹ COMO A GELADEIRA GELA, com a legenda "tira o calor de dentro" (info, `size:"large"`, de W(s12,6) até end). Destaques: NÃO, CRIA, FRIO, CALOR, FORA, SUCO. |

**Soma:** 7 + 7 + 8 + 9 + 7 + 7 + 5 + 8 + 7 + 9 + 8 + 8 = **90 s = 2700 frames**. As cenas são contíguas
e começam no frame 0.

## 3. Estrutura de dados (State / Props) para o Remotion

O contrato completo está em [`scene-plan.ts`](./scene-plan.ts), com as 12 cenas nos mesmos tipos
`VideoConfig` / `ScenePlan` do template (vira `src/data/scenes.ts` na Fase 2). Parâmetros de
`utils/timing.ts`: `SECONDS = 90`, `VO_KEYS` de s1 a s12, `PLANNED_SECONDS` e `GAPS`.

- **Linha do tempo determinística.** Tudo é calculado a partir do frame atual, sem timers, sem
  `Date.now`, sem estado acumulado e sem `Math.random` (só `random(seed)`). Os componentes usam frames
  locais dentro de cada `Sequence`.
- **Partículas do fluido:** cada partícula percorre uma curva fechada (o circuito de tubos) com fase
  própria. A posição é `curva(fase + velocidade × frame)`, e a cor é escolhida pelo trecho do circuito.
  É uma função pura do frame.
- **Correção da tremedeira:** toda trilha começa no estado de repouso (`from` igual ao valor "parado").
  A Fase 2 terá uma verificação automática: a diferença média entre frames seguidos do MP4 não pode ter
  picos fora dos cortes de cena.
- **3D real** (`@remotion/three` + React Three Fiber), com câmera em perspectiva (FOV 24°). Badges,
  legendas e rótulos ficam numa camada 2D por cima, como no vídeo anterior.

## 4. Áudio e montagem

**Narração integral** (idêntica à tabela; 218 palavras):

> Você quer servir um suco gelado. Parece que basta guardar numa caixa bem fechada. Só que caixa
> fechada não esfria nada. Ela só guarda, e o calor do suco continua lá dentro. Pra esfriar, é preciso
> tirar calor. E um líquido que evapora faz isso: ele rouba calor do que está em volta. Por isso, a
> geladeira tem um tubo com fluido refrigerante. Ele evapora lá dentro e puxa o calor. É o evaporador.
> Mas, depois de evaporar, esse gás fica carregado de calor. Se ficar parado ali, o frio acaba. Então
> um motor suga o gás e aperta. Apertado, ele esquenta ainda mais. É o compressor. E agora? Esse gás
> quente precisa jogar o calor fora, longe da comida. Ele passa por uma grade atrás da geladeira, solta
> calor pro ar da cozinha e vira líquido. É o condensador. Só que esse líquido ainda está quente e
> apertado. Desse jeito, ele não gela nada. Por isso ele passa por um tubo fininho, o capilar. A pressão
> cai, e ele sai gelado, pronto pra evaporar de novo. Mas gelar sem parar congelaria até o suco. Por
> isso, um termostato controla o compressor e segura a temperatura. Pronto: a geladeira não cria frio.
> Ela leva o calor de dentro pra fora, sem parar. E o suco fica no ponto!

- **Duração estimada:** com a mesma voz e o mesmo ritmo do vídeo anterior (~164 palavras/min), a fala
  dá ~80 s. Somando 0,45 s de abertura, 11 pausas de 0,55 s e 0,4 s de respiro, o total fica em
  ~86,7 s, dentro dos 90 s.
- **Ajuste depois do TTS:** os cortes passam a vir da voz real. Se a fala não couber, primeiro encurto
  o texto, com sua aprovação.
- **Efeitos** (sintetizados por código): whoosh suave na abertura; tampa da caixa ("thud"); "pop" dos
  badges; chiado de evaporação (cena 3/4); zumbido do compressor (cenas 6 e 12, mais baixo na 11); som
  de fluxo nos tubos; clique do termostato.
- **Trilha:** a mesma linha lo-fi do canal, num tom mais "fresco", abaixando sob a voz.
- **Mixagem:** normalizada para −14 LUFS / −1,5 dBTP.

## 5. Rigor do conteúdo e fontes

- **Ciclo por compressão de vapor:** a maioria das geladeiras domésticas funciona assim. O fluido
  circula num circuito fechado, passando por compressor, condensador, tubo capilar e evaporador.
  Fontes: [GREF/USP — Termodinâmica, leitura 21](https://fep.if.usp.br/~profis/arquivo/gref/termo21-4.pdf)
  e [Mercado Livre — como funciona uma geladeira](https://www.mercadolivre.com.br/blog/como-funciona-uma-geladeira).
- **Condensador:** em muitos modelos é a grade preta atrás; em outros fica embaixo ou embutido nas
  laterais. O vídeo mostra a grade atrás como **um dos formatos** (a narração diz "uma grade").
- **Termostato:** nos modelos clássicos ele liga e desliga o compressor; nos modelos com compressor
  inverter, ele muda a velocidade. Por isso a narração diz "controla o compressor".
- **Sem números:** termômetro e manômetro não mostram valores; são indicadores esquemáticos.
- **Sem gás nomeado:** o vídeo não cita qual gás refrigerante é usado, porque isso varia por modelo e
  época.
- **Sem instrução de conserto ou manuseio:** o vídeo explica o funcionamento e não ensina a mexer no
  circuito, que tem gás sob pressão.

## 6. Critérios de aceite (conferidos na Fase 1)

- [x] Gancho imediato: o garçom com o suco aparece desde o frame 0.
- [x] Cadeia causal: caixa falha → tirar calor → evaporar → evaporador → gás saturado → compressor →
      gás quente → condensador → líquido quente → capilar → gelar demais → termostato → ciclo.
- [x] Cada termo técnico (evaporador, compressor, condensador, capilar, termostato) só aparece depois
      de o problema ser mostrado.
- [x] Sistema persistente: a mesma geladeira do começo ao fim, e as peças montadas continuam visíveis.
- [x] A conclusão mostra o ciclo completo rodando, com a recompensa "o suco fica no ponto".
- [x] Tabela com 12 linhas e 7 colunas, frames contíguos e soma de 2700.
- [x] Narração de 218 palavras, compatível com 90 s na voz do canal.
- [x] Nenhum "tranco" de câmera; a tremedeira será medida no MP4 final.
- [x] Nenhum asset dado como existente: todos os `audioCues` estão como `planned`.
- [ ] **Ainda não feito:** nenhum render, TTS ou validação visual. Isso fica para a Fase 2.
