# Orbit Hopper — jogo HTML5 pronto para a Poki

Jogo arcade de **um toque**: o personagem gira em volta de um planeta e você toca na hora certa para saltar até o próximo planeta. Pegue estrelas (moedas), desvie de asteroides e suba o mais alto que conseguir. As moedas compram skins na loja.

Tudo fica em um único arquivo (`index.html`): Canvas 2D e Web Audio, sem imagens nem bibliotecas. O idioma muda sozinho entre PT e EN conforme o navegador.

## Como rodar
Abra `index.html` no navegador, ou sirva a pasta (`npx serve poki-game`). No `localhost` o modo debug da SDK liga sozinho e mostra anúncios de teste.

Para enviar à Poki: compacte o **conteúdo** da pasta (o `index.html`) num .zip e suba no Poki for Developers (Poki Inspector/P4D).

## Integração com a Poki SDK

| Requisito | Onde está no código |
|---|---|
| Script oficial `https://game-cdn.poki.com/scripts/v2/poki-sdk.js` | `<head>` |
| `PokiSDK.init()` com `.catch` para adblock + stub se o script nem carregar | `Poki.init()`, `SdkStub` |
| `gameLoadingFinished()` | no boot, depois do `init` |
| `gameplayStart()` | início da partida, ao despausar e ao reviver |
| `gameplayStop()` | morte, pausa, aba oculta, volta ao menu e antes de todo anúncio |
| `commercialBreak()` | antes de cada partida (**Jogar** / **De novo**) |
| `rewardedBreak()` | **Continuar** (reviver 1x), **Dobrar moedas**, **Começar com escudo**, **+25 moedas** na loja |
| Pausa total durante anúncios | `AdGuard`: congela o loop, suspende o `AudioContext` (música e efeitos) e bloqueia cliques; retoma sozinho no fim |

A recompensa só é dada quando `rewardedBreak()` resolve `true`. Com adblock, o jogador vê a mensagem "Anúncio indisponível agora" e o jogo continua normalmente.

Outros cuidados que a Poki exige: espaço/setas não rolam a página, roda do mouse e menu de contexto bloqueados, funciona em celular e desktop (layout responsivo), pausa quando a aba fica oculta e o progresso é salvo em `localStorage` (com try/catch).
