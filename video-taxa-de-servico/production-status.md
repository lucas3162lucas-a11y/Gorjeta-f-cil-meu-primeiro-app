# Status de produção: "Pra onde vão os 10% da sua conta?"

**Fase atual:** CONCLUÍDO (Fase 2). O MP4 final foi renderizado e medido.

| Item | Valor |
| --- | --- |
| Roteiro aprovado | v1, "aprovado, pode gerar" (29/10/2026) |
| Vídeo final | `out/taxa-de-servico.mp4` (fora do git; regerar com o README) |
| Formato medido | H.264 1080 × 1920, 30 fps, 2700 frames, 90,00 s; áudio AAC 48 kHz estéreo |
| Loudness medido | −14,0 LUFS integrado, pico −1,4 dBFS (após `scripts/loudnorm.py`) |
| Voz | Piper `pt_BR-faber-medium` (gratuito, offline); 77,0 s de fala, ~164 palavras/min |
| Render | `npx remotion render TaxaDeServico ... --gl=swangle --concurrency=4 --crf=17` (CPU, sem GPU) |

## Verificações feitas

- `tsc --noEmit` e `eslint src` sem erros.
- Integridade da timeline: 12 cenas contíguas somando 2700 frames.
- Três rodadas de stills e folhas de contato revisadas, com correções de enquadramento, oclusão do
  meio-muro, legendas e posição das etiquetas.
- `ffprobe` no MP4 final e frames extraídos do próprio MP4 conferidos.
- Áudio medido por segundo (`audiocheck.py`) e normalizado. O agente **não ouve** o áudio: a qualidade
  da voz e da mixagem não foi avaliada de ouvido.

## Pendências recomendadas

- Revisão jurídica das cenas 6, 8 e 10 antes de publicar (ver `roteiro.md`, seção 5).
- Ouvir o vídeo inteiro e conferir a pronúncia da voz sintetizada (ex.: "INSS", "FGTS").

## Registro de aprovação

- v1 aprovada pelo usuário na mensagem "aprovado, pode gerar".
