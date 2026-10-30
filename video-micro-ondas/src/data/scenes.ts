import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Como funciona o micro-ondas?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 8, 8, 6, 8, 6, 8, 6, 8, 9, 9]   // soma 90 s = 2700 frames
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

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-micro-ondas", language: "pt-BR" };

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
const sfx = (name: string, at: number, volume: number): AudioCue => ({ kind: "sfx", src: `audio/sfx/${name}.wav`, at, volume, status: "ready" });

// Layout (u3d): canto de cozinha; fogão à esquerda (x ≈ −1,6); micro-ondas translúcido no balcão do centro
// (centro [0.3, 1.0, −0.8], 0,9 × 0,55 × 0,6): cavidade à esquerda, magnetron no compartimento da direita,
// guia de ondas por cima, prato giratório e porta de vidro com tela metálica na frente.
const P = {
  wide: orbit([-0.85, 1.05, -0.3], 13.5, 20, 16),
  stove: orbit([-1.6, 1.1, -0.6], 5, 15, 14),
  potCut: orbit([-1.6, 1.15, -0.6], 3.2, 14, 16),
  waveDemo: orbit([-0.9, 1.25, -0.4], 3.6, 20, 12),
  molecule: orbit([-0.9, 1.25, -0.4], 1.9, 34, 8),
  micro: orbit([0.3, 1.3, -0.8], 4.5, 10, 10),
  microWide: orbit([0.1, 1.2, -0.7], 6.5, 18, 14),
  magnetron: orbit([0.62, 1.3, -0.8], 2.8, 45, 14),
  cavity: orbit([0.15, 1.25, -0.8], 3, 12, 12),
  top: orbit([0.15, 1.3, -0.8], 3.5, 10, 55),
  door: orbit([0.15, 1.27, -0.48], 2.8, 4, 6),
  mesh: orbit([0.15, 1.27, -0.48], 1.6, 6, 4),
  final: orbit([-0.85, 1.05, -0.3], 13.5, 28, 16),
};

