import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Como funciona a torradeira?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 7, 6, 8, 8, 6, 8, 6, 8, 9, 10]   // soma 90 s = 2700 frames
//   GAPS = Array(11).fill(0.55)
// Sem "tranco" de câmera: toda trilha parte do valor de repouso (lição do vídeo anterior).
// Frames de animações, badges, legendas, câmera e áudio são LOCAIS à cena; startFrame é global.
// W("sN", i) = frame local em que a palavra i (base 0) da fala sN começa (estimado até o TTS).

export type VideoConfig = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  theme: string;
  language: string;
};

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-torradeira", language: "pt-BR" };

/** negative = problema (✖ vermelho), positive = solução (✔ verde), info = termo/neutro, warning = pergunta/atenção. */
export type BadgeVariant = "positive" | "negative" | "info" | "warning";

/** Pose de passagem da câmera (a câmera interpola em coordenadas orbitais entre as chaves). */
export type CameraKey = { at: number; position: Vec3; target: Vec3; zoom?: number; easing?: EaseName };

export type CameraPlan = {
  projection: "perspective" | "orthographic";
  movement: "dolly-in" | "dolly-out" | "vertical" | "orbit" | "tracking" | "split" | "hold";
  /** keys[0] é a pose inicial do plano; inclua uma chave no último frame para continuidade. */
  keys: CameraKey[];
};

/** Objeto persistente do sistema: ids estáveis entre cenas; `visible` controla a montagem. */
export type SceneObject = { id: string; type: string; visible: boolean; state?: { start: string; end: string } };

export type SceneBadge = {
  text: string;
  variant: BadgeVariant;
  appearAt: number;
  disappearAt?: number;
  subtitle?: string;
  slot?: "center" | "left" | "right";
  icon?: "?";
  size?: "normal" | "large";
};

/** Legenda provisória (antes do TTS). Depois do alinhamento, as legendas vêm palavra a palavra de vo.json. */
export type CaptionBlock = { text: string; from: number; to: number };

export type AudioCue = {
  kind: "narration" | "sfx";
  src: string;
  at: number;
  volume: number;
  status: "planned" | "ready";
};

export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: VoKey;
  narration: string;
  camera: CameraPlan;
  objects: SceneObject[];
  animations: TrackAnimation[];
  badges: SceneBadge[];
  highlights: string[];
  captions: CaptionBlock[];
  audioCues: AudioCue[];
};

const sc = (i: number) => SCENE_FRAMES[i];
const end = (i: number) => SCENE_FRAMES[i].durationInFrames;
const W = wordLocal;
const key = (at: number, pose: { position: Vec3; target: Vec3 }, easing?: EaseName): CameraKey => ({ at, ...pose, easing });
const narration = (k: VoKey, status: AudioCue["status"]): AudioCue => ({ kind: "narration", src: `audio/vo/${k}.wav`, at: voLocal(k), volume: 1, status });
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "planned" });

// Layout (u3d): canto de cozinha; fogão com frigideira à esquerda (x ≈ −1,2); torradeira em corte no
// balcão do centro ([0.2, 1.0, −0.75]): resistências, fendas, alavanca com eletroímã, mola, botão de tempo
// e bandeja de migalhas. Garçom à esquerda.
const P = {
  wide: orbit([-0.4, 1.0, -0.4], 12, 20, 16),
  stove: orbit([-1.2, 1.0, -0.7], 4, 14, 18),
  pan: orbit([-1.2, 1.0, -0.6], 2.2, 14, 20),
  toaster: orbit([0.2, 1.15, -0.75], 2.6, 12, 14),
  inside: orbit([0.2, 1.12, -0.75], 1.5, 18, 24),
  wire: orbit([0.2, 1.1, -0.68], 1.0, 20, 8),
  knob: orbit([0.38, 1.08, -0.64], 1.3, 30, 10),
  lever: orbit([0.38, 1.05, -0.7], 1.3, 60, 10),
  tray: orbit([0.2, 1.0, -0.64], 1.6, 20, 4),
  final: orbit([-0.4, 1.0, -0.4], 12, 30, 16),
};

