# Status de produção: "Como funciona o micro-ondas?"

**Fase atual:** CONCLUÍDO (Fase 2). O MP4 final foi renderizado e medido.

| Item | Valor |
| --- | --- |
| Roteiro aprovado | v1, "aprovado, pode gerar" (30/10/2026) |
| Vídeo final | `out/micro-ondas.mp4` (fora do git) |
| Formato medido | H.264 1080 × 1920, 30 fps, 2700 frames, 90,00 s; áudio AAC |
| Loudness | −14,0 LUFS, pico −1,5 dBFS |
| Estabilidade | diferença média entre frames: 2,39 (mediana 1,41); nenhuma faixa de 6 s acima de 4,3 |

## Ajuste depois do primeiro render

- As moléculas de água vibravam rápido demais (cena 4), o que na tela parecia tremedeira: a faixa
  24–30 s media 8,5. O balanço ficou mais lento (≈1,5 Hz) e só as cenas 4–5 (frames 639–1109) foram
  renderizadas de novo e emendadas no vídeo, com o mesmo áudio. Depois do ajuste: 4,2.

## Verificações

- `tsc` e `eslint` sem erros; três rodadas de stills; `ffprobe`, loudness e estabilidade no MP4.
- O agente não ouve o áudio.

## Publicação

- Não publicado. Quando o usuário pedir: somente como Short no canal "Explica Aí".
