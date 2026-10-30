import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Como a geladeira gela?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 8, 9, 7, 7, 5, 8, 7, 9, 8, 8]   // soma 90 s = 2700 frames
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

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-geladeira", language: "pt-BR" };

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

// Layout (u3d): canto de cozinha; balcão à esquerda (x ≈ −1,4); geladeira translúcida no centro
// (centro da base [0.4, 0, −0.55], 1,1 × 2,2 × 0,9; fundo em z ≈ −1,0); compressor atrás embaixo;
// condensador na face de trás; tubo capilar na quina traseira direita; parede em z = −1,6.
const P = {
  counterFar: orbit([-1.4, 1.1, 0.2], 9, 22, 14),
  counter: orbit([-1.4, 1.1, 0.0], 6, 16, 12),
  box: orbit([-1.4, 1.1, -0.3], 4.5, 12, 10),
  cup: orbit([-1.4, 1.2, -0.2], 4, 18, 10),
  fridge: orbit([0.4, 1.3, -0.55], 8, 8, 10),
  evap: orbit([0.4, 1.8, -0.7], 5, 16, 10),
  evapWide: orbit([0.4, 1.6, -0.7], 6.5, 20, 10),
  compressor: orbit([0.4, 0.35, -1.15], 4.5, 68, 14),
  back: orbit([0.4, 1.2, -1.1], 7, 75, 16),
  backClose: orbit([0.4, 1.2, -1.1], 5.5, 87, 14),
  condOut: orbit([0.95, 0.9, -1.0], 5, 55, 10),
  capillary: orbit([0.95, 1.1, -0.95], 4, 50, 8),
  evapEntry: orbit([0.4, 1.8, -0.7], 5.5, 30, 12),
  thermo: orbit([0.4, 1.25, -0.3], 5, 0, 6),
  wide: orbit([0.2, 1.1, -0.4], 14, 30, 18),
  final: orbit([0.2, 1.1, -0.4], 14, 42, 18),
};

