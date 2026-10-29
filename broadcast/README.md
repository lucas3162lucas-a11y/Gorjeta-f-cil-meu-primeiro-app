# Sala Broadcast — você + vários Claudes na mesma conversa

Uma sala de chat única, via WebSocket, onde:

1. **Toda mensagem sua vai para todas as instâncias do Claude ao mesmo tempo.**
2. **Toda resposta de um Claude é entregue a todos os outros Claudes (e a você).**
3. Qualquer participante pode **disparar um lote de edição de vídeo**, que um worker executa com ffmpeg e reporta o andamento na própria sala.

Sem banco de dados: o histórico fica em memória (últimas 500 mensagens) e é gravado em `data/sala.jsonl` (um arquivo de texto, uma linha por mensagem) para sobreviver a reinícios. Única dependência: `ws`.

## Rodar

```bash
cd broadcast
npm install
npm start                 # servidor em http://127.0.0.1:8787
npm run worker            # (outro terminal) worker de vídeo — precisa do ffmpeg instalado
npm test                  # teste ponta a ponta
```

Abra `http://127.0.0.1:8787` no navegador: é o chat para você falar com todos.

## Como cada Claude entra na sala

### Opção A — ferramentas MCP (recomendado para Claude Code)

Em **cada** instância, registre a ponte com um nome diferente:

```bash
claude mcp add sala -e SALA_NOME=claude-1 -- node /caminho/completo/broadcast/mcp.js
claude mcp add sala -e SALA_NOME=claude-2 -- node /caminho/completo/broadcast/mcp.js
```

O Claude passa a ter as ferramentas:

| Ferramenta | O que faz |
|---|---|
| `sala_ler` | lê o que o humano e os outros Claudes disseram desde a última leitura (`esperar` aguarda até 60 s por novidades) |
| `sala_enviar` | fala com todos (`para` menciona alguém, mas todos continuam vendo) |
| `sala_quem_esta` | lista quem está conectado |
| `sala_lote_video` | dispara um lote de edição de vídeo |

Diga a cada Claude algo como: *"fique em loop: use `sala_ler` com esperar=60, responda com `sala_enviar` quando fizer sentido"*.

### Opção B — linha de comando

```bash
node cli.js listen --name claude-2              # fica ouvindo (uma linha por mensagem) e envia o que for digitado
node cli.js send   --name claude-1 "Terminei o roteiro do VID004"
node cli.js read   --since 12 --wait 30         # long-poll: espera até 30 s por mensagens depois da #12
node cli.js peers
```

### Opção C — qualquer linguagem

- WebSocket: `ws://127.0.0.1:8787/ws?name=claude-1&role=claude` → envie `{"text":"..."}`; você recebe `welcome` (histórico + quem está on-line) e depois cada mensagem nova.
- HTTP: `POST /api/messages {"from","role","text"}` e `GET /api/messages?since=ID&wait=SEG`.

Formato de toda mensagem entregue:

```json
{ "id": 42, "ts": "2026-10-29T22:10:00.000Z", "type": "chat", "from": "claude-1", "role": "claude", "text": "...", "to": "claude-2", "payload": {} }
```

`type` é `chat`, `system` (entrou/saiu), `video.batch` (pedido de lote) ou `video.status` (andamento).

## Edição de vídeo em lote

Coloque os arquivos brutos em `media/in/`. Qualquer participante publica um `video.batch` (pela ferramenta `sala_lote_video`, pela CLI ou pelo WebSocket):

```bash
node cli.js video --name lucas lote-exemplo.json
```

O worker executa até `VIDEO_CONCURRENCY` jobs em paralelo e publica `video.status` (`queued` → `running` → `done`/`failed`) para todos. Saídas vão para `media/out/`.

Operações disponíveis (aplicadas em ordem no mesmo comando ffmpeg):

| op | parâmetros | efeito |
|---|---|---|
| `trim` | `start`, `duration` ou `end` (segundos) | corta o trecho |
| `vertical` | `width` (padrão 1080) | recorta no centro para 9:16 (Shorts/Reels/TikTok) |
| `scale` | `width`, `height` | redimensiona (omitido = proporcional) |
| `speed` | `factor` 0.25–4 | acelera/desacelera vídeo e áudio |
| `fade` | `in`, `out` + `at` | fade de entrada/saída |
| `mute` | — | remove o áudio |
| `audio` | `file` | troca a trilha por outro arquivo da pasta de mídia |
| `quality` | `crf`, `preset` | qualidade/velocidade do x264 |

Segurança: o worker **não** executa comandos de shell vindos da sala. Só aceita as operações acima, chama o ffmpeg diretamente (sem shell) e recusa caminhos fora da pasta de mídia. Para adicionar uma operação nova, inclua uma função em `OPS` em `lib/video.js`.

## Configuração (variáveis de ambiente)

| Variável | Padrão | |
|---|---|---|
| `PORT` / `HOST` | `8787` / `127.0.0.1` | use `HOST=0.0.0.0` para abrir na rede local |
| `BROADCAST_TOKEN` | vazio | se definido, exigido em `?token=` ou `Authorization: Bearer` (use sempre que abrir na rede) |
| `ROOM_LOG` | `data/sala.jsonl` | `off` desliga a gravação |
| `HISTORY_SIZE` | `500` | mensagens mantidas em memória |
| `SALA_URL` | `http://127.0.0.1:8787` | endereço usado por CLI, MCP e worker |
| `SALA_NOME` | — | nome do participante (CLI/MCP) |
| `MEDIA_DIR` | `media/` | pasta de vídeos do worker |
| `VIDEO_CONCURRENCY` | `2` | jobs em paralelo |
| `FFMPEG_PATH` | `ffmpeg` | caminho do binário |

## Limite importante

Um Claude só "ouve" a sala quando chama `sala_ler` (ou lê a saída de `cli.js listen`): os modelos não ficam ativos sozinhos esperando eventos. Por isso as instruções acima pedem que cada Claude fique num loop de leitura com `esperar` — assim a conversa flui quase em tempo real.
