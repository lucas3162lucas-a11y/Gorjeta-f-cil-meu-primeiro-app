# Status de produção: "Como a geladeira gela?"

**Fase atual:** CONCLUÍDO (Fase 2). O MP4 final foi renderizado e medido.

| Item | Valor |
| --- | --- |
| Roteiro aprovado | v1, "aprovado, pode gerar" (30/10/2026) |
| Vídeo final | `out/geladeira.mp4` (fora do git; regerar com o README) |
| Formato medido | H.264 1080 × 1920, 30 fps, 2700 frames, 90,00 s; áudio AAC |
| Loudness medido | −14,0 LUFS integrado, pico −1,5 dBFS |
| Estabilidade medida | diferença média entre frames seguidos: 1,81 (mediana 1,22) e nenhuma faixa de 6 s acima de 3,9; no vídeo anterior, antes da correção, era ~15 na primeira metade |

## Verificações feitas

- `tsc --noEmit` e `eslint src` sem erros; timeline íntegra (12 cenas, 2700 frames).
- Duas rodadas de stills revisadas (enquadramento, oclusões, rótulos finais).
- `ffprobe`, loudness e estabilidade medidos no MP4 final. O agente não ouve o áudio.

## Registro de aprovação

- v1 aprovada pelo usuário na mensagem "aprovado, pode gerar".