const BASE: SceneObject[] = [
  { id: "kitchen", type: "canto-de-cozinha", visible: true },
  { id: "waiter", type: "garcom-do-canal", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-frigideira",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer servir um pão torradinho no café da manhã. Parece que basta colocar numa frigideira bem quente.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.stove, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pan", type: "frigideira", visible: true, state: { start: "vazia", end: "pão em cima" } }, { id: "bread", type: "fatias-de-pao", visible: true }),
    animations: [
      { type: "spring", target: "kitchen.reveal", startFrame: -8, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "bread.toPan", startFrame: W("s1", 4), endFrame: W("s1", 6) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "pan.heat", startFrame: W("s1", 15), endFrame: W("s1", 15) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [{ text: "COMO TORRAR O PÃO?", variant: "warning", icon: "?", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["PÃO", "TORRADINHO", "FRIGIDEIRA"],
    captions: [{ text: "Você quer servir um pão torradinho no café da manhã.", from: voLocal("s1"), to: W("s1", 10) }, { text: "Parece que basta colocar numa frigideira bem quente.", from: W("s1", 10), to: end(0) }],
    audioCues: [narration("s1", "planned"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28), sfx("sizzle", W("s1", 15), 0.18)],
  },
  {
    id: "scene-02-um-lado-queima",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que a frigideira esquenta um lado de cada vez. Um lado queima e o outro fica branco.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.stove), key(W("s2", 3), P.pan, "soft"), key(end(1), orbit([-1.2, 1.0, -0.6], 2.2, 26, 20), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pan", type: "frigideira", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true, state: { start: "cru", end: "um lado queimado, outro branco" } }),
    animations: [
      { type: "interpolate", target: "bread.burnBottom", startFrame: W("s2", 4), endFrame: W("s2", 12) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "bread.flip", startFrame: W("s2", 13), endFrame: W("s2", 13) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [{ text: "UM LADO DE CADA VEZ", variant: "negative", appearAt: W("s2", 4), disappearAt: W("s2", 10) }, { text: "QUEIMA E FICA BRANCO", variant: "negative", appearAt: W("s2", 10), disappearAt: end(1) - 4 }],
    highlights: ["LADO", "QUEIMA", "BRANCO"],
    captions: [{ text: "Só que a frigideira esquenta um lado de cada vez.", from: voLocal("s2"), to: W("s2", 10) }, { text: "Um lado queima e o outro fica branco.", from: W("s2", 10), to: end(1) }],
    audioCues: [narration("s2", "planned"), sfx("badge-neg", W("s2", 4), 0.26), sfx("badge-neg", W("s2", 10), 0.26)],
  },
  {
    id: "scene-03-resistencias",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "A torradeira resolve com fios que esquentam quando a eletricidade passa por eles. São as resistências.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([-1.2, 1.0, -0.6], 2.2, 26, 20)), key(W("s3", 1), P.toaster, "soft"), key(end(2), P.inside, "soft")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true, state: { start: "apagadas", end: "vermelhas" } }, { id: "current", type: "particulas-de-corrente", visible: true }),
    animations: [
      { type: "spring", target: "toaster.rise", startFrame: W("s3", 1) - 6, endFrame: W("s3", 1) - 6 + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "toaster.cut", startFrame: W("s3", 3), endFrame: W("s3", 5) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "current.flow", startFrame: W("s3", 8), endFrame: W("s3", 10) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "wires.heat", startFrame: W("s3", 6), endFrame: W("s3", 12) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "ELETRICIDADE VIRA CALOR", variant: "info", appearAt: W("s3", 8), disappearAt: W("s3", 13) }, { text: "RESISTÊNCIAS", subtitle: "fios que esquentam", variant: "positive", appearAt: W("s3", 13), disappearAt: end(2) - 6 }],
    highlights: ["FIOS", "ESQUENTAM", "ELETRICIDADE", "RESISTÊNCIAS"],
    captions: [{ text: "A torradeira resolve com fios que esquentam quando a eletricidade passa por eles.", from: voLocal("s3"), to: W("s3", 13) }, { text: "São as resistências.", from: W("s3", 13), to: end(2) }],
    audioCues: [narration("s3", "planned"), sfx("whoosh-soft", W("s3", 1), 0.22), sfx("hum", W("s3", 8), 0.14), sfx("badge", W("s3", 8), 0.26), sfx("badge", W("s3", 13), 0.28)],
  },
  {
    id: "scene-04-fio-comum-derrete",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Mas fio comum, nesse calor, ia derreter ou se desgastar rapidinho.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.inside), key(end(3), P.wire, "soft")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "badWire", type: "fio-comum-derretendo", visible: true, state: { start: "inteiro", end: "derretendo (esquemático)" } }),
    animations: [
      { type: "spring", target: "badWire.pop", startFrame: W("s4", 1), endFrame: W("s4", 1) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "badWire.melt", startFrame: W("s4", 5), endFrame: W("s4", 10) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "FIO COMUM DERRETE", subtitle: "esquemático", variant: "negative", appearAt: W("s4", 5), disappearAt: end(3) - 4 }],
    highlights: ["COMUM", "DERRETER", "DESGASTAR"],
    captions: [{ text: "Mas fio comum, nesse calor,", from: voLocal("s4"), to: W("s4", 5) }, { text: "ia derreter ou se desgastar rapidinho.", from: W("s4", 5), to: end(3) }],
    audioCues: [narration("s4", "planned"), sfx("badge-neg", W("s4", 5), 0.26), sfx("sizzle", W("s4", 6), 0.14)],
  },
  {
    id: "scene-05-niquel-cromo",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Por isso elas são de uma liga especial de níquel e cromo, que aguenta ficar vermelha de quente sem estragar.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.wire), key(end(4), orbit([0.2, 1.1, -0.68], 1.0, 40, 8), "soft")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true, state: { start: "vermelhas", end: "vermelhas sem estragar" } }, { id: "badWire", type: "fio-comum-derretendo", visible: true }),
    animations: [
      { type: "interpolate", target: "badWire.out", startFrame: 0, endFrame: s(0.6), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "wires.glow", startFrame: W("s5", 9), endFrame: W("s5", 11) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "NÍQUEL-CROMO", subtitle: "aguenta ficar vermelho", variant: "positive", appearAt: W("s5", 9), disappearAt: end(4) - 6 }],
    highlights: ["LIGA", "NÍQUEL", "CROMO", "VERMELHA"],
    captions: [{ text: "Por isso elas são de uma liga especial de níquel e cromo,", from: voLocal("s5"), to: W("s5", 12) }, { text: "que aguenta ficar vermelha de quente sem estragar.", from: W("s5", 12), to: end(4) }],
    audioCues: [narration("s5", "planned"), sfx("badge", W("s5", 9), 0.28)],
  },
  {
    id: "scene-06-dois-lados",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "E tem fio dos dois lados do pão. Assim as duas faces torram juntas, por igual.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.2, 1.1, -0.68], 1.0, 40, 8)), key(W("s6", 5), P.inside, "soft"), key(end(5), orbit([0.2, 1.12, -0.75], 1.6, 32, 26), "linear")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "heat", type: "ondas-de-calor", visible: true, state: { start: "ausentes", end: "dos dois lados" } }),
    animations: [
      { type: "spring", target: "bread.drop", startFrame: W("s6", 5), endFrame: W("s6", 5) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "heat.both", startFrame: W("s6", 8), endFrame: W("s6", 13), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "bread.toast", startFrame: W("s6", 12), endFrame: end(5) - 6, from: 0, to: 0.6, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "DOIS LADOS AO MESMO TEMPO", variant: "positive", appearAt: W("s6", 8), disappearAt: end(5) - 6 }],
    highlights: ["DOIS", "LADOS", "JUNTAS", "IGUAL"],
    captions: [{ text: "E tem fio dos dois lados do pão.", from: voLocal("s6"), to: W("s6", 8) }, { text: "Assim as duas faces torram juntas, por igual.", from: W("s6", 8), to: end(5) }],
    audioCues: [narration("s6", "planned"), sfx("badge", W("s6", 8), 0.28)],
  },
  {
    id: "scene-07-o-ponto",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Mas e o ponto? Como saber a hora de parar antes de virar carvão?",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.2, 1.12, -0.75], 1.6, 32, 26)), key(end(6), P.toaster, "soft")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "smoke", type: "fumaca-de-queimado", visible: true }),
    animations: [
      { type: "interpolate", target: "bread.toast", startFrame: W("s7", 4), endFrame: W("s7", 12), to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "smoke.on", startFrame: W("s7", 11), endFrame: end(6) - 4, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "E O PONTO?", variant: "warning", icon: "?", appearAt: W("s7", 1), disappearAt: W("s7", 9) }, { text: "VIRA CARVÃO", subtitle: "esquemático", variant: "negative", appearAt: W("s7", 11), disappearAt: end(6) - 4 }],
    highlights: ["PONTO", "PARAR", "CARVÃO"],
    captions: [{ text: "Mas e o ponto?", from: voLocal("s7"), to: W("s7", 4) }, { text: "Como saber a hora de parar antes de virar carvão?", from: W("s7", 4), to: end(6) }],
    audioCues: [narration("s7", "planned"), sfx("badge", W("s7", 1), 0.26), sfx("badge-neg", W("s7", 11), 0.26)],
  },
  {
    id: "scene-08-controle-de-tempo",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "O botão regula um controle de tempo. Quanto mais alto, mais tempo a resistência fica ligada.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.toaster), key(W("s8", 1), P.knob, "soft"), key(end(7), orbit([0.38, 1.08, -0.64], 1.4, 40, 10), "linear")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "knob", type: "botao-de-tempo", visible: true, state: { start: "baixo", end: "alto" } }, { id: "timerBar", type: "barra-de-tempo", visible: true }),
    animations: [
      { type: "interpolate", target: "smoke.on", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "bread.toast", startFrame: 0, endFrame: s(0.6), to: 0.35, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "knob.highlight", startFrame: W("s8", 1), endFrame: W("s8", 1) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "timer.show", startFrame: W("s8", 4), endFrame: W("s8", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "knob.turn", startFrame: W("s8", 8), endFrame: W("s8", 9) + 10, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "CONTROLE DE TEMPO", variant: "positive", appearAt: W("s8", 3), disappearAt: W("s8", 8) }, { text: "MAIS ALTO, MAIS TEMPO", variant: "info", appearAt: W("s8", 8), disappearAt: end(7) - 6 }],
    highlights: ["BOTÃO", "TEMPO", "ALTO", "LIGADA"],
    captions: [{ text: "O botão regula um controle de tempo.", from: voLocal("s8"), to: W("s8", 7) }, { text: "Quanto mais alto, mais tempo a resistência fica ligada.", from: W("s8", 7), to: end(7) }],
    audioCues: [narration("s8", "planned"), sfx("badge", W("s8", 3), 0.28), sfx("tick", W("s8", 8), 0.22), sfx("badge", W("s8", 8), 0.26)],
  },
  {
    id: "scene-09-ima-segura",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Enquanto torra, um ímã elétrico segura a alavanca lá embaixo.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.38, 1.08, -0.64], 1.4, 40, 10)), key(end(8), P.lever, "soft")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "lever", type: "alavanca", visible: true, state: { start: "em cima", end: "embaixo" } }, { id: "magnet", type: "eletroima", visible: true, state: { start: "desligado", end: "segurando" } }),
    animations: [
      { type: "interpolate", target: "lever.down", startFrame: W("s9", 0), endFrame: W("s9", 1) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "magnet.on", startFrame: W("s9", 3), endFrame: W("s9", 3) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [{ text: "ÍMÃ ELÉTRICO", subtitle: "segura a alavanca", variant: "positive", appearAt: W("s9", 3), disappearAt: end(8) - 6 }],
    highlights: ["ÍMÃ", "ELÉTRICO", "SEGURA", "ALAVANCA"],
    captions: [{ text: "Enquanto torra, um ímã elétrico", from: voLocal("s9"), to: W("s9", 5) }, { text: "segura a alavanca lá embaixo.", from: W("s9", 5), to: end(8) }],
    audioCues: [narration("s9", "planned"), sfx("clunk", W("s9", 1), 0.24), sfx("badge", W("s9", 3), 0.28)],
  },
  {
    id: "scene-10-mola-pula",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Quando o tempo acaba, a corrente desliga, o ímã solta e uma mola joga o pão pra cima.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.lever), key(W("s10", 9), orbit([0.25, 1.15, -0.72], 2.0, 30, 12), "soft"), key(end(9), orbit([0.25, 1.2, -0.72], 2.4, 20, 12), "linear")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "lever", type: "alavanca", visible: true, state: { start: "embaixo", end: "sobe" } }, { id: "magnet", type: "eletroima", visible: true, state: { start: "ligado", end: "desligado" } }, { id: "spring", type: "mola", visible: true, state: { start: "comprimida", end: "solta" } }, { id: "timerBar", type: "barra-de-tempo", visible: true }),
    animations: [
      { type: "interpolate", target: "timer.run", startFrame: 0, endFrame: W("s10", 3), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "current.flow", startFrame: W("s10", 5), endFrame: W("s10", 6) + 4, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "wires.heat", startFrame: W("s10", 5), endFrame: W("s10", 7) + 10, to: 0.15, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "magnet.on", startFrame: W("s10", 8), endFrame: W("s10", 9), to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "bread.pop", startFrame: W("s10", 12), endFrame: W("s10", 12) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "lever.down", startFrame: W("s10", 12), endFrame: W("s10", 12) + 6, to: 0, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "A CORRENTE DESLIGA", variant: "info", appearAt: W("s10", 3), disappearAt: W("s10", 9) }, { text: "A MOLA JOGA O PÃO", variant: "positive", appearAt: W("s10", 11), disappearAt: end(9) - 6 }],
    highlights: ["TEMPO", "DESLIGA", "SOLTA", "MOLA"],
    captions: [{ text: "Quando o tempo acaba, a corrente desliga, o ímã solta", from: voLocal("s10"), to: W("s10", 10) }, { text: "e uma mola joga o pão pra cima.", from: W("s10", 10), to: end(9) }],
    audioCues: [narration("s10", "planned"), sfx("click", W("s10", 5), 0.24), sfx("boing", W("s10", 12), 0.3), sfx("badge", W("s10", 11), 0.28)],
  },
  {
    id: "scene-11-bandeja-de-migalhas",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "E as migalhas que caem? Ficam numa bandejinha embaixo, que sai pra limpar, sempre com a torradeira desligada da tomada.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0.25, 1.2, -0.72], 2.4, 20, 12)), key(W("s11", 5), P.tray, "soft"), key(end(10), orbit([0.2, 1.0, -0.64], 1.7, 34, 4), "linear")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "crumbs", type: "migalhas", visible: true }, { id: "tray", type: "bandeja", visible: true, state: { start: "fechada", end: "puxada" } }, { id: "plug", type: "tomada-desligada", visible: true }),
    animations: [
      { type: "interpolate", target: "crumbs.fall", startFrame: W("s11", 2), endFrame: W("s11", 5) + 8, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "tray.out", startFrame: W("s11", 10), endFrame: W("s11", 12) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "unplug.pop", startFrame: W("s11", 16), endFrame: W("s11", 16) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [{ text: "BANDEJA DE MIGALHAS", variant: "positive", appearAt: W("s11", 7), disappearAt: W("s11", 13) }, { text: "LIMPE DESLIGADA DA TOMADA", variant: "warning", appearAt: W("s11", 13), disappearAt: end(10) - 6 }],
    highlights: ["MIGALHAS", "BANDEJINHA", "LIMPAR", "DESLIGADA"],
    captions: [{ text: "E as migalhas que caem?", from: voLocal("s11"), to: W("s11", 5) }, { text: "Ficam numa bandejinha embaixo, que sai pra limpar,", from: W("s11", 5), to: W("s11", 13) }, { text: "sempre com a torradeira desligada da tomada.", from: W("s11", 13), to: end(10) }],
    audioCues: [narration("s11", "planned"), sfx("badge", W("s11", 7), 0.28), sfx("badge", W("s11", 13), 0.28)],
  },
  {
    id: "scene-12-torrada-no-ponto",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: eletricidade vira calor, o tempo controla o ponto e a mola faz o resto. E a torrada sai no ponto!",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.2, 1.0, -0.64], 1.7, 34, 4)), key(W("s12", 1), P.toaster, "soft"), key(W("s12", 15), P.wide, "soft"), key(end(11), P.final, "linear")] },
    objects: withBase({ id: "toaster", type: "torradeira-em-corte", visible: true }, { id: "bread", type: "fatias-de-pao", visible: true }, { id: "wires", type: "resistencias", visible: true }, { id: "knob", type: "botao-de-tempo", visible: true }, { id: "lever", type: "alavanca", visible: true }, { id: "finalLabels", type: "rotulos-3d", visible: true }),
    animations: [
      { type: "interpolate", target: "tray.out", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 1), endFrame: W("s12", 1) + 20, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 15), endFrame: W("s12", 15) + 10, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "waiter.serve", startFrame: W("s12", 16), endFrame: W("s12", 16) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "TORRADEIRA", subtitle: "eletricidade vira calor", variant: "info", size: "large", appearAt: W("s12", 1), disappearAt: end(11) }],
    highlights: ["ELETRICIDADE", "CALOR", "TEMPO", "MOLA", "PONTO"],
    captions: [{ text: "Pronto: eletricidade vira calor, o tempo controla o ponto e a mola faz o resto.", from: voLocal("s12"), to: W("s12", 15) }, { text: "E a torrada sai no ponto!", from: W("s12", 15), to: end(11) }],
    audioCues: [narration("s12", "planned"), sfx("badge-final", W("s12", 1), 0.32), sfx("ding", W("s12", 16), 0.26)],
  },
];

/** Valor de uma trilha de animação no frame global. */
export const track = (target: string, frame: number, fallback = 0) => evaluateTrack(scenes, target, frame, FPS, fallback);

/** Cena ativa no frame global. */
export const sceneAt = (frame: number) => {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (frame >= scenes[i].startFrame) return scenes[i];
  }
  return scenes[0];
};

export const isVisible = (id: string, frame: number) => sceneAt(frame).objects.some((o) => o.id === id && o.visible);

// Verificação de integridade da timeline (executada ao importar): contígua, começa em 0, soma DURATION.
scenes.forEach((cur, i) => {
  const prev = scenes[i - 1];
  if (prev && prev.startFrame + prev.durationInFrames !== cur.startFrame) {
    throw new Error(`Buraco/sobreposição entre ${prev.id} e ${cur.id}`);
  }
});
const total = scenes.reduce((acc, cur) => acc + cur.durationInFrames, 0);
if (total !== DURATION || scenes[0].startFrame !== 0) {
  throw new Error(`As cenas somam ${total} frames (esperado ${DURATION})`);
}
