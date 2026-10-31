import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Como funciona a panela de pressão?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 7, 9, 6, 8, 6, 9, 7, 8, 7, 9]   // soma 90 s = 2700 frames
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

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-panela-de-pressao", language: "pt-BR" };

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

// Layout (u3d): canto de cozinha com o fogão no centro (x ≈ 0) e a panela sobre a boca da frente;
// garçom à esquerda (x ≈ −1,4). A panela pode aparecer em corte para mostrar a água, o vapor e o feijão.
const P = {
  wide: orbit([-0.4, 1.05, -0.4], 12, 20, 16),
  stove: orbit([0, 1.1, -0.65], 5, 12, 14),
  potCut: orbit([0, 1.15, -0.65], 2.8, 14, 14),
  steamUp: orbit([0, 1.45, -0.65], 3.6, 20, 10),
  lid: orbit([0, 1.2, -0.65], 2.6, 24, 18),
  gaugeView: orbit([0.08, 1.25, -0.6], 2.5, 8, 10),
  valve: orbit([0, 1.38, -0.65], 1.6, 20, 14),
  safety: orbit([0.15, 1.36, -0.6], 1.6, 40, 16),
  final: orbit([-0.4, 1.05, -0.4], 12, 30, 16),
};

const BASE: SceneObject[] = [
  { id: "kitchen", type: "canto-de-cozinha", visible: true },
  { id: "waiter", type: "garcom-do-canal", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-fogo-alto",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer cozinhar o feijão do almoço bem rápido. Parece que basta deixar o fogo no máximo.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.stove, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-aberta", visible: true, state: { start: "vazia", end: "feijão no fogo" } }),
    animations: [
      { type: "spring", target: "kitchen.reveal", startFrame: -8, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "beans.toPot", startFrame: W("s1", 4), endFrame: W("s1", 6) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "stove.flame", startFrame: W("s1", 14), endFrame: W("s1", 14) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [{ text: "COMO COZINHAR RÁPIDO?", variant: "warning", icon: "?", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["FEIJÃO", "RÁPIDO", "FOGO", "MÁXIMO"],
    captions: [{ text: "Você quer cozinhar o feijão do almoço bem rápido.", from: voLocal("s1"), to: W("s1", 9) }, { text: "Parece que basta deixar o fogo no máximo.", from: W("s1", 9), to: end(0) }],
    audioCues: [narration("s1", "ready"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28), sfx("flame", W("s1", 14), 0.22)],
  },
  {
    id: "scene-02-cem-graus",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que a água fervendo não passa de cem graus. Fogo mais alto só faz ela evaporar mais rápido.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.stove), key(W("s2", 3), P.potCut, "soft"), key(end(1), orbit([0, 1.15, -0.65], 2.8, 24, 14), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-aberta", visible: true, state: { start: "fervendo", end: "fervendo" } }, { id: "thermo", type: "termometro-100", visible: true, state: { start: "sobe", end: "trava em 100" } }),
    animations: [
      { type: "interpolate", target: "pot.boil", startFrame: W("s2", 3), endFrame: W("s2", 4) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "pot.cut", startFrame: W("s2", 2), endFrame: W("s2", 4) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "thermo.pop", startFrame: W("s2", 5), endFrame: W("s2", 5) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "thermo.level", startFrame: W("s2", 5), endFrame: W("s2", 9), from: 0.3, to: 0.62, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "steam.amount", startFrame: W("s2", 10), endFrame: W("s2", 16) + 6, from: 0.2, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "TRAVA NOS 100 °C", subtitle: "água fervendo", variant: "negative", appearAt: W("s2", 8), disappearAt: W("s2", 13) }, { text: "SÓ EVAPORA MAIS", variant: "negative", appearAt: W("s2", 14), disappearAt: end(1) - 4 }],
    highlights: ["FERVENDO", "CEM", "GRAUS", "EVAPORAR"],
    captions: [{ text: "Só que a água fervendo não passa de cem graus.", from: voLocal("s2"), to: W("s2", 10) }, { text: "Fogo mais alto só faz ela evaporar mais rápido.", from: W("s2", 10), to: end(1) }],
    audioCues: [narration("s2", "ready"), sfx("bubbles", W("s2", 3), 0.2), sfx("badge-neg", W("s2", 8), 0.26), sfx("badge-neg", W("s2", 14), 0.26)],
  },
  {
    id: "scene-03-vapor-escapa",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "E o vapor carrega o calor embora. Com a panela aberta, ele escapa pelo ar da cozinha.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 1.15, -0.65], 2.8, 24, 14)), key(end(2), P.steamUp, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-aberta", visible: true }, { id: "steam", type: "vapor", visible: true, state: { start: "subindo", end: "escapando" } }),
    animations: [
      { type: "interpolate", target: "heat.inSteam", startFrame: W("s3", 2), endFrame: W("s3", 6) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "steam.escape", startFrame: W("s3", 11), endFrame: end(2) - 8, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "VAPOR LEVA O CALOR", variant: "negative", appearAt: W("s3", 2), disappearAt: W("s3", 9) }, { text: "PANELA ABERTA", subtitle: "o vapor escapa", variant: "negative", appearAt: W("s3", 10), disappearAt: end(2) - 4 }],
    highlights: ["VAPOR", "CALOR", "ABERTA", "ESCAPA"],
    captions: [{ text: "E o vapor carrega o calor embora.", from: voLocal("s3"), to: W("s3", 7) }, { text: "Com a panela aberta, ele escapa pelo ar da cozinha.", from: W("s3", 7), to: end(2) }],
    audioCues: [narration("s3", "ready"), sfx("steam", W("s3", 2), 0.2), sfx("badge-neg", W("s3", 2), 0.26), sfx("badge-neg", W("s3", 10), 0.26)],
  },
  {
    id: "scene-04-tampa-e-borracha",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Por isso a panela de pressão tem uma tampa que trava e uma borracha que veda tudo. O vapor fica preso lá dentro.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.steamUp), key(W("s4", 7), P.lid, "soft"), key(end(3), orbit([0, 1.2, -0.65], 2.6, 40, 18), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true, state: { start: "aberta", end: "fechada e vedada" } }, { id: "lid", type: "tampa-com-trava", visible: true, state: { start: "no ar", end: "travada" } }, { id: "gasket", type: "borracha-de-vedacao", visible: true, state: { start: "oculta", end: "vedando" } }, { id: "steam", type: "vapor", visible: true, state: { start: "escapando", end: "preso" } }),
    animations: [
      { type: "spring", target: "lid.drop", startFrame: W("s4", 7) - 6, endFrame: W("s4", 7) - 6 + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "lid.lock", startFrame: W("s4", 9), endFrame: W("s4", 10) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gasket.glow", startFrame: W("s4", 12), endFrame: W("s4", 15) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "steam.escape", startFrame: W("s4", 15), endFrame: W("s4", 17) + 6, to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "steam.trapped", startFrame: W("s4", 17), endFrame: end(3) - 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "TAMPA QUE TRAVA", variant: "positive", appearAt: W("s4", 8), disappearAt: W("s4", 12) }, { text: "BORRACHA DE VEDAÇÃO", variant: "positive", appearAt: W("s4", 13), disappearAt: W("s4", 17) }, { text: "VAPOR PRESO", variant: "positive", appearAt: W("s4", 17), disappearAt: end(3) - 6 }],
    highlights: ["TAMPA", "TRAVA", "BORRACHA", "VEDA", "PRESO"],
    captions: [{ text: "Por isso a panela de pressão tem uma tampa que trava", from: voLocal("s4"), to: W("s4", 11) }, { text: "e uma borracha que veda tudo.", from: W("s4", 11), to: W("s4", 17) }, { text: "O vapor fica preso lá dentro.", from: W("s4", 17), to: end(3) }],
    audioCues: [narration("s4", "ready"), sfx("clunk", W("s4", 10), 0.28), sfx("badge", W("s4", 8), 0.26), sfx("badge", W("s4", 13), 0.26), sfx("badge", W("s4", 17), 0.28)],
  },
  {
    id: "scene-05-pressao-sobe",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Preso, o vapor se acumula e aperta tudo. A pressão lá dentro sobe.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 1.2, -0.65], 2.6, 40, 18)), key(end(4), P.gaugeView, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "steam", type: "vapor", visible: true, state: { start: "preso", end: "apertado" } }, { id: "gauge", type: "manometro-sem-numeros", visible: true, state: { start: "baixo", end: "subindo" } }),
    animations: [
      { type: "interpolate", target: "steam.density", startFrame: W("s5", 2), endFrame: W("s5", 7) + 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "gauge.pop", startFrame: W("s5", 8), endFrame: W("s5", 8) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "gauge.needle", startFrame: W("s5", 9), endFrame: W("s5", 12) + 10, from: 0.1, to: 0.7, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "PRESSÃO SOBE", variant: "info", appearAt: W("s5", 9), disappearAt: end(4) - 4 }],
    highlights: ["PRESO", "ACUMULA", "APERTA", "PRESSÃO"],
    captions: [{ text: "Preso, o vapor se acumula e aperta tudo.", from: voLocal("s5"), to: W("s5", 8) }, { text: "A pressão lá dentro sobe.", from: W("s5", 8), to: end(4) }],
    audioCues: [narration("s5", "ready"), sfx("hiss-soft", W("s5", 2), 0.14), sfx("badge", W("s5", 9), 0.28)],
  },
  {
    id: "scene-06-ferve-mais-quente",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "E com mais pressão, a água só ferve acima dos cem graus. Mais quente, o feijão cozinha bem mais rápido.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, P.gaugeView), key(W("s6", 4), P.potCut, "soft"), key(end(5), orbit([0, 1.15, -0.65], 2.8, 30, 14), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "thermo", type: "termometro-100", visible: true, state: { start: "100", end: "acima de 100" } }, { id: "gauge", type: "manometro-sem-numeros", visible: true }, { id: "beans", type: "feijao", visible: true, state: { start: "duro", end: "macio" } }),
    animations: [
      { type: "interpolate", target: "thermo.level", startFrame: W("s6", 7), endFrame: W("s6", 11) + 8, to: 0.85, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "beans.cook", startFrame: W("s6", 13), endFrame: end(5) - 8, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "FERVE ACIMA DE 100 °C", variant: "positive", appearAt: W("s6", 7), disappearAt: W("s6", 12) }, { text: "COZINHA MAIS RÁPIDO", variant: "positive", appearAt: W("s6", 13), disappearAt: end(5) - 6 }],
    highlights: ["PRESSÃO", "ACIMA", "QUENTE", "RÁPIDO"],
    captions: [{ text: "E com mais pressão, a água só ferve acima dos cem graus.", from: voLocal("s6"), to: W("s6", 12) }, { text: "Mais quente, o feijão cozinha bem mais rápido.", from: W("s6", 12), to: end(5) }],
    audioCues: [narration("s6", "ready"), sfx("badge", W("s6", 7), 0.28), sfx("badge", W("s6", 13), 0.28)],
  },
  {
    id: "scene-07-pressao-demais",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Mas pressão demais seria perigosa. Como evitar que ela passe do ponto?",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0, 1.15, -0.65], 2.8, 30, 14)), key(end(6), P.gaugeView, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "gauge", type: "manometro-sem-numeros", visible: true, state: { start: "alto", end: "no vermelho" } }),
    animations: [
      { type: "interpolate", target: "pot.cut", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "gauge.needle", startFrame: W("s7", 1), endFrame: W("s7", 4) + 6, to: 0.95, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gauge.alert", startFrame: W("s7", 3), endFrame: W("s7", 4) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "PRESSÃO DEMAIS", variant: "negative", appearAt: W("s7", 2), disappearAt: W("s7", 5) }, { text: "COMO EVITAR?", variant: "warning", icon: "?", appearAt: W("s7", 5), disappearAt: end(6) - 4 }],
    highlights: ["DEMAIS", "PERIGOSA", "EVITAR"],
    captions: [{ text: "Mas pressão demais seria perigosa.", from: voLocal("s7"), to: W("s7", 5) }, { text: "Como evitar que ela passe do ponto?", from: W("s7", 5), to: end(6) }],
    audioCues: [narration("s7", "ready"), sfx("badge-neg", W("s7", 2), 0.26), sfx("badge", W("s7", 5), 0.26)],
  },
  {
    id: "scene-08-pino-com-peso",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "Em cima da tampa tem um pino com peso. Quando a pressão passa do limite, ele levanta e solta um pouco de vapor.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.gaugeView), key(W("s8", 5), P.valve, "soft"), key(end(7), orbit([0, 1.38, -0.65], 1.6, 34, 14), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "valve", type: "pino-com-peso", visible: true, state: { start: "parado", end: "levantando" } }, { id: "gauge", type: "manometro-sem-numeros", visible: true }, { id: "jet", type: "jato-de-vapor", visible: true, state: { start: "ausente", end: "saindo" } }),
    animations: [
      { type: "interpolate", target: "valve.highlight", startFrame: W("s8", 5), endFrame: W("s8", 6) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "valve.cut", startFrame: W("s8", 9), endFrame: W("s8", 11), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "valve.lift", startFrame: W("s8", 16), endFrame: W("s8", 17) + 4, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "jet.on", startFrame: W("s8", 18), endFrame: W("s8", 19) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gauge.needle", startFrame: W("s8", 18), endFrame: end(7) - 6, to: 0.7, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "PINO COM PESO", variant: "info", appearAt: W("s8", 6), disappearAt: W("s8", 15) }, { text: "LEVANTA E SOLTA VAPOR", variant: "positive", appearAt: W("s8", 16), disappearAt: end(7) - 6 }],
    highlights: ["PINO", "PESO", "LIMITE", "LEVANTA", "VAPOR"],
    captions: [{ text: "Em cima da tampa tem um pino com peso.", from: voLocal("s8"), to: W("s8", 9) }, { text: "Quando a pressão passa do limite, ele levanta e solta um pouco de vapor.", from: W("s8", 9), to: end(7) }],
    audioCues: [narration("s8", "ready"), sfx("badge", W("s8", 6), 0.26), sfx("hiss", W("s8", 18), 0.24), sfx("badge", W("s8", 16), 0.28)],
  },
  {
    id: "scene-09-valvula-chia",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "É a válvula de pressão. É por isso que a panela chia e o pino fica balançando.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0, 1.38, -0.65], 1.6, 34, 14)), key(end(8), orbit([0, 1.35, -0.65], 2.0, 10, 12), "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "valve", type: "pino-com-peso", visible: true, state: { start: "levantando", end: "balançando" } }, { id: "jet", type: "jato-de-vapor", visible: true }),
    animations: [
      { type: "interpolate", target: "valve.wobble", startFrame: W("s9", 11), endFrame: W("s9", 12) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "VÁLVULA DE PRESSÃO", variant: "positive", appearAt: W("s9", 2), disappearAt: W("s9", 10) }, { text: "CHIA E BALANÇA", subtitle: "é ela trabalhando", variant: "info", appearAt: W("s9", 11), disappearAt: end(8) - 6 }],
    highlights: ["VÁLVULA", "PRESSÃO", "CHIA", "BALANÇANDO"],
    captions: [{ text: "É a válvula de pressão.", from: voLocal("s9"), to: W("s9", 5) }, { text: "É por isso que a panela chia e o pino fica balançando.", from: W("s9", 5), to: end(8) }],
    audioCues: [narration("s9", "ready"), sfx("badge", W("s9", 2), 0.28), sfx("hiss", W("s9", 11), 0.22), sfx("badge", W("s9", 11), 0.26)],
  },
  {
    id: "scene-10-segunda-saida",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "E se a válvula entupir? Ainda tem uma segunda saída de segurança, que libera o vapor antes de virar problema.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, orbit([0, 1.35, -0.65], 2.0, 10, 12)), key(W("s10", 5), P.safety, "soft"), key(end(9), orbit([0.15, 1.36, -0.6], 1.7, 52, 16), "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "valve", type: "pino-com-peso", visible: true, state: { start: "balançando", end: "entupido (esquemático)" } }, { id: "safety", type: "valvula-de-seguranca", visible: true, state: { start: "fechada", end: "soltando vapor" } }),
    animations: [
      { type: "interpolate", target: "valve.clog", startFrame: W("s10", 3), endFrame: W("s10", 4) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "jet.on", startFrame: W("s10", 3), endFrame: W("s10", 4) + 6, to: 0, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "safety.highlight", startFrame: W("s10", 8), endFrame: W("s10", 8) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "safety.release", startFrame: W("s10", 13), endFrame: W("s10", 15) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "E SE ENTUPIR?", variant: "warning", icon: "?", appearAt: W("s10", 1), disappearAt: W("s10", 5) }, { text: "VÁLVULA DE SEGURANÇA", subtitle: "segunda saída de vapor", variant: "positive", appearAt: W("s10", 8), disappearAt: end(9) - 6 }],
    highlights: ["ENTUPIR", "SEGUNDA", "SEGURANÇA", "LIBERA"],
    captions: [{ text: "E se a válvula entupir?", from: voLocal("s10"), to: W("s10", 5) }, { text: "Ainda tem uma segunda saída de segurança, que libera o vapor antes de virar problema.", from: W("s10", 5), to: end(9) }],
    audioCues: [narration("s10", "ready"), sfx("badge", W("s10", 1), 0.26), sfx("badge", W("s10", 8), 0.28), sfx("hiss", W("s10", 13), 0.22)],
  },
  {
    id: "scene-11-so-abra-depois",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "Por isso, só abra a panela depois que todo o vapor sair e a pressão baixar.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.15, 1.36, -0.6], 1.7, 52, 16)), key(end(10), P.stove, "soft")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true, state: { start: "sob pressão", end: "pressão baixa" } }, { id: "lid", type: "tampa-com-trava", visible: true }, { id: "gauge", type: "manometro-sem-numeros", visible: true, state: { start: "alto", end: "zero" } }, { id: "steam", type: "vapor", visible: true, state: { start: "saindo", end: "acabou" } }),
    animations: [
      { type: "interpolate", target: "stove.flame", startFrame: W("s11", 1), endFrame: W("s11", 3), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "safety.release", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "valve.clog", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "gauge.needle", startFrame: W("s11", 6), endFrame: W("s11", 15), to: 0.05, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "jet.on", startFrame: W("s11", 7), endFrame: W("s11", 11) + 6, from: 0.6, to: 0, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "SÓ ABRA SEM PRESSÃO", subtitle: "espere todo o vapor sair", variant: "warning", appearAt: W("s11", 2), disappearAt: end(10) - 6 }],
    highlights: ["ABRA", "DEPOIS", "VAPOR", "BAIXAR"],
    captions: [{ text: "Por isso, só abra a panela", from: voLocal("s11"), to: W("s11", 6) }, { text: "depois que todo o vapor sair e a pressão baixar.", from: W("s11", 6), to: end(10) }],
    audioCues: [narration("s11", "ready"), sfx("badge", W("s11", 2), 0.28)],
  },
  {
    id: "scene-12-feijao-no-ponto",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: a panela prende o vapor, sobe a pressão e cozinha mais quente. E o feijão sai no ponto!",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, P.stove), key(W("s12", 6), P.wide, "soft"), key(end(11), P.final, "linear")] },
    objects: withBase({ id: "stove", type: "fogao", visible: true }, { id: "pot", type: "panela-de-pressao", visible: true }, { id: "lid", type: "tampa-com-trava", visible: true, state: { start: "travada", end: "aberta" } }, { id: "beans", type: "feijao", visible: true, state: { start: "macio", end: "servido" } }, { id: "finalLabels", type: "rotulos-3d", visible: true }),
    animations: [
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 1), endFrame: W("s12", 1) + 25, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 13), endFrame: W("s12", 13) + 10, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "lid.open", startFrame: W("s12", 13), endFrame: W("s12", 13) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "waiter.serve", startFrame: W("s12", 15), endFrame: W("s12", 15) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "PANELA DE PRESSÃO", subtitle: "prende o vapor e cozinha mais quente", variant: "info", size: "large", appearAt: W("s12", 1), disappearAt: end(11) }],
    highlights: ["PRENDE", "VAPOR", "PRESSÃO", "QUENTE", "PONTO"],
    captions: [{ text: "Pronto: a panela prende o vapor, sobe a pressão e cozinha mais quente.", from: voLocal("s12"), to: W("s12", 13) }, { text: "E o feijão sai no ponto!", from: W("s12", 13), to: end(11) }],
    audioCues: [narration("s12", "ready"), sfx("badge-final", W("s12", 1), 0.32), sfx("ding", W("s12", 15), 0.26)],
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
