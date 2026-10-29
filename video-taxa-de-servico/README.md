# Pra onde vão os 10% da sua conta? (Short educativo)

Vídeo vertical de 90 s (1080 × 1920, 30 fps) em 3D low-poly, feito com Remotion + React Three Fiber.
O roteiro aprovado está em [`roteiro.md`](./roteiro.md), o plano de cenas original em
[`scene-plan.ts`](./scene-plan.ts) e o andamento da produção em [`production-status.md`](./production-status.md).

## Estrutura

```
src/
├── Root.tsx / MainSequence.tsx   composição "TaxaDeServico" e orquestração por cenas
├── data/scenes.ts                as 12 cenas (vira do scene-plan.ts aprovado) + vo.json da narração
├── components/                   restaurante, personagens, conta, caixa, rateio, moedas, câmera, legendas
├── scenes/FinalScene.tsx         rótulos da cena final
├── audio/Soundtrack.tsx          narração + efeitos + trilha com ducking
└── utils/                        timing (cortes pela voz), layout do diorama, animação
scripts/                          narração (Piper), efeitos e trilha sintetizados, stills, loudness
public/                           áudio gerado e a fonte Montserrat (OFL)
```

## Como gerar de novo

```bash
npm i
pip install piper-tts faster-whisper numpy scipy soundfile pillow
# voz Piper pt_BR-faber-medium (.onnx + .onnx.json) em voices/
python scripts/voiceover.py --lines scripts/narration.json --provider piper --voice voices/pt_BR-faber-medium.onnx --length-scale 1.3 --sentence-silence 0.32
python scripts/prepare_vo.py
python scripts/sfx.py && python scripts/music.py
npx remotion render TaxaDeServico out/taxa-de-servico-raw.mp4 --gl=angle --concurrency=4 --crf=17   # sem GPU: --gl=swangle
python scripts/loudnorm.py out/taxa-de-servico-raw.mp4 out/taxa-de-servico.mp4
```

Para acompanhar no navegador: `npx remotion studio`.
