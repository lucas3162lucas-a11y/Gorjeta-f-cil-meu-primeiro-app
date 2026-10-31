# Estação Abissal

Jogo de dedução social numa estação no fundo do mar. Tripulantes fazem tarefas; infiltrados matam,
viajam pelos tubos, sabotam (apagão, portas, comunicações, oxigênio, brecha no casco) e mentem.
Reuniões com chat e votação; quem morre vira fantasma e continua as tarefas. Câmeras, mapa, sino de emergência.

- **Assistir**: só IAs jogando, com papéis e pensamentos visíveis.
- **Jogar**: você entra como tripulante ou infiltrado (joystick no celular, WASD no PC).

## Cérebro das IAs

| Onde você abre | Opções |
|---|---|
| Link do Claude (artifact) | Claude ou bots simples |
| `servidor.js` (Termux/PC) | **Sua IA** (NVIDIA, OpenRouter ou modelo local) ou bots simples |
| `index.html` direto no navegador | só bots simples |

## Usar sua própria IA no celular (Termux)

1. Pegue uma chave grátis (é você quem cria, leva 2 minutos, **não passe sua senha para ninguém**):
   - **NVIDIA**: entre em https://build.nvidia.com, faça login, abra um modelo e clique em *Get API Key*. A chave começa com `nvapi-`.
   - **OpenRouter**: entre em https://openrouter.ai, faça login, vá em *Keys* → *Create Key*. A chave começa com `sk-or-`.
     Os modelos grátis têm `:free` no nome (veja a lista em https://openrouter.ai/models?q=free).
2. No Termux:
   ```bash
   pkg install nodejs git
   git clone https://github.com/lucas3162lucas-a11y/Gorjeta-f-cil-meu-primeiro-app.git
   cd Gorjeta-f-cil-meu-primeiro-app/estacao-abissal
   ```
   (se já tiver o projeto, entre na pasta e rode `git pull`)
3. Crie o arquivo `.env` com a sua chave:
   ```bash
   # NVIDIA
   echo "IA_PROVEDOR=nvidia" > .env
   echo "IA_CHAVE=nvapi-COLE-AQUI" >> .env
   # ou OpenRouter
   # echo "IA_PROVEDOR=openrouter" > .env
   # echo "IA_CHAVE=sk-or-COLE-AQUI" >> .env
   ```
   Para trocar o modelo: `echo "IA_MODELO=nome-do-modelo" >> .env`
4. Rode `node servidor.js` e abra **http://localhost:8080** no Chrome do celular.
   No lobby vai aparecer **Sua IA** já selecionada.

## Modelo local (sem internet, sem chave)

Com o [Ollama](https://ollama.com) (no Termux: `pkg install ollama`):

```bash
ollama serve &              # deixa o Ollama rodando
ollama pull qwen2.5:3b      # baixa um modelo pequeno (~2 GB)
echo "IA_PROVEDOR=ollama" > .env
node servidor.js
```

Num celular, um modelo local é **bem mais lento** (cada fala pode levar de 10 a 60 segundos) e os modelos
pequenos erram mais o formato da resposta. Quando a IA erra, aquele boneco fala com a regra simples.
Num PC com placa de vídeo, modelos maiores (`qwen2.5:7b`, `llama3.1:8b`) ficam bem melhores.

## Arquivos

- `index.html`: o jogo inteiro (um arquivo só).
- `servidor.js`: serve o jogo e repassa as falas para a IA escolhida. Só aceita conexões do próprio aparelho,
  então sua chave não fica exposta. O `.env` não vai pro GitHub.
