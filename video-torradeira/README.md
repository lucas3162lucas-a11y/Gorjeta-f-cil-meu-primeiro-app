# Como funciona a torradeira? (Short educativo — canal "Explica Aí")

Vídeo vertical de 90 s (1080 × 1920, 30 fps) em 3D low-poly com Remotion + React Three Fiber.
Roteiro aprovado: [`roteiro.md`](./roteiro.md) · plano original: [`scene-plan.ts`](./scene-plan.ts) ·
andamento: [`production-status.md`](./production-status.md).

## Como gerar de novo

```bash
npm i
pip install piper-tts faster-whisper numpy scipy soundfile pillow
# voz Piper pt_BR-faber-medium (.onnx + .onnx.json) em voices/
python scripts/voiceover.py --lines scripts/narration.json --provider piper --voice voices/pt_BR-faber-medium.onnx --length-scale 1.4 --sentence-silence 0.34
python scripts/prepare_vo.py
python scripts/sfx.py && python scripts/music.py
npx remotion render Torradeira out/torradeira-raw.mp4 --gl=angle --concurrency=4 --crf=17   # sem GPU: --gl=swangle
python scripts/loudnorm.py out/torradeira-raw.mp4 out/torradeira.mp4
```
