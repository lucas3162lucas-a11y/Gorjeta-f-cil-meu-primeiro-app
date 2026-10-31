# Status de produção: "Como funciona a panela de pressão?"

**Fase atual:** CONCLUÍDO (Fase 2). O MP4 final foi renderizado e medido.

| Item | Valor |
| --- | --- |
| Roteiro aprovado | v1, "Pode" (31/10/2026) |
| Vídeo final | `out/panela-de-pressao.mp4` (fora do git) |
| Formato medido | H.264 1080 × 1920, 30 fps, 2700 frames, 90,00 s; áudio AAC |
| Loudness | −14,0 LUFS, pico −1,4 dBFS |
| Estabilidade | diferença média entre frames seguidos: 1,57 (mediana 1,11); nenhuma faixa de 6 s acima de 2,6 — o mais estável dos quatro vídeos |

## Verificações

- `tsc` e `eslint` sem erros; duas rodadas de stills; `ffprobe`, loudness e estabilidade no MP4.
- O agente não ouve o áudio.

## Publicação

- Não publicado. Quando o usuário pedir: somente como Short no canal "Explica Aí".
