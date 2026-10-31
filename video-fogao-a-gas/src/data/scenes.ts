import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Como funciona o fogão a gás?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 8, 6, 9, 8, 5, 7, 6, 8, 9, 10]   // soma 90 s = 2700 frames
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

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-fogao-a-gas", language: "pt-BR" };

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

// Layout (u3d): canto de cozinha com o fogão no centro (x ≈ 0) em corte lateral: botão na frente,
// válvula, injetor de gás, tubo misturador com entrada de ar, queimador com furinhos, acendedor e
// sensor de calor ao lado da chama. Botijão à direita, panela de sopa na boca da frente.
const P = {
  wide: orbit([-0.4, 1.0, -0.4], 12, 20, 16),
  stove: orbit([0, 1.0, -0.7], 4.5, 12, 16),
  burner: orbit([0, 0.95, -0.62], 2.2, 15, 22),
  spark: orbit([0.1, 0.95, -0.5], 1.2, 30, 6),
  flame: orbit([0, 1.0, -0.62], 2.0, 10, 12),
  mixer: orbit([0, 0.82, -0.52], 2.2, 20, 10),
  knob: orbit([0, 0.82, -0.36], 1.6, 10, 8),
  sensor: orbit([-0.1, 0.95, -0.5], 1.2, -30, 6),
  cylinder: orbit([1.1, 0.5, -0.9], 3.0, 20, 14),
  final: orbit([-0.4, 1.0, -0.4], 12, 30, 16),
};

