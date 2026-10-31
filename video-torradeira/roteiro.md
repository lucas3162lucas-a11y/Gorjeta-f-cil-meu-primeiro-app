# Roteiro — Como funciona a torradeira?

> **Versão:** v1 (Fase 1), 31/10/2026. **Origem:** roteiro escrito pelo agente, a pedido do usuário
> ("faça outro vídeo"). O tema foi escolhido pelo agente, sem envolver dinheiro.
> **Situação:** APROVADO ("Pode", 31/10/2026). Fase 2 executada; ajustes técnicos na seção 7. Texto e
> ordem das cenas não mudaram.
>
> **Convenção:** MM:SS:FF a 30 fps; frames em [início, fim). Os tempos são estimativas: depois da voz
> real, os cortes seguem a narração.

## 1. Briefing de produção

- **Tema:** a torradeira elétrica comum de duas fendas. A eletricidade esquenta resistências de
  níquel-cromo dos dois lados do pão. Um controle de tempo define o ponto. Um eletroímã segura a
  alavanca enquanto torra e, quando a corrente desliga, uma mola empurra o pão para cima. Embaixo fica
  uma bandeja de migalhas.
- **Personagem:** o garçom do canal "Explica Aí", servindo o café da manhã.
- **Formato:** 90 s, 1080 × 1920, 30 fps, em português do Brasil, para **YouTube Shorts**.
- **Voz:** a ElevenLabs é a preferência do usuário, mas a conta gratuita está bloqueada (veja o
  vídeo do fogão). Enquanto não houver plano pago, a voz é a do canal: Piper `pt_BR-faber-medium`,
  gratuita. Se o usuário assinar antes da geração, troca para ElevenLabs "Marcos Alves".
- **Arte:** low-poly do canal. A torradeira aparece **em corte**, mostrando as resistências (fios em
  zigue-zague que vão do cinza ao vermelho brilhante), a corrente (partículas amarelas), o calor (ondas
  laranja), a alavanca, o eletroímã, a mola e a bandeja. O pão vai do bege ao dourado.
- **Sem tremedeira:** só órbitas e dollies suaves; nada pisca quadro a quadro. A estabilidade será
  medida no MP4.

## 2. Tabela cronológica