const BASE: SceneObject[] = [
  { id: "kitchen", type: "canto-de-cozinha", visible: true },
  { id: "counter", type: "balcao", visible: true },
  { id: "waiter", type: "garcom-do-canal", visible: true },
  { id: "marmita", type: "marmita", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-fogo",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer esquentar a marmita do cliente bem rápido. Parece que basta pôr no fogo alto.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.stove, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true, state: { start: "visível", end: "fogo alto" } }, { id: "pot", type: "panela-com-marmita", visible: true, state: { start: "vazia", end: "marmita no fogo" } }),
    animations: [
      { type: "spring", target: "kitchen.reveal", startFrame: -8, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "marmita.toPot", startFrame: W("s1", 4), endFrame: W("s1", 8) + 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "stove.flame", startFrame: W("s1", 14), endFrame: W("s1", 14) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [{ text: "COMO ESQUENTAR RÁPIDO?", variant: "warning", icon: "?", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["MARMITA", "RÁPIDO", "FOGO"],
    captions: [{ text: "Você quer esquentar a marmita do cliente bem rápido.", from: voLocal("s1"), to: W("s1", 9) }, { text: "Parece que basta pôr no fogo alto.", from: W("s1", 9), to: end(0) }],
    audioCues: [narration("s1", "ready"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28), sfx("flame", W("s1", 14), 0.22)],
  },
  {
    id: "scene-02-fogo-so-por-fora",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que o fogo esquenta só por fora. A beirada queima e o meio continua gelado.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.stove), key(W("s2", 8), P.potCut, "soft"), key(end(1), orbit([-1.6, 1.15, -0.6], 3.2, 24, 16), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-com-marmita", visible: true }, { id: "marmitaCut", type: "marmita-em-corte", visible: true, state: { start: "inteira", end: "borda vermelha, centro azul" } }),
    animations: [
      { type: "interpolate", target: "marmita.cut", startFrame: W("s2", 3), endFrame: W("s2", 7), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "marmita.edgeHeat", startFrame: W("s2", 4), endFrame: W("s2", 10) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "marmita.coldCore", startFrame: W("s2", 13), endFrame: W("s2", 13) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [{ text: "BEIRADA QUEIMA", variant: "negative", appearAt: W("s2", 9), disappearAt: W("s2", 13) }, { text: "MEIO GELADO", variant: "negative", appearAt: W("s2", 13), disappearAt: end(1) - 4 }],
    highlights: ["FORA", "QUEIMA", "GELADO"],
    captions: [{ text: "Só que o fogo esquenta só por fora.", from: voLocal("s2"), to: W("s2", 8) }, { text: "A beirada queima e o meio continua gelado.", from: W("s2", 8), to: end(1) }],
    audioCues: [narration("s2", "ready"), sfx("badge-neg", W("s2", 9), 0.26), sfx("badge-neg", W("s2", 13), 0.26)],
  },
  {
    id: "scene-03-ondas-entram",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Pra esquentar mais fundo, dá pra usar ondas invisíveis, parecidas com as do rádio, que entram alguns centímetros na comida.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([-1.6, 1.15, -0.6], 3.2, 24, 16)), key(s(0.8), P.waveDemo, "soft"), key(end(2), orbit([-0.9, 1.25, -0.4], 3.6, 30, 12), "linear")] },
    objects: withBase({ id: "pot", type: "panela-com-marmita", visible: true }, { id: "marmitaCut", type: "marmita-em-corte", visible: true }, { id: "waves", type: "ondas-em-arco", visible: true, state: { start: "ausentes", end: "entrando na borda" } }),
    animations: [
      { type: "interpolate", target: "stove.flame", startFrame: 0, endFrame: s(0.6), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "marmita.toDemo", startFrame: 0, endFrame: s(0.8), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "waves.show", startFrame: W("s3", 7), endFrame: W("s3", 8) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "waves.depth", startFrame: W("s3", 15), endFrame: W("s3", 17) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "ONDAS INVISÍVEIS", variant: "info", appearAt: W("s3", 7), disappearAt: W("s3", 14) }, { text: "ENTRAM NA COMIDA", subtitle: "alguns centímetros", variant: "positive", appearAt: W("s3", 15), disappearAt: end(2) - 6 }],
    highlights: ["ONDAS", "RÁDIO", "ENTRAM", "CENTÍMETROS"],
    captions: [{ text: "Pra esquentar mais fundo, dá pra usar", from: voLocal("s3"), to: W("s3", 7) }, { text: "ondas invisíveis, parecidas com as do rádio,", from: W("s3", 7), to: W("s3", 14) }, { text: "que entram alguns centímetros na comida.", from: W("s3", 14), to: end(2) }],
    audioCues: [narration("s3", "ready"), sfx("whoosh-soft", W("s3", 7), 0.22), sfx("badge", W("s3", 7), 0.26), sfx("badge", W("s3", 15), 0.28)],
  },
  {
    id: "scene-04-agua-balanca",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Elas fazem as moléculas de água balançarem bilhões de vezes por segundo. Esse sacode vira calor. São as micro-ondas.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([-0.9, 1.25, -0.4], 3.6, 30, 12)), key(W("s4", 3), P.molecule, "soft"), key(end(3), orbit([-0.9, 1.25, -0.4], 1.6, 40, 8), "linear")] },
    objects: withBase({ id: "waves", type: "ondas-em-arco", visible: true }, { id: "molecules", type: "moleculas-de-agua", visible: true, state: { start: "paradas", end: "balançando e vermelhas" } }),
    animations: [
      { type: "spring", target: "molecules.pop", startFrame: W("s4", 3), endFrame: W("s4", 3) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "molecules.shake", startFrame: W("s4", 6), endFrame: W("s4", 7) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "molecules.heat", startFrame: W("s4", 13), endFrame: W("s4", 15) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "ÁGUA BALANÇA", subtitle: "bilhões de vezes por segundo", variant: "info", appearAt: W("s4", 5), disappearAt: W("s4", 12) }, { text: "MICRO-ONDAS", subtitle: "sacode a água e vira calor", variant: "positive", appearAt: W("s4", 16), disappearAt: end(3) - 6 }],
    highlights: ["ÁGUA", "BALANÇAREM", "CALOR", "MICRO-ONDAS"],
    captions: [{ text: "Elas fazem as moléculas de água balançarem bilhões de vezes por segundo.", from: voLocal("s4"), to: W("s4", 12) }, { text: "Esse sacode vira calor.", from: W("s4", 12), to: W("s4", 16) }, { text: "São as micro-ondas.", from: W("s4", 16), to: end(3) }],
    audioCues: [narration("s4", "ready"), sfx("hum-soft", W("s4", 6), 0.16), sfx("badge", W("s4", 5), 0.26), sfx("badge", W("s4", 16), 0.28)],
  },
  {
    id: "scene-05-quem-cria",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Mas quem cria essas ondas? Precisa de uma peça que transforme eletricidade em micro-ondas.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([-0.9, 1.25, -0.4], 1.6, 40, 8)), key(end(4), P.micro, "soft")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true, state: { start: "fora de cena", end: "sobe no balcão" } }, { id: "marmitaCut", type: "marmita-em-corte", visible: true }),
    animations: [
      { type: "interpolate", target: "molecules.out", startFrame: 0, endFrame: s(0.5), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "marmita.toMicro", startFrame: s(0.3), endFrame: W("s5", 4), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "microwave.rise", startFrame: W("s5", 2), endFrame: W("s5", 2) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "plug.pop", startFrame: W("s5", 11), endFrame: W("s5", 11) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [{ text: "QUEM CRIA AS ONDAS?", variant: "warning", icon: "?", appearAt: W("s5", 0), disappearAt: end(4) - 4 }],
    highlights: ["CRIA", "PEÇA", "ELETRICIDADE"],
    captions: [{ text: "Mas quem cria essas ondas?", from: voLocal("s5"), to: W("s5", 5) }, { text: "Precisa de uma peça que transforme eletricidade em micro-ondas.", from: W("s5", 5), to: end(4) }],
    audioCues: [narration("s5", "ready"), sfx("whoosh-soft", s(0.3), 0.22), sfx("badge", W("s5", 0), 0.26)],
  },
  {
    id: "scene-06-magnetron",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "É o magnetron. Ele fica escondido do lado da caixa e manda as ondas por um tubo até a comida.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, P.micro), key(W("s6", 2), P.magnetron, "soft"), key(W("s6", 13), P.cavity, "soft"), key(end(5), orbit([0.15, 1.25, -0.8], 3, 20, 14), "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true }, { id: "magnetron", type: "magnetron", visible: true, state: { start: "apagado", end: "emitindo" } }, { id: "waveguide", type: "guia-de-ondas", visible: true, state: { start: "apagado", end: "ondas passando" } }, { id: "waves", type: "ondas-em-arco", visible: true }),
    animations: [
      { type: "spring", target: "magnetron.on", startFrame: W("s6", 2), endFrame: W("s6", 2) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "waveguide.flow", startFrame: W("s6", 11), endFrame: W("s6", 16) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "cavity.waves", startFrame: W("s6", 17), endFrame: W("s6", 19) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "MAGNETRON", subtitle: "cria as micro-ondas", variant: "positive", appearAt: W("s6", 2), disappearAt: W("s6", 11) }, { text: "GUIA DE ONDAS", subtitle: "o tubo até a comida", variant: "info", appearAt: W("s6", 14), disappearAt: end(5) - 6 }],
    highlights: ["MAGNETRON", "ESCONDIDO", "TUBO", "COMIDA"],
    captions: [{ text: "É o magnetron.", from: voLocal("s6"), to: W("s6", 3) }, { text: "Ele fica escondido do lado da caixa", from: W("s6", 3), to: W("s6", 10) }, { text: "e manda as ondas por um tubo até a comida.", from: W("s6", 10), to: end(5) }],
    audioCues: [narration("s6", "ready"), sfx("hum", W("s6", 2), 0.16), sfx("badge", W("s6", 2), 0.28), sfx("badge", W("s6", 14), 0.26)],
  },
  {
    id: "scene-07-ondas-escapam",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Só que ondas soltas escapariam pela cozinha. E aí? Como prender tudo lá dentro?",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.15, 1.25, -0.8], 3, 20, 14)), key(end(6), P.microWide, "soft")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true, state: { start: "paredes apagadas", end: "paredes apagadas" } }, { id: "magnetron", type: "magnetron", visible: true }, { id: "waves", type: "ondas-em-arco", visible: true, state: { start: "dentro", end: "vazando (esquemático)" } }),
    animations: [
      { type: "interpolate", target: "waves.leak", startFrame: W("s7", 2), endFrame: W("s7", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "ONDAS ESCAPANDO", variant: "negative", appearAt: W("s7", 3), disappearAt: W("s7", 7) }, { text: "COMO PRENDER?", variant: "warning", icon: "?", appearAt: W("s7", 9), disappearAt: end(6) - 4 }],
    highlights: ["SOLTAS", "ESCAPARIAM", "PRENDER"],
    captions: [{ text: "Só que ondas soltas escapariam pela cozinha.", from: voLocal("s7"), to: W("s7", 7) }, { text: "E aí? Como prender tudo lá dentro?", from: W("s7", 7), to: end(6) }],
    audioCues: [narration("s7", "ready"), sfx("badge-neg", W("s7", 3), 0.26), sfx("badge", W("s7", 9), 0.26)],
  },
  {
    id: "scene-08-caixa-de-metal",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Por isso a caixa é de metal. As paredes refletem as ondas, que ficam batendo lá dentro até a comida absorver.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.microWide), key(W("s8", 7), P.top, "soft"), key(end(7), orbit([0.15, 1.3, -0.8], 3.5, 30, 55), "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true, state: { start: "paredes apagadas", end: "paredes de metal acesas" } }, { id: "magnetron", type: "magnetron", visible: true }, { id: "waves", type: "ondas-em-arco", visible: true, state: { start: "vazando", end: "batendo nas paredes" } }),
    animations: [
      { type: "interpolate", target: "waves.leak", startFrame: W("s8", 3), endFrame: W("s8", 6) + 6, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "walls.metal", startFrame: W("s8", 3), endFrame: W("s8", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "waves.bounce", startFrame: W("s8", 9), endFrame: W("s8", 14), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "marmita.absorb", startFrame: W("s8", 17), endFrame: end(7) - 8, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "CAIXA DE METAL", subtitle: "reflete as ondas", variant: "positive", appearAt: W("s8", 6), disappearAt: W("s8", 12) }, { text: "ONDAS PRESAS", variant: "positive", appearAt: W("s8", 14), disappearAt: end(7) - 6 }],
    highlights: ["METAL", "REFLETEM", "BATENDO", "ABSORVER"],
    captions: [{ text: "Por isso a caixa é de metal.", from: voLocal("s8"), to: W("s8", 7) }, { text: "As paredes refletem as ondas,", from: W("s8", 7), to: W("s8", 12) }, { text: "que ficam batendo lá dentro até a comida absorver.", from: W("s8", 12), to: end(7) }],
    audioCues: [narration("s8", "ready"), sfx("clunk", W("s8", 6), 0.22), sfx("badge", W("s8", 6), 0.28), sfx("badge", W("s8", 14), 0.26)],
  },
  {
    id: "scene-09-porta-de-vidro",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "E a porta de vidro? Dá pra ver a comida, mas as ondas não saem.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0.15, 1.3, -0.8], 3.5, 30, 55)), key(W("s9", 2), P.door, "soft"), key(end(8), orbit([0.15, 1.27, -0.48], 2.4, 2, 6), "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true }, { id: "door", type: "porta-com-vidro", visible: true, state: { start: "fechada", end: "destacada" } }, { id: "waves", type: "ondas-em-arco", visible: true }),
    animations: [
      { type: "interpolate", target: "door.highlight", startFrame: W("s9", 2), endFrame: W("s9", 4) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "door.eye", startFrame: W("s9", 6), endFrame: W("s9", 6) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [{ text: "E A PORTA DE VIDRO?", variant: "warning", icon: "?", appearAt: W("s9", 1), disappearAt: W("s9", 10) }, { text: "ONDAS NÃO SAEM", variant: "info", appearAt: W("s9", 11), disappearAt: end(8) - 4 }],
    highlights: ["PORTA", "VIDRO", "VER", "NÃO"],
    captions: [{ text: "E a porta de vidro?", from: voLocal("s9"), to: W("s9", 5) }, { text: "Dá pra ver a comida, mas as ondas não saem.", from: W("s9", 5), to: end(8) }],
    audioCues: [narration("s9", "ready"), sfx("badge", W("s9", 1), 0.26), sfx("badge", W("s9", 11), 0.26)],
  },
  {
    id: "scene-10-tela-com-furinhos",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Ela tem uma tela de metal com furinhos. A luz passa, mas as micro-ondas são grandes demais pra atravessar.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0.15, 1.27, -0.48], 2.4, 2, 6)), key(W("s10", 3), P.mesh, "soft"), key(end(9), orbit([0.15, 1.27, -0.48], 1.4, 12, 4), "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true }, { id: "door", type: "porta-com-vidro", visible: true }, { id: "mesh", type: "tela-metalica-com-furos", visible: true, state: { start: "oculta", end: "em close" } }, { id: "waves", type: "ondas-em-arco", visible: true }, { id: "light", type: "raios-de-luz", visible: true, state: { start: "ausentes", end: "atravessando" } }),
    animations: [
      { type: "interpolate", target: "mesh.zoom", startFrame: W("s10", 3), endFrame: W("s10", 7) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "light.pass", startFrame: W("s10", 8), endFrame: W("s10", 10) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "waves.blocked", startFrame: W("s10", 12), endFrame: W("s10", 18), from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "TELA DE METAL", subtitle: "furinhos menores que a onda", variant: "positive", appearAt: W("s10", 3), disappearAt: W("s10", 8) }, { text: "LUZ PASSA, ONDA NÃO", variant: "positive", appearAt: W("s10", 11), disappearAt: end(9) - 6 }],
    highlights: ["TELA", "FURINHOS", "LUZ", "GRANDES"],
    captions: [{ text: "Ela tem uma tela de metal com furinhos.", from: voLocal("s10"), to: W("s10", 8) }, { text: "A luz passa, mas as micro-ondas são grandes demais pra atravessar.", from: W("s10", 8), to: end(9) }],
    audioCues: [narration("s10", "ready"), sfx("badge", W("s10", 3), 0.28), sfx("ding", W("s10", 8), 0.18), sfx("badge", W("s10", 11), 0.28)],
  },
  {
    id: "scene-11-prato-gira",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Ainda tem um problema: as ondas se juntam em alguns pontos e deixam outros frios. Por isso o prato gira.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0.15, 1.27, -0.48], 1.4, 12, 4)), key(s(0.9), P.top, "soft"), key(end(10), orbit([0.15, 1.3, -0.8], 3.5, 25, 55), "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true }, { id: "waves", type: "ondas-em-arco", visible: true }, { id: "hotspots", type: "mapa-de-pontos-quentes", visible: true, state: { start: "oculto", end: "manchas quentes e frias" } }, { id: "turntable", type: "prato-giratorio", visible: true, state: { start: "parado", end: "girando" } }),
    animations: [
      { type: "interpolate", target: "waves.blocked", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "hotspots.show", startFrame: W("s11", 4), endFrame: W("s11", 7) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "turntable.spin", startFrame: W("s11", 18), endFrame: end(10), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "hotspots.even", startFrame: W("s11", 18) + 10, endFrame: end(10) - 4, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "PONTOS FRIOS", variant: "negative", appearAt: W("s11", 7), disappearAt: W("s11", 15) }, { text: "PRATO GIRATÓRIO", subtitle: "espalha o calor", variant: "positive", appearAt: W("s11", 17), disappearAt: end(10) - 6 }],
    highlights: ["PROBLEMA", "PONTOS", "FRIOS", "GIRA"],
    captions: [{ text: "Ainda tem um problema:", from: voLocal("s11"), to: W("s11", 4) }, { text: "as ondas se juntam em alguns pontos e deixam outros frios.", from: W("s11", 4), to: W("s11", 15) }, { text: "Por isso o prato gira.", from: W("s11", 15), to: end(10) }],
    audioCues: [narration("s11", "ready"), sfx("badge-neg", W("s11", 7), 0.26), sfx("motor", W("s11", 18), 0.16), sfx("badge", W("s11", 17), 0.28)],
  },
  {
    id: "scene-12-sistema-completo",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: o micro-ondas sacode a água da comida e esquenta tudo em minutos. E a marmita sai no ponto!",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.15, 1.3, -0.8], 3.5, 25, 55)), key(W("s12", 3), P.microWide, "soft"), key(W("s12", 12), orbit([0.1, 1.2, -0.7], 6.5, 28, 14), "linear"), key(W("s12", 15), P.wide, "soft"), key(end(11), P.final, "linear")] },
    objects: withBase({ id: "microwave", type: "micro-ondas-translucido", visible: true }, { id: "magnetron", type: "magnetron", visible: true }, { id: "waveguide", type: "guia-de-ondas", visible: true }, { id: "waves", type: "ondas-em-arco", visible: true }, { id: "turntable", type: "prato-giratorio", visible: true }, { id: "mesh", type: "tela-metalica-com-furos", visible: true }, { id: "finalLabels", type: "rotulos-3d", visible: true }),
    animations: [
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 3), endFrame: W("s12", 3) + 25, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 13), endFrame: W("s12", 13) + 10, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "bell.ding", startFrame: W("s12", 12), endFrame: W("s12", 12) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "waiter.serve", startFrame: W("s12", 15), endFrame: W("s12", 15) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "MICRO-ONDAS", subtitle: "sacode a água da comida", variant: "info", size: "large", appearAt: W("s12", 3), disappearAt: end(11) }],
    highlights: ["SACODE", "ÁGUA", "MINUTOS", "PONTO"],
    captions: [{ text: "Pronto: o micro-ondas sacode a água da comida e esquenta tudo em minutos.", from: voLocal("s12"), to: W("s12", 13) }, { text: "E a marmita sai no ponto!", from: W("s12", 13), to: end(11) }],
    audioCues: [narration("s12", "ready"), sfx("ding", W("s12", 12), 0.3), sfx("badge-final", W("s12", 3), 0.32)],
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