const BASE: SceneObject[] = [
  { id: "kitchen", type: "canto-de-cozinha", visible: true },
  { id: "waiter", type: "garcom-do-canal", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-abrir-gas",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você quer acender a boca do fogão pra esquentar a sopa. Parece que basta abrir o gás.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.wide), key(end(0), P.stove, "soft")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true, state: { start: "fechado", end: "aberto" } }),
    animations: [
      { type: "spring", target: "kitchen.reveal", startFrame: -8, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "pot.place", startFrame: W("s1", 8), endFrame: W("s1", 8) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "knob.turn", startFrame: W("s1", 14), endFrame: W("s1", 16) + 6, from: 0, to: 0.6, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gas.flow", startFrame: W("s1", 15), endFrame: end(0) - 4, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [{ text: "COMO ACENDER?", variant: "warning", icon: "?", appearAt: W("s1", 2), disappearAt: end(0) - 6 }],
    highlights: ["ACENDER", "SOPA", "GÁS"],
    captions: [{ text: "Você quer acender a boca do fogão pra esquentar a sopa.", from: voLocal("s1"), to: W("s1", 11) }, { text: "Parece que basta abrir o gás.", from: W("s1", 11), to: end(0) }],
    audioCues: [narration("s1", "ready"), sfx("whoosh-soft", 0, 0.3), sfx("badge", W("s1", 2), 0.28), sfx("click", W("s1", 14), 0.26), sfx("gas", W("s1", 15), 0.16)],
  },
  {
    id: "scene-02-gas-nao-pega-fogo",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que o gás sozinho não pega fogo. Ele precisa de uma faísca pra começar a queimar.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.stove), key(W("s2", 3), P.burner, "soft"), key(end(1), orbit([0, 0.95, -0.62], 2.2, 28, 22), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true, state: { start: "saindo", end: "saindo sem chama" } }, { id: "burnerCut", type: "queimador-em-corte", visible: true }),
    animations: [
      { type: "interpolate", target: "burner.cut", startFrame: W("s2", 2), endFrame: W("s2", 4) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "noFire.mark", startFrame: W("s2", 6), endFrame: W("s2", 6) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [{ text: "GÁS NÃO PEGA FOGO SOZINHO", variant: "negative", appearAt: W("s2", 5), disappearAt: W("s2", 11) }, { text: "PRECISA DE FAÍSCA", variant: "info", appearAt: W("s2", 12), disappearAt: end(1) - 4 }],
    highlights: ["GÁS", "SOZINHO", "FAÍSCA", "QUEIMAR"],
    captions: [{ text: "Só que o gás sozinho não pega fogo.", from: voLocal("s2"), to: W("s2", 8) }, { text: "Ele precisa de uma faísca pra começar a queimar.", from: W("s2", 8), to: end(1) }],
    audioCues: [narration("s2", "ready"), sfx("badge-neg", W("s2", 5), 0.26), sfx("badge", W("s2", 12), 0.26)],
  },
  {
    id: "scene-03-acendedor",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Por isso o fogão tem um acendedor. Ao girar o botão, ele solta uma faísca bem do lado do queimador.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 0.95, -0.62], 2.2, 28, 22)), key(W("s3", 4), P.spark, "soft"), key(end(2), orbit([0.1, 0.95, -0.5], 1.2, 44, 6), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true }, { id: "burnerCut", type: "queimador-em-corte", visible: true }, { id: "igniter", type: "acendedor", visible: true, state: { start: "apagado", end: "faiscando" } }, { id: "flame", type: "chama", visible: true, state: { start: "apagada", end: "amarela" } }),
    animations: [
      { type: "interpolate", target: "noFire.mark", startFrame: 0, endFrame: s(0.4), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "igniter.glow", startFrame: W("s3", 5), endFrame: W("s3", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "knob.turn", startFrame: W("s3", 8), endFrame: W("s3", 10), to: 0.9, easing: "out", unit: "0-1" },
      { type: "spring", target: "spark.on", startFrame: W("s3", 12), endFrame: W("s3", 12) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: W("s3", 15), endFrame: W("s3", 18), from: 0, to: 0.7, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "ACENDEDOR", subtitle: "faísca do lado do queimador", variant: "positive", appearAt: W("s3", 6), disappearAt: end(2) - 6 }],
    highlights: ["ACENDEDOR", "GIRAR", "FAÍSCA", "QUEIMADOR"],
    captions: [{ text: "Por isso o fogão tem um acendedor.", from: voLocal("s3"), to: W("s3", 7) }, { text: "Ao girar o botão, ele solta uma faísca bem do lado do queimador.", from: W("s3", 7), to: end(2) }],
    audioCues: [narration("s3", "ready"), sfx("badge", W("s3", 6), 0.28), sfx("spark", W("s3", 12), 0.3), sfx("whoosh-flame", W("s3", 15), 0.24)],
  },
  {
    id: "scene-04-chama-amarela",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Mas, se o gás sair puro, a chama fica amarela, fraca e solta fuligem.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0.1, 0.95, -0.5], 1.2, 44, 6)), key(end(3), P.flame, "soft")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true }, { id: "burnerCut", type: "queimador-em-corte", visible: true }, { id: "flame", type: "chama", visible: true, state: { start: "amarela", end: "amarela com fuligem" } }, { id: "soot", type: "fuligem", visible: true }),
    animations: [
      { type: "interpolate", target: "spark.on", startFrame: 0, endFrame: s(0.4), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "flame.yellow", startFrame: W("s4", 5), endFrame: W("s4", 9), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "soot.on", startFrame: W("s4", 12), endFrame: end(3) - 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "CHAMA AMARELA", variant: "negative", appearAt: W("s4", 8), disappearAt: W("s4", 12) }, { text: "FULIGEM", subtitle: "queima incompleta", variant: "negative", appearAt: W("s4", 12), disappearAt: end(3) - 4 }],
    highlights: ["PURO", "AMARELA", "FRACA", "FULIGEM"],
    captions: [{ text: "Mas, se o gás sair puro,", from: voLocal("s4"), to: W("s4", 6) }, { text: "a chama fica amarela, fraca e solta fuligem.", from: W("s4", 6), to: end(3) }],
    audioCues: [narration("s4", "ready"), sfx("badge-neg", W("s4", 8), 0.26), sfx("badge-neg", W("s4", 12), 0.26)],
  },
  {
    id: "scene-05-tubinho-puxa-ar",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Pra queimar direito, o gás precisa de ar. Então, antes de sair, ele passa por um tubinho que puxa o ar da cozinha.",
    camera: { projection: "perspective", movement: "tracking", keys: [key(0, P.flame), key(W("s5", 8), P.mixer, "soft"), key(end(4), orbit([0, 0.82, -0.52], 2.0, 34, 10), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true }, { id: "burnerCut", type: "queimador-em-corte", visible: true }, { id: "flame", type: "chama", visible: true }, { id: "stoveCut", type: "fogao-em-corte", visible: true, state: { start: "fechado", end: "aberto" } }, { id: "mixer", type: "tubo-misturador", visible: true, state: { start: "apagado", end: "puxando ar" } }, { id: "air", type: "particulas-de-ar", visible: true }),
    animations: [
      { type: "interpolate", target: "stove.cut", startFrame: W("s5", 7), endFrame: W("s5", 9) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "mixer.glow", startFrame: W("s5", 15), endFrame: W("s5", 16) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "air.in", startFrame: W("s5", 17), endFrame: end(4) - 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "PRECISA DE AR", variant: "info", appearAt: W("s5", 4), disappearAt: W("s5", 12) }, { text: "TUBO MISTURADOR", subtitle: "puxa o ar da cozinha", variant: "positive", appearAt: W("s5", 15), disappearAt: end(4) - 6 }],
    highlights: ["AR", "TUBINHO", "PUXA", "COZINHA"],
    captions: [{ text: "Pra queimar direito, o gás precisa de ar.", from: voLocal("s5"), to: W("s5", 8) }, { text: "Então, antes de sair, ele passa por um tubinho que puxa o ar da cozinha.", from: W("s5", 8), to: end(4) }],
    audioCues: [narration("s5", "ready"), sfx("badge", W("s5", 4), 0.26), sfx("whoosh-soft", W("s5", 8), 0.2), sfx("badge", W("s5", 15), 0.28), sfx("air", W("s5", 17), 0.16)],
  },
  {
    id: "scene-06-chama-azul",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Misturado na medida certa, ele sai pelos furinhos do queimador e vira uma chama azul e forte.",
    camera: { projection: "perspective", movement: "vertical", keys: [key(0, orbit([0, 0.82, -0.52], 2.0, 34, 10)), key(W("s6", 5), P.flame, "soft"), key(end(5), orbit([0, 1.0, -0.62], 2.0, 22, 12), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true }, { id: "burnerCut", type: "queimador-em-corte", visible: true }, { id: "stoveCut", type: "fogao-em-corte", visible: true }, { id: "mixer", type: "tubo-misturador", visible: true }, { id: "air", type: "particulas-de-ar", visible: true }, { id: "flame", type: "chama", visible: true, state: { start: "amarela", end: "azul e forte" } }),
    animations: [
      { type: "interpolate", target: "mix.ok", startFrame: W("s6", 0), endFrame: W("s6", 3), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "flame.yellow", startFrame: W("s6", 11), endFrame: W("s6", 14), to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "soot.on", startFrame: W("s6", 11), endFrame: W("s6", 14), to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: W("s6", 11), endFrame: W("s6", 16) + 6, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [{ text: "MISTURA CERTA", subtitle: "gás + ar", variant: "positive", appearAt: W("s6", 1), disappearAt: W("s6", 9) }, { text: "CHAMA AZUL", subtitle: "queima completa", variant: "positive", appearAt: W("s6", 12), disappearAt: end(5) - 6 }],
    highlights: ["MISTURADO", "FURINHOS", "AZUL", "FORTE"],
    captions: [{ text: "Misturado na medida certa,", from: voLocal("s6"), to: W("s6", 4) }, { text: "ele sai pelos furinhos do queimador e vira uma chama azul e forte.", from: W("s6", 4), to: end(5) }],
    audioCues: [narration("s6", "ready"), sfx("badge", W("s6", 1), 0.26), sfx("whoosh-flame", W("s6", 12), 0.24), sfx("badge", W("s6", 12), 0.28)],
  },
  {
    id: "scene-07-alto-ou-baixo",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "E como deixar o fogo mais alto ou mais baixo?",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([0, 1.0, -0.62], 2.0, 22, 12)), key(end(6), orbit([0, 1.0, -0.62], 2.2, 8, 14), "soft")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "burnerCut", type: "queimador-em-corte", visible: true }, { id: "stoveCut", type: "fogao-em-corte", visible: true }, { id: "mixer", type: "tubo-misturador", visible: true }, { id: "flame", type: "chama", visible: true }),
    animations: [
      { type: "interpolate", target: "air.in", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "COMO REGULAR O FOGO?", variant: "warning", icon: "?", appearAt: W("s7", 1), disappearAt: end(6) - 4 }],
    highlights: ["ALTO", "BAIXO"],
    captions: [{ text: "E como deixar o fogo mais alto ou mais baixo?", from: voLocal("s7"), to: W("s7", 10) }, { text: "", from: W("s7", 10), to: end(6) }],
    audioCues: [narration("s7", "ready"), sfx("badge", W("s7", 1), 0.26)],
  },
  {
    id: "scene-08-valvula",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "O botão abre e fecha uma válvula. Mais aberta, passa mais gás e a chama cresce.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, orbit([0, 1.0, -0.62], 2.2, 8, 14)), key(W("s8", 1), P.knob, "soft"), key(W("s8", 9), orbit([0, 0.9, -0.45], 2.4, 14, 14), "soft"), key(end(7), orbit([0, 0.92, -0.5], 2.4, 22, 14), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true, state: { start: "meio", end: "todo aberto" } }, { id: "valve", type: "valvula-em-corte", visible: true, state: { start: "meio aberta", end: "aberta" } }, { id: "stoveCut", type: "fogao-em-corte", visible: true }, { id: "mixer", type: "tubo-misturador", visible: true }, { id: "flame", type: "chama", visible: true, state: { start: "média", end: "grande" } }),
    animations: [
      { type: "interpolate", target: "valve.show", startFrame: W("s8", 2), endFrame: W("s8", 6) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "knob.turn", startFrame: W("s8", 7), endFrame: W("s8", 9) + 8, to: 0.4, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: W("s8", 7), endFrame: W("s8", 9) + 8, to: 0.45, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "knob.turn", startFrame: W("s8", 12), endFrame: W("s8", 15) + 8, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: W("s8", 12), endFrame: W("s8", 15) + 8, to: 1.25, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "VÁLVULA DO BOTÃO", variant: "positive", appearAt: W("s8", 3), disappearAt: W("s8", 9) }, { text: "MAIS GÁS, MAIS CHAMA", variant: "positive", appearAt: W("s8", 9), disappearAt: end(7) - 6 }],
    highlights: ["BOTÃO", "VÁLVULA", "ABERTA", "CRESCE"],
    captions: [{ text: "O botão abre e fecha uma válvula.", from: voLocal("s8"), to: W("s8", 7) }, { text: "Mais aberta, passa mais gás e a chama cresce.", from: W("s8", 7), to: end(7) }],
    audioCues: [narration("s8", "ready"), sfx("badge", W("s8", 3), 0.28), sfx("click", W("s8", 7), 0.22), sfx("whoosh-flame", W("s8", 12), 0.22), sfx("badge", W("s8", 9), 0.26)],
  },
  {
    id: "scene-09-vento-apaga",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "Mas, e se um vento apagar a chama? O gás continuaria saindo.",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([0, 0.92, -0.5], 2.4, 22, 14)), key(end(8), P.flame, "soft")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "stoveCut", type: "fogao-em-corte", visible: true }, { id: "flame", type: "chama", visible: true, state: { start: "acesa", end: "apagada" } }, { id: "wind", type: "rajada-de-vento", visible: true }, { id: "gasFlow", type: "fluxo-de-gas", visible: true, state: { start: "saindo", end: "saindo sem chama" } }),
    animations: [
      { type: "interpolate", target: "valve.show", startFrame: 0, endFrame: s(0.5), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: 0, endFrame: s(0.5), to: 0.9, easing: "inOut", unit: "0-1" },
      { type: "spring", target: "wind.gust", startFrame: W("s9", 3), endFrame: W("s9", 3) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "flame.size", startFrame: W("s9", 5), endFrame: W("s9", 7), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "gas.leakShow", startFrame: W("s9", 8), endFrame: end(8) - 6, from: 0, to: 1, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "VENTO APAGA", variant: "negative", appearAt: W("s9", 4), disappearAt: W("s9", 8) }, { text: "GÁS SAINDO SEM CHAMA", variant: "negative", appearAt: W("s9", 8), disappearAt: end(8) - 4 }],
    highlights: ["VENTO", "APAGAR", "CONTINUARIA"],
    captions: [{ text: "Mas, e se um vento apagar a chama?", from: voLocal("s9"), to: W("s9", 8) }, { text: "O gás continuaria saindo.", from: W("s9", 8), to: end(8) }],
    audioCues: [narration("s9", "ready"), sfx("wind", W("s9", 3), 0.24), sfx("badge-neg", W("s9", 4), 0.26), sfx("badge-neg", W("s9", 8), 0.26)],
  },
  {
    id: "scene-10-sensor-de-calor",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Muitos fogões têm um sensor de calor perto da chama. Se ela apaga, ele fecha o gás sozinho.",
    camera: { projection: "perspective", movement: "dolly-in", keys: [key(0, P.flame), key(W("s10", 4), P.sensor, "soft"), key(end(9), orbit([-0.1, 0.95, -0.5], 1.3, -42, 6), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "stoveCut", type: "fogao-em-corte", visible: true }, { id: "flame", type: "chama", visible: true }, { id: "sensor", type: "sensor-de-calor", visible: true, state: { start: "frio", end: "esfriou" } }, { id: "safetyValve", type: "valvula-de-seguranca", visible: true, state: { start: "aberta", end: "fechada" } }, { id: "gasFlow", type: "fluxo-de-gas", visible: true }),
    animations: [
      { type: "spring", target: "sensor.pop", startFrame: W("s10", 4), endFrame: W("s10", 4) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "sensor.cool", startFrame: W("s10", 10), endFrame: W("s10", 12) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "safetyValve.close", startFrame: W("s10", 13), endFrame: W("s10", 14) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "gas.leakShow", startFrame: W("s10", 13), endFrame: W("s10", 16), to: 0, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "SENSOR DE CALOR", subtitle: "em muitos fogões", variant: "positive", appearAt: W("s10", 4), disappearAt: W("s10", 10) }, { text: "FECHA O GÁS SOZINHO", variant: "positive", appearAt: W("s10", 13), disappearAt: end(9) - 6 }],
    highlights: ["SENSOR", "CALOR", "FECHA", "SOZINHO"],
    captions: [{ text: "Muitos fogões têm um sensor de calor perto da chama.", from: voLocal("s10"), to: W("s10", 10) }, { text: "Se ela apaga, ele fecha o gás sozinho.", from: W("s10", 10), to: end(9) }],
    audioCues: [narration("s10", "ready"), sfx("badge", W("s10", 4), 0.28), sfx("clunk", W("s10", 14), 0.22), sfx("badge", W("s10", 13), 0.28)],
  },
  {
    id: "scene-11-cheiro-do-gas",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "E tem mais: o gás de cozinha não tem cheiro. Por isso colocam um cheiro forte nele, pra você perceber um vazamento.",
    camera: { projection: "perspective", movement: "orbit", keys: [key(0, orbit([-0.1, 0.95, -0.5], 1.3, -42, 6)), key(W("s11", 3), P.cylinder, "soft"), key(end(10), orbit([1.1, 0.5, -0.9], 3.4, 30, 16), "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "cylinder", type: "botijao", visible: true, state: { start: "sem cheiro", end: "com odorizante" } }, { id: "smell", type: "ondas-de-cheiro", visible: true }),
    animations: [
      { type: "interpolate", target: "sensor.cool", startFrame: 0, endFrame: s(0.4), to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "safetyValve.close", startFrame: 0, endFrame: s(0.4), to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "cylinder.pop", startFrame: W("s11", 3), endFrame: W("s11", 3) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "noSmell.mark", startFrame: W("s11", 7), endFrame: W("s11", 7) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "smell.on", startFrame: W("s11", 13), endFrame: W("s11", 16) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "nose.pop", startFrame: W("s11", 19), endFrame: W("s11", 19) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
    ],
    badges: [{ text: "GÁS SEM CHEIRO", variant: "warning", appearAt: W("s11", 4), disappearAt: W("s11", 10) }, { text: "CHEIRO DE PROPÓSITO", subtitle: "pra você perceber um vazamento", variant: "positive", appearAt: W("s11", 12), disappearAt: end(10) - 6 }],
    highlights: ["CHEIRO", "FORTE", "PERCEBER", "VAZAMENTO"],
    captions: [{ text: "E tem mais: o gás de cozinha não tem cheiro.", from: voLocal("s11"), to: W("s11", 10) }, { text: "Por isso colocam um cheiro forte nele, pra você perceber um vazamento.", from: W("s11", 10), to: end(10) }],
    audioCues: [narration("s11", "ready"), sfx("badge", W("s11", 4), 0.26), sfx("badge", W("s11", 12), 0.28)],
  },
  {
    id: "scene-12-sopa-no-ponto",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Pronto: gás, ar e faísca, na medida certa. E a sopa fica no ponto!",
    camera: { projection: "perspective", movement: "dolly-out", keys: [key(0, orbit([1.1, 0.5, -0.9], 3.4, 30, 16)), key(W("s12", 1), P.stove, "soft"), key(W("s12", 9), P.wide, "soft"), key(end(11), P.final, "linear")] },
    objects: withBase({ id: "stove", type: "fogao-em-corte", visible: true }, { id: "pot", type: "panela-de-sopa", visible: true }, { id: "knob", type: "botao", visible: true }, { id: "flame", type: "chama", visible: true, state: { start: "azul", end: "azul" } }, { id: "cylinder", type: "botijao", visible: true }, { id: "finalLabels", type: "rotulos-3d", visible: true }),
    animations: [
      { type: "interpolate", target: "flame.size", startFrame: 0, endFrame: s(0.6), to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 1), endFrame: W("s12", 1) + 20, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 9), endFrame: W("s12", 9) + 10, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "waiter.serve", startFrame: W("s12", 10), endFrame: W("s12", 10) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "FOGÃO A GÁS", subtitle: "gás + ar + faísca", variant: "info", size: "large", appearAt: W("s12", 1), disappearAt: end(11) }],
    highlights: ["GÁS", "AR", "FAÍSCA", "SOPA", "PONTO"],
    captions: [{ text: "Pronto: gás, ar e faísca, na medida certa.", from: voLocal("s12"), to: W("s12", 8) }, { text: "E a sopa fica no ponto!", from: W("s12", 8), to: end(11) }],
    audioCues: [narration("s12", "ready"), sfx("badge-final", W("s12", 1), 0.32), sfx("ding", W("s12", 10), 0.26)],
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