| Timestamp (Início - Fim) | Quadro (Frame Inicial - Final a 30 fps) | Narração (Locução TTS) | Descrição da Cena & Câmera | Props & Elementos 3D/2D | Animações & Transições (Remotion Props / Spring / Interpolate) | Badges & Textos (Highlights) |
| --- | --- | --- | --- | --- | --- | --- |
| 00:00:00 – 00:07:00 | 0 – 210 | Você quer servir um pão torradinho no café da manhã. Parece que basta colocar numa frigideira bem quente. | Abre na cozinha (`orbit([-0.4,1.0,-0.4], 12, 20°, 16°)`) e faz dolly-in até o fogão com a frigideira (d=4). O garçom põe duas fatias na frigideira, que esquenta. | Cozinha, garçom, fogão, frigideira, fatias de pão. | `kitchen.reveal` spring. `bread.toPan` 0→1. `pan.heat` spring. | ❓ COMO TORRAR O PÃO? Destaques: PÃO, TORRADINHO, FRIGIDEIRA. |
| 00:07:00 – 00:14:00 | 210 – 420 | Só que a frigideira esquenta um lado de cada vez. Um lado queima e o outro fica branco. | Close na frigideira (d=2,2): a face de baixo do pão escurece; em "queima", a fatia vira e mostra um lado queimado e o outro branco. | Fatias de pão. | `bread.burnBottom` 0→1. `bread.flip` spring. | ✖ UM LADO DE CADA VEZ → ✖ QUEIMA E FICA BRANCO. Destaques: LADO, QUEIMA, BRANCO. |
| 00:14:00 – 00:21:00 | 420 – 630 | A torradeira resolve com fios que esquentam quando a eletricidade passa por eles. São as resistências. | A câmera vai até a torradeira no balcão (d=2,6), que aparece em corte. A corrente (partículas amarelas) percorre os fios em zigue-zague, que vão de cinza para laranja. A câmera desce para dentro das fendas (d=1,5). | Torradeira em corte, resistências, partículas de corrente. | `toaster.rise` spring. `toaster.cut` 0→1. `current.flow` 0→1. `wires.heat` 0→1. | ℹ ELETRICIDADE VIRA CALOR → ✔ RESISTÊNCIAS, com a legenda "fios que esquentam". Destaques: FIOS, ESQUENTAM, ELETRICIDADE, RESISTÊNCIAS. |
| 00:21:00 – 00:27:00 | 630 – 810 | Mas fio comum, nesse calor, ia derreter ou se desgastar rapidinho. | Close (d=1,0) num fio comum de cobre ao lado (**esquemático**), que fica vermelho, entorta e pinga. | Fio comum derretendo. | `badWire.pop` spring. `badWire.melt` 0→1. | ✖ FIO COMUM DERRETE, com a legenda "esquemático". Destaques: COMUM, DERRETER, DESGASTAR. |
| 00:27:00 – 00:35:00 | 810 – 1050 | Por isso elas são de uma liga especial de níquel e cromo, que aguenta ficar vermelha de quente sem estragar. | O fio comum some. Órbita de 20° em volta da resistência, que fica vermelho-brilhante e firme. | Resistências brilhando. | `badWire.out` 0→1. `wires.glow` 0→1. | ✔ NÍQUEL-CROMO, com a legenda "aguenta ficar vermelho". Destaques: LIGA, NÍQUEL, CROMO, VERMELHA. |
| 00:35:00 – 00:43:00 | 1050 – 1290 | E tem fio dos dois lados do pão. Assim as duas faces torram juntas, por igual. | Dolly-out até as fendas vistas de cima (d=1,6, elevação 26°): as fatias descem entre as resistências e ondas de calor saem dos dois lados. O pão doura por igual. | Fatias nas fendas, ondas de calor dos dois lados. | `bread.drop` spring. `heat.both` 0→1. `bread.toast` 0→0,6. | ✔ DOIS LADOS AO MESMO TEMPO. Destaques: DOIS, LADOS, JUNTAS, IGUAL. |
| 00:43:00 – 00:49:00 | 1290 – 1470 | Mas e o ponto? Como saber a hora de parar antes de virar carvão? | Órbita; o pão escurece demais e sai uma fumacinha (**esquemático**). | Pão escurecendo, fumaça. | `bread.toast` →1. `smoke.on` 0→1. | ❓ E O PONTO? → ✖ VIRA CARVÃO. Destaques: PONTO, PARAR, CARVÃO. |
| 00:49:00 – 00:57:00 | 1470 – 1710 | O botão regula um controle de tempo. Quanto mais alto, mais tempo a resistência fica ligada. | Volta o pão "dourado" (de novo, sem fumaça). Close no botão lateral (d=1,3): uma barra de tempo aparece ao lado e cresce quando o botão gira para "alto". | Botão de tempo, barra de tempo (sem números). | `smoke.on` →0. `bread.toast` →0,35. `knob.highlight`. `timer.show`. `knob.turn` 0→1. | ✔ CONTROLE DE TEMPO → ℹ MAIS ALTO, MAIS TEMPO. Destaques: BOTÃO, TEMPO, ALTO, LIGADA. |
| 00:57:00 – 01:03:00 | 1710 – 1890 | Enquanto torra, um ímã elétrico segura a alavanca lá embaixo. | Órbita para o lado da alavanca (azimute 60°). A alavanca desce e o eletroímã (bobina com brilho azul) a segura. | Alavanca, eletroímã. | `lever.down` 0→1. `magnet.on` spring. | ✔ ÍMÃ ELÉTRICO, com a legenda "segura a alavanca". Destaques: ÍMÃ, ELÉTRICO, SEGURA, ALAVANCA. |
| 01:03:00 – 01:11:00 | 1890 – 2130 | Quando o tempo acaba, a corrente desliga, o ímã solta e uma mola joga o pão pra cima. | A barra de tempo esvazia; as partículas de corrente param; os fios esfriam; o ímã apaga; a mola estica e as fatias sobem (spring com leve overshoot). Dolly-out (d=2,4). | Barra de tempo, mola, fatias. | `timer.run` 0→1. `current.flow` →0. `wires.heat` →0,15. `magnet.on` →0. `bread.pop` spring. `lever.down` →0. | ℹ A CORRENTE DESLIGA → ✔ A MOLA JOGA O PÃO. Destaques: TEMPO, DESLIGA, SOLTA, MOLA. |
| 01:11:00 – 01:20:00 | 2130 – 2400 | E as migalhas que caem? Ficam numa bandejinha embaixo, que sai pra limpar, sempre com a torradeira desligada da tomada. | Migalhas caem até o fundo; close na base (d=1,6, elevação 4°): a bandeja desliza para fora; um ícone de tomada desligada aparece. | Migalhas, bandeja, ícone de tomada. | `crumbs.fall` 0→1. `tray.out` 0→1. `unplug.pop` spring. | ✔ BANDEJA DE MIGALHAS → ⚠ LIMPE DESLIGADA DA TOMADA. Destaques: MIGALHAS, BANDEJINHA, LIMPAR, DESLIGADA. |
| 01:20:00 – 01:30:00 | 2400 – 2700 | Pronto: eletricidade vira calor, o tempo controla o ponto e a mola faz o resto. E a torrada sai no ponto! | Rótulos 3D (RESISTÊNCIAS, BOTÃO DE TEMPO, ÍMÃ ELÉTRICO, MOLA); depois a câmera abre para a cozinha e o garçom serve as torradas douradas; fade final. | Rótulos, prato com torradas. | `tray.out` →0. `final.labels` 0→1 e →0. `waiter.serve` spring. `fade`. | ℹ TORRADEIRA, com a legenda "eletricidade vira calor" (large). Destaques: ELETRICIDADE, CALOR, TEMPO, MOLA, PONTO. |