const BASE: SceneObject[] = [
  { id: "kitchen", type: "canto-de-cozinha", visible: true },
  { id: "counter", type: "balcao", visible: true },
  { id: "waiter", type: "garcom-do-canal", visible: true },
  { id: "juice", type: "jarra-de-suco", visible: true },
];
const FRIDGE: SceneObject[] = [
  { id: "fridge", type: "geladeira-translucida", visible: true },
  { id: "evaporator", type: "serpentina-evaporador", visible: true },
  { id: "fluid", type: "particulas-refrigerante", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-caixa",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer servir um suco gelado. Parece que basta guardar numa caixa bem fechada.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.counterFar), key(end(0), P.counter, "soft")] },
    objects: withBase({ id: "box", type: "caixa-com-tampa", visible: true, state: { start: "aberta", end: "fechada com a jarra" } }),
    animations: [
      { type: "spring", target: "kitchen.reveal", startFrame: -8, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "juice.inBox", startFrame: W("s1", 9), endFrame: W("s1", 11) + 10, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "box.lid", startFrame: W("s1", 13), endFrame: W("s1", 13) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [{ text: "COMO GELAR O SUCO?", variant: "warning", icon: "?", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["SUCO", "GELADO", "CAIXA"],
    captions: [
      { text: "Você quer servir um suco gelado.", from: voLocal("s1"), to: W("s1", 6) },
      { text: "Parece que basta guardar numa caixa bem fechada.", from: W("s1", 6), to: end(0) },
    ],
    audioCues: [narration("s1", "planned"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28), sfx("thud", W("s1", 13), 0.26)],
  },
  {
    id: "scene-02-caixa-nao-esfria",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que caixa fechada não esfria nada. Ela só guarda, e o calor do suco continua lá dentro.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.counter), key(W("s2", 4), P.box, "soft"), key(end(1), orbit([-1.4, 1.1, -0.3], 4.5, 22, 10), "linear")] },
    objects: withBase(
      { id: "box", type: "caixa-com-tampa", visible: true, state: { start: "fechada", end: "em corte" } },
      { id: "heat", type: "particulas-calor", visible: true },
      { id: "thermo", type: "termometro-sem-numeros", visible: true, state: { start: "quente", end: "quente" } },
    ),
    animations: [
      { type: "interpolate", target: "box.xray", startFrame: W("s2", 2), endFrame: W("s2", 4) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "thermo.pop", startFrame: W("s2", 4), endFrame: W("s2", 4) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "heat.inside", startFrame: W("s2", 12), endFrame: W("s2", 12) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "CAIXA NÃO ESFRIA", variant: "negative", appearAt: W("s2", 4), disappearAt: end(1) - 6 }],
    highlights: ["NÃO", "ESFRIA", "CALOR"],
    captions: [
      { text: "Só que caixa fechada não esfria nada.", from: voLocal("s2"), to: W("s2", 7) },
      { text: "Ela só guarda, e o calor do suco continua lá dentro.", from: W("s2", 7), to: end(1) },
    ],
    audioCues: [narration("s2", "planned"), sfx("badge-neg", W("s2", 4), 0.28)],
  },
  {
    id: "scene-03-evaporar-rouba-calor",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Pra esfriar, é preciso tirar calor. E um líquido que evapora faz isso: ele rouba calor do que está em volta.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([-1.4, 1.1, -0.3], 4.5, 22, 10)), key(s(0.8), P.cup, "soft"), key(end(2), orbit([-1.4, 1.2, -0.2], 4, 32, 10), "linear")] },
    objects: withBase(
      { id: "box", type: "caixa-com-tampa", visible: true },
      { id: "heat", type: "particulas-calor", visible: true, state: { start: "presas", end: "puxadas pelo vapor" } },
      { id: "demoCup", type: "copo-com-gota", visible: true, state: { start: "gota", end: "evaporada, borda com gelo" } },
    ),
    animations: [
      { type: "interpolate", target: "heat.out", startFrame: W("s3", 4), endFrame: W("s3", 5) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "vapor.rise", startFrame: W("s3", 10), endFrame: W("s3", 15), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "heat.toVapor", startFrame: W("s3", 14), endFrame: W("s3", 20), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "frost.cup", startFrame: W("s3", 15), endFrame: end(2) - 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "ESFRIAR = TIRAR CALOR", variant: "info", appearAt: W("s3", 4), disappearAt: W("s3", 9) },
      { text: "EVAPORAR ROUBA CALOR", variant: "positive", appearAt: W("s3", 10), disappearAt: end(2) - 6 },
    ],
    highlights: ["TIRAR", "CALOR", "EVAPORA", "ROUBA"],
    captions: [
      { text: "Pra esfriar, é preciso tirar calor.", from: voLocal("s3"), to: W("s3", 6) },
      { text: "E um líquido que evapora faz isso:", from: W("s3", 6), to: W("s3", 13) },
      { text: "ele rouba calor do que está em volta.", from: W("s3", 13), to: end(2) },
    ],
    audioCues: [narration("s3", "planned"), sfx("badge", W("s3", 4), 0.26), sfx("hiss", W("s3", 10), 0.24), sfx("badge", W("s3", 10), 0.28)],
  },
  {
    id: "scene-04-evaporador",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Por isso, a geladeira tem um tubo com fluido refrigerante. Ele evapora lá dentro e puxa o calor. É o evaporador.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, orbit([-1.4, 1.2, -0.2], 4, 32, 10)), key(W("s4", 3), P.fridge, "soft"), key(W("s4", 10), P.evap, "soft"), key(end(3), orbit([0.4, 1.8, -0.7], 5, 24, 10), "linear")],
    },
    objects: withBase(
      ...FRIDGE,
      { id: "box", type: "caixa-com-tampa", visible: true, state: { start: "visível", end: "some" } },
      { id: "heat", type: "particulas-calor", visible: true, state: { start: "na jarra", end: "indo para a serpentina" } },
    ),
    animations: [
      { type: "interpolate", target: "box.vanish", startFrame: 0, endFrame: s(0.6), from: 0, to: 1, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "juice.toFridge", startFrame: s(0.2), endFrame: W("s4", 3), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "fridge.rise", startFrame: W("s4", 2) - 6, endFrame: W("s4", 2) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "evaporator.draw", startFrame: W("s4", 6), endFrame: W("s4", 9) + 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "fluid.evap", startFrame: W("s4", 11), endFrame: W("s4", 11) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "heat.toEvap", startFrame: W("s4", 15), endFrame: end(3) - 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "FLUIDO REFRIGERANTE", variant: "info", appearAt: W("s4", 8), disappearAt: W("s4", 18) },
      { text: "EVAPORADOR", subtitle: "rouba o calor de dentro", variant: "positive", appearAt: W("s4", 18), disappearAt: end(3) - 6 },
    ],
    highlights: ["TUBO", "REFRIGERANTE", "EVAPORA", "EVAPORADOR"],
    captions: [
      { text: "Por isso, a geladeira tem um tubo com fluido refrigerante.", from: voLocal("s4"), to: W("s4", 10) },
      { text: "Ele evapora lá dentro e puxa o calor.", from: W("s4", 10), to: W("s4", 18) },
      { text: "É o evaporador.", from: W("s4", 18), to: end(3) },
    ],
    audioCues: [narration("s4", "planned"), sfx("whoosh-soft", s(0.2), 0.24), sfx("badge", W("s4", 8), 0.26), sfx("hiss", W("s4", 11), 0.22), sfx("badge", W("s4", 18), 0.28)],
  },
  {
    id: "scene-05-gas-cheio",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Mas, depois de evaporar, esse gás fica carregado de calor. Se ficar parado ali, o frio acaba.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.4, 1.8, -0.7], 5, 24, 10)), key(end(4), P.evapWide, "soft")] },
    objects: withBase(...FRIDGE, { id: "heat", type: "particulas-calor", visible: true }, { id: "thermo", type: "termometro-sem-numeros", visible: true, state: { start: "frio", end: "esquentando" } }),
    animations: [
      { type: "interpolate", target: "fluid.saturate", startFrame: W("s5", 4), endFrame: W("s5", 9) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "thermo.level", startFrame: W("s5", 10), endFrame: W("s5", 16), from: 0.45, to: 0.7, easing: "inOut", unit: "0-1" },
    ],
    badges: [
      { text: "GÁS CHEIO DE CALOR", variant: "negative", appearAt: W("s5", 5), disappearAt: W("s5", 10) },
      { text: "O FRIO ACABA", variant: "negative", appearAt: W("s5", 14), disappearAt: end(4) - 4 },
    ],
    highlights: ["GÁS", "CALOR", "PARADO", "ACABA"],
    captions: [
      { text: "Mas, depois de evaporar, esse gás fica carregado de calor.", from: voLocal("s5"), to: W("s5", 10) },
      { text: "Se ficar parado ali, o frio acaba.", from: W("s5", 10), to: end(4) },
    ],
    audioCues: [narration("s5", "planned"), sfx("badge-neg", W("s5", 5), 0.26), sfx("badge-neg", W("s5", 14), 0.26)],
  },
  {
    id: "scene-06-compressor",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Então um motor suga o gás e aperta. Apertado, ele esquenta ainda mais. É o compressor.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, P.evapWide), key(W("s6", 2), P.compressor, "soft"), key(end(5), orbit([0.4, 0.35, -1.15], 4.5, 80, 14), "linear")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true, state: { start: "desligado", end: "ligado" } },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
    ),
    animations: [
      { type: "spring", target: "compressor.on", startFrame: W("s6", 2), endFrame: W("s6", 2) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "fluid.flow", startFrame: W("s6", 3), endFrame: W("s6", 3) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fluid.hot", startFrame: W("s6", 8), endFrame: W("s6", 12), from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "COMPRESSOR", subtitle: "aperta e esquenta o gás", variant: "positive", appearAt: W("s6", 13), disappearAt: end(5) - 6 }],
    highlights: ["MOTOR", "APERTA", "ESQUENTA", "COMPRESSOR"],
    captions: [
      { text: "Então um motor suga o gás e aperta.", from: voLocal("s6"), to: W("s6", 8) },
      { text: "Apertado, ele esquenta ainda mais. É o compressor.", from: W("s6", 8), to: end(5) },
    ],
    audioCues: [narration("s6", "planned"), sfx("compressor", W("s6", 2), 0.18), sfx("badge", W("s6", 13), 0.28)],
  },
  {
    id: "scene-07-onde-jogar-o-calor",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "E agora? Esse gás quente precisa jogar o calor fora, longe da comida.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([0.4, 0.35, -1.15], 4.5, 80, 14)), key(end(6), P.back, "soft")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "heatArrow", type: "seta-3d", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "pipeDischarge.glow", startFrame: W("s7", 3), endFrame: W("s7", 3) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "heatArrow.pop", startFrame: W("s7", 6), endFrame: W("s7", 6) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [{ text: "ONDE JOGAR O CALOR?", variant: "warning", icon: "?", appearAt: W("s7", 1), disappearAt: end(6) - 4 }],
    highlights: ["QUENTE", "FORA", "COMIDA"],
    captions: [
      { text: "E agora?", from: voLocal("s7"), to: W("s7", 2) },
      { text: "Esse gás quente precisa jogar o calor fora, longe da comida.", from: W("s7", 2), to: end(6) },
    ],
    audioCues: [narration("s7", "planned"), sfx("badge", W("s7", 1), 0.26)],
  },
  {
    id: "scene-08-condensador",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Ele passa por uma grade atrás da geladeira, solta calor pro ar da cozinha e vira líquido. É o condensador.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.back), key(end(7), P.backClose, "soft")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "condenser", type: "grade-condensador", visible: true, state: { start: "apagada", end: "soltando calor" } },
      { id: "heatWaves", type: "ondas-de-calor", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "condenser.draw", startFrame: W("s8", 2), endFrame: W("s8", 4) + 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "interpolate", target: "heatWaves.on", startFrame: W("s8", 8), endFrame: end(7) - 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fluid.condense", startFrame: W("s8", 14), endFrame: W("s8", 16) + 12, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "CONDENSADOR", subtitle: "solta o calor no ar", variant: "positive", appearAt: W("s8", 17), disappearAt: end(7) - 6 }],
    highlights: ["GRADE", "SOLTA", "CALOR", "LÍQUIDO", "CONDENSADOR"],
    captions: [
      { text: "Ele passa por uma grade atrás da geladeira,", from: voLocal("s8"), to: W("s8", 8) },
      { text: "solta calor pro ar da cozinha e vira líquido.", from: W("s8", 8), to: W("s8", 17) },
      { text: "É o condensador.", from: W("s8", 17), to: end(7) },
    ],
    audioCues: [narration("s8", "planned"), sfx("flow", W("s8", 2), 0.2), sfx("badge", W("s8", 17), 0.28)],
  },
  {
    id: "scene-09-ainda-quente",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Só que esse líquido ainda está quente e apertado. Desse jeito, ele não gela nada.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.backClose), key(W("s9", 3), P.condOut, "soft"), key(end(8), orbit([0.95, 0.9, -1.0], 4.6, 48, 10), "linear")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "condenser", type: "grade-condensador", visible: true },
      { id: "gauge", type: "manometro-sem-numeros", visible: true, state: { start: "baixo", end: "alto" } },
      { id: "fluidThermo", type: "termometro-do-fluido", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "gauge.needle", startFrame: W("s9", 6), endFrame: W("s9", 8) + 10, from: 0.2, to: 0.9, easing: "out", unit: "0-1" },
      { type: "spring", target: "fluidThermo.pop", startFrame: W("s9", 5), endFrame: W("s9", 5) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [
      { text: "AINDA QUENTE", variant: "negative", appearAt: W("s9", 6), disappearAt: W("s9", 9) },
      { text: "ASSIM NÃO GELA", variant: "negative", appearAt: W("s9", 11), disappearAt: end(8) - 4 },
    ],
    highlights: ["QUENTE", "APERTADO", "NÃO", "GELA"],
    captions: [
      { text: "Só que esse líquido ainda está quente e apertado.", from: voLocal("s9"), to: W("s9", 9) },
      { text: "Desse jeito, ele não gela nada.", from: W("s9", 9), to: end(8) },
    ],
    audioCues: [narration("s9", "planned"), sfx("badge-neg", W("s9", 6), 0.26), sfx("badge-neg", W("s9", 11), 0.26)],
  },
  {
    id: "scene-10-tubo-capilar",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Por isso ele passa por um tubo fininho, o capilar. A pressão cai, e ele sai gelado, pronto pra evaporar de novo.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([0.95, 0.9, -1.0], 4.6, 48, 10)), key(W("s10", 6), P.capillary, "soft"), key(W("s10", 16), P.evapEntry, "soft"), key(end(9), orbit([0.4, 1.8, -0.7], 5.5, 22, 12), "linear")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "condenser", type: "grade-condensador", visible: true },
      { id: "capillary", type: "tubo-capilar", visible: true, state: { start: "apagado", end: "aceso" } },
      { id: "gauge", type: "manometro-sem-numeros", visible: true, state: { start: "alto", end: "baixo" } },
    ),
    animations: [
      { type: "interpolate", target: "capillary.glow", startFrame: W("s10", 6), endFrame: W("s10", 6) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gauge.needle", startFrame: W("s10", 11), endFrame: W("s10", 12) + 10, to: 0.15, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fluid.cold", startFrame: W("s10", 12), endFrame: W("s10", 16), from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [
      { text: "TUBO CAPILAR", subtitle: "derruba a pressão", variant: "positive", appearAt: W("s10", 7), disappearAt: W("s10", 15) },
      { text: "GELADO DE NOVO", variant: "positive", appearAt: W("s10", 16), disappearAt: end(9) - 6 },
    ],
    highlights: ["FININHO", "CAPILAR", "PRESSÃO", "GELADO"],
    captions: [
      { text: "Por isso ele passa por um tubo fininho, o capilar.", from: voLocal("s10"), to: W("s10", 10) },
      { text: "A pressão cai, e ele sai gelado,", from: W("s10", 10), to: W("s10", 17) },
      { text: "pronto pra evaporar de novo.", from: W("s10", 17), to: end(9) },
    ],
    audioCues: [narration("s10", "planned"), sfx("badge", W("s10", 7), 0.28), sfx("hiss", W("s10", 11), 0.22), sfx("badge", W("s10", 16), 0.28)],
  },
  {
    id: "scene-11-termostato",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Mas gelar sem parar congelaria até o suco. Por isso, um termostato controla o compressor e segura a temperatura.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0.4, 1.8, -0.7], 5.5, 22, 12)), key(s(0.9), P.thermo, "soft"), key(end(10), orbit([0.4, 1.25, -0.3], 5, 10, 8), "linear")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "condenser", type: "grade-condensador", visible: true },
      { id: "capillary", type: "tubo-capilar", visible: true },
      { id: "thermostat", type: "termostato", visible: true, state: { start: "oculto", end: "ajustado" } },
    ),
    animations: [
      { type: "interpolate", target: "juice.ice", startFrame: W("s11", 2), endFrame: W("s11", 7), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "thermostat.pop", startFrame: W("s11", 11), endFrame: W("s11", 11) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "thermostat.knob", startFrame: W("s11", 12), endFrame: W("s11", 14), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "compressor.on", startFrame: W("s11", 13), endFrame: W("s11", 15) + 10, to: 0.2, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "juice.ice", startFrame: W("s11", 14), endFrame: W("s11", 17), to: 0, easing: "inOut", unit: "0-1" },
    ],
    badges: [
      { text: "CONGELA TUDO?", variant: "warning", icon: "?", appearAt: W("s11", 1), disappearAt: W("s11", 8) },
      { text: "TERMOSTATO", subtitle: "controla o compressor", variant: "positive", appearAt: W("s11", 11), disappearAt: end(10) - 6 },
    ],
    highlights: ["CONGELARIA", "TERMOSTATO", "TEMPERATURA"],
    captions: [
      { text: "Mas gelar sem parar congelaria até o suco.", from: voLocal("s11"), to: W("s11", 8) },
      { text: "Por isso, um termostato controla o compressor e segura a temperatura.", from: W("s11", 8), to: end(10) },
    ],
    audioCues: [narration("s11", "planned"), sfx("badge", W("s11", 1), 0.26), sfx("click", W("s11", 12), 0.3), sfx("badge", W("s11", 11), 0.28)],
  },
  {
    id: "scene-12-ciclo-completo",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: a geladeira não cria frio. Ela leva o calor de dentro pra fora, sem parar. E o suco fica no ponto!",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.4, 1.25, -0.3], 5, 10, 8)), key(W("s12", 6), P.wide, "soft"), key(end(11), P.final, "linear")] },
    objects: withBase(
      ...FRIDGE,
      { id: "compressor", type: "compressor", visible: true },
      { id: "pipeSuction", type: "tubo-de-succao", visible: true },
      { id: "pipeDischarge", type: "tubo-de-descarga", visible: true },
      { id: "condenser", type: "grade-condensador", visible: true },
      { id: "capillary", type: "tubo-capilar", visible: true },
      { id: "thermostat", type: "termostato", visible: true },
      { id: "heat", type: "particulas-calor", visible: true },
      { id: "heatWaves", type: "ondas-de-calor", visible: true },
      { id: "finalLabels", type: "rotulos-3d", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "compressor.on", startFrame: W("s12", 1), endFrame: W("s12", 1) + 12, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fluid.loop", startFrame: W("s12", 6), endFrame: W("s12", 6) + 15, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 6), endFrame: W("s12", 6) + 25, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "waiter.serve", startFrame: W("s12", 18), endFrame: W("s12", 18) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "COMO A GELADEIRA GELA", subtitle: "tira o calor de dentro", variant: "info", size: "large", appearAt: W("s12", 6), disappearAt: end(11) }],
    highlights: ["NÃO", "CRIA", "FRIO", "CALOR", "FORA", "SUCO"],
    captions: [
      { text: "Pronto: a geladeira não cria frio.", from: voLocal("s12"), to: W("s12", 6) },
      { text: "Ela leva o calor de dentro pra fora, sem parar.", from: W("s12", 6), to: W("s12", 16) },
      { text: "E o suco fica no ponto!", from: W("s12", 16), to: end(11) },
    ],
    audioCues: [narration("s12", "planned"), sfx("compressor", W("s12", 1), 0.16), sfx("badge-final", W("s12", 6), 0.32)],
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
