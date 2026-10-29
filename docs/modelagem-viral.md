# Modelagem viral: curiosidades de animais (TikTok / Shorts)

Pesquisa feita em 29/10/2026 nos Shorts públicos do YouTube. O TikTok não mostra métricas públicas confiáveis, e os formatos de Shorts e TikTok se repetem entre as duas plataformas. Foram analisados 332 Shorts de 7 buscas ("você sabia curiosidades", "fatos curiosos", "curiosidades sobre animais" etc.). Os 85 com mais de 200 mil views foram medidos um por um: views, inscritos do canal e data.

**Razão de outlier** = views do vídeo ÷ inscritos do canal. Acima de 3, o vídeo foi muito além do público do próprio canal, ou seja, o **formato** é que fez o vídeo viralizar, e não o tamanho do canal.

## Outliers encontrados

| # | Vídeo | Canal (inscritos) | Views | Razão | Views/dia | Duração |
|---|---|---|---|---|---|---|
| 1 | [Porque você não pode tirar cracas de uma baleia 😱](https://youtube.com/shorts/ah-wcgfm7xc) | Corion (10,1 mil) | 5,76 mi | **570x** | 140 mil | 24 s |
| 2 | [Animais do Brasil vs animais do Canadá](https://youtube.com/shorts/Q_VVNqXYUcI) | mers short (5,7 mil) | 1,24 mi | **216x** | 412 mil | 22 s |
| 3 | [O segredo escondido na língua dos gatos 👅🐱](https://youtube.com/shorts/kvJam3rSfz8) | Jaqueline Gonçalves (100 mil) | 9,18 mi | **92x** | 224 mil | 13 s |
| 4 | [Porque eles dormem na madeira!? 🤔](https://youtube.com/shorts/ANfYAolYBMM) | Scientific (76,8 mil) | 6,81 mi | 89x | 13 mil | 26 s |
| 5 | [Esses animais parecem falsos… mas são reais!](https://youtube.com/shorts/5DU_TlgfOBE) | Entre Mundos (40,6 mil) | 2,38 mi | 59x | 5 mil | 53 s |
| 6 | [Animais que dormem de forma bizarra 😱](https://youtube.com/shorts/EzhGaQ9oaT4) | Além da Selva (59,8 mil) | 2,93 mi | 49x | 20 mil | 61 s |
| 7 | [O perigo escondido nesse pássaro! 😳🦒](https://youtube.com/shorts/Hu-Qe9WNI-E) | Cad Shorts (106 mil) | 2,71 mi | 26x | 143 mil | 14 s |
| 8 | [Ela achou que a tartaruga era inofensiva… até olhar de perto](https://youtube.com/shorts/Yazwgcg6yj0) | Curioso S. A. (124 mil) | 2,38 mi | 19x | 140 mil | 23 s |

Fora da lista de propósito: "O segredo bizarro da Rainha da Inglaterra" (30,6 mi de views, razão 27x). A história é muito provavelmente falsa, e modelar boato derruba a confiança no canal.

## Por que viralizaram (o padrão comum)

1. **Animal específico + perigo ou segredo escondido.** Seis dos oito outliers são sobre animais e prometem algo que "ninguém te contou".
2. **O gancho é uma ordem ou um porquê**: "Jamais deixe…", "Por que você não pode…", "O segredo escondido no…". O título e a primeira fala são a mesma frase.
3. **Muito curtos: de 13 a 26 segundos.** Os mais rápidos (razão de 26x a 570x) têm uma ideia só, contada em 4 a 6 frases: o que parece normal → a virada → o fecho.
4. **Chamada final que gera interação**: "Seus likes viram girafas" ou "Qual país vence? Comenta aí". O formato "versus" (nº 2) foi o que cresceu mais rápido (412 mil views por dia) porque faz todo mundo comentar.

## Dissecação dos 3 melhores

| | Cracas da baleia (570x) | Brasil vs Canadá (216x) | Pássaro na girafa (26x, 143 mil/dia) |
|---|---|---|---|
| Gancho (0-3 s) | "Por que você nunca deve remover cracas de uma baleia?" (dedução pelo título e pela descrição) | "Brasil versus Canadá." | "Jamais deixe um pássaro pousar em uma girafa." |
| Promessa | Explicar uma proibição que parece não ter sentido | Um duelo que o público quer julgar | Revelar o perigo de algo que parece bom |
| Estrutura | Pergunta → o que parece óbvio → por que não pode | 5 pares "O Brasil tem X, mas o Canadá tem Y" | Parece ajuda (come carrapatos) → virada (bica a ferida) |
| Retenção | Curiosidade aberta até o fim | Contagem implícita: o público espera o último par | Virada no meio ("Mas…") |
| Chamada final | Não deu para ver (vídeo sem transcrição) | "Qual país sai vencedor? Comenta aí." | "Seus likes viram girafas." |
| Visual | Cenas de baleia, marcadas como feitas com IA | Pares de fotos lado a lado | Close no animal |

## Os 5 vídeos modelados (já prontos em `roteiros/`)

Cada um copia o **mecanismo** (gancho, estrutura e chamada final), nunca o vídeo, a narração ou o texto de outra pessoa. Todos os fatos foram escolhidos por serem verificáveis.

### Vídeo 1 · Jamais toque nessa lagarta 😱 (`roteiros/01-lagarta-lonomia.json`)
- **Modelado de:** nº 7 (pássaro na girafa) + nº 1 (cracas): ordem negativa + "parece inofensivo".
- **Gancho:** "Se você vir isso num tronco de árvore, jamais encoste a mão."
- **Virada:** parece folha seca → é a taturana Lonomia → o veneno impede o sangue de coagular → existe soro do Butantan → o que fazer se encostar.
- **Chamada final:** "Manda pra quem vive mexendo em árvore." (gera compartilhamento)

### Vídeo 2 · O segredo escondido no bico do tucano 🌡️ (`roteiros/02-bico-do-tucano.json`)
- **Modelado de:** nº 3 (o segredo na língua dos gatos): troca só o animal e a parte do corpo.
- **Gancho:** "O bico do tucano esconde um segredo que quase ninguém conhece."
- **Virada:** o bico é cheio de vasos sanguíneos e serve de ar-condicionado natural.

### Vídeo 3 · Animais do Brasil vs Austrália 🇧🇷🇦🇺 (`roteiros/03-brasil-vs-australia.json`)
- **Modelado de:** nº 2 (Brasil vs Canadá), o que cresceu mais rápido. Mesmo esqueleto, outro país.
- **Gancho:** "Animais do Brasil versus animais da Austrália."
- **Chamada final:** "Qual país vence? Comenta aí."
- **Série:** dá para repetir com África, EUA, Japão…

### Vídeo 4 · Por que o polvo quase não nada? 🐙 (`roteiros/04-polvo-nao-nada.json`)
- **Modelado de:** nº 1 (cracas) e nº 4 ("por que eles dormem na madeira"): o porquê de um comportamento estranho.
- **Gancho:** "Por que o polvo prefere rastejar em vez de nadar?"
- **Virada:** são três corações, e o principal para de bater quando ele nada.
- **Chamada final:** "Seus likes viram polvos." (mesmo mecanismo do nº 7)

### Vídeo 5 · Parece fofo, mas tem veneno 😳 (`roteiros/05-ornitorrinco.json`)
- **Modelado de:** nº 8 (a tartaruga que parecia inofensiva).
- **Gancho:** "Parece um bichinho fofo, mas não tente fazer carinho nele."
- **Virada:** o macho tem um esporão venenoso, e a dor pode durar dias.
- **Chamada final:** "Você teria coragem de chegar perto? Comenta."

## Plano de postagem

- **1 a 2 vídeos por dia**, alternando os formatos (proibição, segredo, versus, parece inofensivo).
- No modo rascunho, ao publicar pelo app do TikTok, coloque um **som em alta com volume baixo** por baixo da narração. Os sons da biblioteca do TikTok são licenciados e ajudam o alcance.
- **Nas primeiras 48 h**, olhe a retenção (porcentagem que assiste até o fim) e os comentários. O formato que mais segurar o público vira a base da próxima rodada: aumente a frequência dele em `src/videos/nicho.js`.
- Refaça esta pesquisa a cada 1 ou 2 meses, porque os formatos que viralizam mudam.