**Soma:** 7 + 7 + 7 + 6 + 8 + 8 + 6 + 8 + 6 + 8 + 9 + 10 = **90 s = 2700 frames**. As cenas são
contíguas.

## 3. Estrutura de dados

As 12 cenas estão em [`scene-plan.ts`](./scene-plan.ts), nos tipos do template: o plano compilou e a
timeline foi validada. Tudo é calculado a partir do frame. Não há tranco de câmera.

## 4. Áudio

**Narração** (198 palavras):

> Você quer servir um pão torradinho no café da manhã. Parece que basta colocar numa frigideira bem
> quente. Só que a frigideira esquenta um lado de cada vez. Um lado queima e o outro fica branco. A
> torradeira resolve com fios que esquentam quando a eletricidade passa por eles. São as resistências.
> Mas fio comum, nesse calor, ia derreter ou se desgastar rapidinho. Por isso elas são de uma liga
> especial de níquel e cromo, que aguenta ficar vermelha de quente sem estragar. E tem fio dos dois
> lados do pão. Assim as duas faces torram juntas, por igual. Mas e o ponto? Como saber a hora de parar
> antes de virar carvão? O botão regula um controle de tempo. Quanto mais alto, mais tempo a
> resistência fica ligada. Enquanto torra, um ímã elétrico segura a alavanca lá embaixo. Quando o tempo
> acaba, a corrente desliga, o ímã solta e uma mola joga o pão pra cima. E as migalhas que caem? Ficam
> numa bandejinha embaixo, que sai pra limpar, sempre com a torradeira desligada da tomada. Pronto:
> eletricidade vira calor, o tempo controla o ponto e a mola faz o resto. E a torrada sai no ponto!

**Efeitos sintetizados:** chiado da frigideira, zumbido elétrico baixo, "tic" do botão, "clunk" da
alavanca, clique de desligar, "boing" da mola e "ding". A trilha lo-fi do canal fica por baixo da voz.

## 5. Rigor do conteúdo

- **Resistências:** a eletricidade esquenta o fio (efeito Joule). Torradeiras usam ligas como
  níquel-cromo, que aguentam altas temperaturas sem oxidar rápido. A cena do "fio comum derretendo" é
  **esquemática**: fios de cobre comuns oxidariam e se deteriorariam nessas temperaturas.
- **Controle de tempo:** pode ser eletrônico ou mecânico, conforme o modelo. O vídeo diz "controle de
  tempo" sem detalhar o tipo.
- **Eletroímã e mola:** é o mecanismo comum das torradeiras pop-up atuais. Modelos antigos usam uma
  trava mecânica.
- **Segurança:** a única orientação prática do vídeo é limpar a bandeja **com a torradeira desligada da
  tomada**. O vídeo não sugere colocar objetos dentro dela.

## 6. Critérios de aceite (Fase 1)

- [x] Gancho imediato; cadeia causal: frigideira falha → resistências → fio comum derrete →
      níquel-cromo → dois lados → ponto → controle de tempo → ímã segura → mola solta → migalhas →
      torrada pronta.
- [x] 12 cenas e 7 colunas; soma de 2700 frames; plano compilado e validado.
- [x] 198 palavras, compatível com 90 s; sem tranco de câmera.
- [ ] **Ainda não feito:** TTS, render e validação visual. Isso fica para a Fase 2.

## 7. Ajustes técnicos da Fase 2 (sem mudança de conteúdo)

- **Voz:** Piper `pt_BR-faber-medium` (a ElevenLabs continua bloqueada na conta gratuita). Fala de
  72,7 s, com as 198 palavras casadas com o áudio. Pausas de 1,4 s entre as falas.
- **Resistências:** desenhadas como serpentina horizontal (fios correndo ao longo da fenda). O
  zigue-zague vertical parecia uma grade de barras.
- **Garçom:** fica à esquerda do fogão, para não tampar o close da frigideira na cena 2.
- **Rótulos finais:** reposicionados para caber no quadro.
