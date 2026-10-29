import { evaluateTrack, orbit, type EaseName, type TrackAnimation, type Vec3 } from "../utils/animation";
import { DURATION, FPS, HEIGHT, s, SCENE_FRAMES, voLocal, WIDTH, wordLocal, type VoKey } from "../utils/timing";

// Scene plan v1 (Fase 1) — "Pra onde vão os 10% da sua conta?" — AGUARDANDO APROVAÇÃO.
// Na Fase 2 este arquivo vira src/data/scenes.ts sem tradução. Configure utils/timing.ts com:
//   SECONDS = 90
//   VO_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "s11", "s12"]
//   PLANNED_SECONDS = [7, 7, 9, 8, 7, 7, 6, 8, 7, 8, 7, 9]   // soma 90 s = 2700 frames
//   GAPS = Array(11).fill(0.55)
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

export const VIDEO: VideoConfig = { width: WIDTH, height: HEIGHT, fps: FPS, durationInFrames: DURATION, theme: "low-poly-3d-restaurante", language: "pt-BR" };

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

// Layout do diorama (u3d): salão em x ∈ [-3.2, -0.2]; balcão do caixa/pote em x ≈ 0.4, z ≈ -0.8;
// cozinha em x ∈ [1.0, 3.4] atrás do meio-muro com janela de passagem; piso em y = 0.
const P = {
  wide: orbit([0.3, 1.0, 0], 24, 25, 22),
  tableFar: orbit([-1.6, 0.9, 0.6], 11, 28, 16),
  table: orbit([-1.6, 0.9, 0.6], 8, 14, 12),
  kitchen: orbit([2.2, 1.0, -0.4], 10, -15, 14),
  kitchenWide: orbit([0.6, 1.0, -0.2], 15, 0, 16),
  counter: orbit([0.4, 1.2, -0.6], 12, 10, 14),
  billClose: orbit([0.4, 1.25, -0.5], 5.5, 6, 10),
  jar: orbit([0.4, 1.3, -0.8], 8, 22, 12),
  register: orbit([0.4, 1.1, -0.8], 8, -8, 12),
  owner: orbit([0.4, 1.4, -1.0], 6, -4, 10),
  top: orbit([0.4, 0.4, 0.6], 16, 10, 40),
  topClose: orbit([0.4, 0.3, 0.6], 12, 25, 44),
  payslip: orbit([-1.0, 1.3, 0.2], 6, 20, 8),
  vault: orbit([-0.4, 0.6, -1.0], 10, -10, 26),
  customer: orbit([-1.8, 1.2, 0.9], 7, 30, 8),
  final: orbit([0.3, 1.0, 0], 28, 40, 24),
};

const BASE: SceneObject[] = [
  { id: "restaurant", type: "restaurante-em-corte", visible: true },
  { id: "table", type: "mesa", visible: true },
  { id: "customer", type: "cliente", visible: true },
  { id: "waiter", type: "garcom", visible: true },
  { id: "kitchen", type: "cozinha", visible: true },
  { id: "cook", type: "cozinheira", visible: true },
  { id: "dishwasher", type: "ajudante-pia", visible: true },
];
const withBase = (...extra: SceneObject[]) => [...BASE, ...extra];

export const scenes: ScenePlan[] = [
  {
    id: "scene-01-gancho-nota",
    startFrame: sc(0).from,
    durationInFrames: sc(0).durationInFrames,
    voKey: "s1",
    narration: "Você adorou o atendimento e quer agradecer. Parece que basta deixar uma nota na mesa pro garçom.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, P.tableFar), key(W("s1", 12), P.table, "soft"), key(end(0), orbit([-1.6, 0.9, 0.6], 8, 14, 12), "soft")],
    },
    objects: withBase({ id: "tipNote", type: "cedula", visible: true, state: { start: "na carteira", end: "na mesa" } }),
    animations: [
      { type: "spring", target: "restaurant.reveal", startFrame: 0, endFrame: 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "tipNote.place", startFrame: W("s1", 12) - 4, endFrame: W("s1", 12) + 14, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "waiter.wave", startFrame: W("s1", 16), endFrame: W("s1", 16) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
    ],
    badges: [{ text: "COMO AGRADECER?", variant: "warning", icon: "?", appearAt: W("s1", 5), disappearAt: end(0) - 6 }],
    highlights: ["AGRADECER", "NOTA", "GARÇOM"],
    captions: [
      { text: "Você adorou o atendimento e quer agradecer.", from: voLocal("s1"), to: W("s1", 7) },
      { text: "Parece que basta deixar uma nota na mesa pro garçom.", from: W("s1", 7), to: end(0) },
    ],
    audioCues: [narration("s1", "planned"), sfx("whoosh-soft", 0, 0.3), sfx("paper", W("s1", 12), 0.3), sfx("badge", W("s1", 5), 0.28)],
  },
  {
    id: "scene-02-cozinha-sem-nada",
    startFrame: sc(1).from,
    durationInFrames: sc(1).durationInFrames,
    voKey: "s2",
    narration: "Só que o garçom não fez seu prato. Na cozinha, mais gente trabalhou, e não viu nada.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [key(0, P.table), key(W("s2", 9), P.kitchen, "soft"), key(end(1), P.kitchenWide, "soft")],
    },
    objects: withBase(
      { id: "tipNote", type: "cedula", visible: true },
      { id: "tipArrow", type: "seta-tracejada", visible: true, state: { start: "oculta", end: "nota → garçom" } },
    ),
    animations: [
      { type: "interpolate", target: "kitchen.highlight", startFrame: W("s2", 9), endFrame: W("s2", 9) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "tipArrow.draw", startFrame: W("s2", 13), endFrame: W("s2", 13) + 12, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "kitchen.dim", startFrame: W("s2", 16), endFrame: W("s2", 16) + 10, from: 0, to: 0.35, easing: "inOut", unit: "0-1" },
    ],
    badges: [{ text: "SÓ O GARÇOM RECEBE", variant: "negative", appearAt: W("s2", 13), disappearAt: end(1) - 4 }],
    highlights: ["PRATO", "COZINHA", "NADA"],
    captions: [
      { text: "Só que o garçom não fez seu prato.", from: voLocal("s2"), to: W("s2", 8) },
      { text: "Na cozinha, mais gente trabalhou, e não viu nada.", from: W("s2", 8), to: end(1) },
    ],
    audioCues: [narration("s2", "planned"), sfx("whoosh-soft", 0, 0.22), sfx("badge-neg", W("s2", 13), 0.28)],
  },
  {
    id: "scene-03-taxa-de-servico",
    startFrame: sc(2).from,
    durationInFrames: sc(2).durationInFrames,
    voKey: "s3",
    narration: "Por isso, muitos restaurantes põem um valor extra na conta, que vai pra um pote só. É a taxa de serviço.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, P.kitchenWide), key(s(0.8), P.counter, "soft"), key(W("s3", 9), P.billClose, "soft"), key(W("s3", 13), P.jar, "soft"), key(end(2), orbit([0.4, 1.3, -0.8], 8, 34, 12), "linear")],
    },
    objects: withBase(
      { id: "tipNote", type: "cedula", visible: false },
      { id: "bill", type: "conta-impressa", visible: true, state: { start: "inexistente", end: "com linha SERVIÇO" } },
      { id: "tipJar", type: "pote-gorjeta", visible: true, state: { start: "inexistente", end: "40% cheio" } },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "kitchen.dim", startFrame: 0, endFrame: 12, from: 0.35, to: 0, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "bill.print", startFrame: W("s3", 7), endFrame: W("s3", 9) + 6, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "bill.serviceLine", startFrame: W("s3", 9), endFrame: W("s3", 9) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "coins.flow", startFrame: W("s3", 11), endFrame: W("s3", 15), from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "tipJar.drop", startFrame: W("s3", 14) - 6, endFrame: W("s3", 14) + 24, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "tipJar.fill", startFrame: W("s3", 14), endFrame: W("s3", 16), from: 0, to: 0.4, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "POTE ÚNICO", variant: "positive", appearAt: W("s3", 14), disappearAt: W("s3", 16) - 2 },
      { text: "TAXA DE SERVIÇO", subtitle: "gorjeta cobrada na conta", variant: "info", appearAt: W("s3", 18), disappearAt: end(2) - 6 },
    ],
    highlights: ["CONTA", "POTE", "TAXA", "SERVIÇO"],
    captions: [
      { text: "Por isso, muitos restaurantes põem um valor extra na conta,", from: voLocal("s3"), to: W("s3", 10) },
      { text: "que vai pra um pote só. É a taxa de serviço.", from: W("s3", 10), to: end(2) },
    ],
    audioCues: [narration("s3", "planned"), sfx("printer", W("s3", 7), 0.22), sfx("coins", W("s3", 11), 0.3), sfx("badge", W("s3", 14), 0.28), sfx("badge", W("s3", 18), 0.28)],
  },
  {
    id: "scene-04-por-que-10",
    startFrame: sc(3).from,
    durationInFrames: sc(3).durationInFrames,
    voKey: "s4",
    narration: "Por que dez por cento? Não é número da lei, é costume. A casa pode cobrar outro, desde que avise.",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, orbit([0.4, 1.3, -0.8], 8, 34, 12)), key(s(0.6), P.billClose, "soft"), key(W("s4", 11), orbit([0.2, 1.6, -1.0], 9, 12, 10), "soft"), key(end(3), orbit([0.2, 1.6, -1.0], 9, 18, 10), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true },
      { id: "tipJar", type: "pote-gorjeta", visible: true },
      { id: "percentDial", type: "contador-percentual", visible: true, state: { start: "10%", end: "10%" } },
      { id: "noticeBoard", type: "placa-aviso", visible: true, state: { start: "oculta", end: "TAXA DE SERVIÇO: X%" } },
    ),
    animations: [
      { type: "spring", target: "law.stamp", startFrame: W("s4", 7), endFrame: W("s4", 7) + 20, from: 0, to: 1, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "law.stamp", startFrame: W("s4", 10), endFrame: W("s4", 10) + 8, to: 0, easing: "in", unit: "0-1" },
      { type: "interpolate", target: "percentDial.value", startFrame: W("s4", 14), endFrame: W("s4", 16), from: 10, to: 12, easing: "inOut" },
      { type: "interpolate", target: "percentDial.value", startFrame: W("s4", 16) + 6, endFrame: W("s4", 16) + 18, to: 10, easing: "inOut" },
      { type: "spring", target: "noticeBoard.reveal", startFrame: W("s4", 17), endFrame: W("s4", 17) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [
      { text: "POR QUE 10%?", variant: "warning", icon: "?", appearAt: W("s4", 0), disappearAt: W("s4", 5) },
      { text: "É COSTUME", variant: "info", appearAt: W("s4", 10), disappearAt: W("s4", 17) },
      { text: "PRECISA AVISAR", variant: "positive", appearAt: W("s4", 18), disappearAt: end(3) - 6 },
    ],
    highlights: ["DEZ", "COSTUME", "AVISE"],
    captions: [
      { text: "Por que dez por cento?", from: voLocal("s4"), to: W("s4", 5) },
      { text: "Não é número da lei, é costume.", from: W("s4", 5), to: W("s4", 12) },
      { text: "A casa pode cobrar outro, desde que avise.", from: W("s4", 12), to: end(3) },
    ],
    audioCues: [narration("s4", "planned"), sfx("tick", W("s4", 14), 0.2), sfx("badge", W("s4", 18), 0.28)],
  },
  {
    id: "scene-05-caixa-misturado",
    startFrame: sc(4).from,
    durationInFrames: sc(4).durationInFrames,
    voKey: "s5",
    narration: "Mas esse dinheiro entra no caixa, junto com o da comida. O dono pode ficar com ele?",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, orbit([0.2, 1.6, -1.0], 9, 18, 10)), key(s(0.7), P.register, "soft"), key(W("s5", 12), P.owner, "soft"), key(end(4), orbit([0.4, 1.4, -1.0], 6, 2, 10), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true },
      { id: "tipJar", type: "pote-gorjeta", visible: true, state: { start: "40% cheio", end: "vazio" } },
      { id: "register", type: "caixa-registradora", visible: true, state: { start: "fechado", end: "misturado" } },
      { id: "owner", type: "dono", visible: true, state: { start: "fora de cena", end: "mão na gaveta" } },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "interpolate", target: "register.drawer", startFrame: W("s5", 3) - 6, endFrame: W("s5", 3), from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "register.mix", startFrame: W("s5", 3), endFrame: W("s5", 10), from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "tipJar.fill", startFrame: W("s5", 3), endFrame: W("s5", 10), to: 0, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "register.drawer", startFrame: W("s5", 10), endFrame: W("s5", 10) + 6, to: 0, easing: "in", unit: "0-1" },
      { type: "spring", target: "owner.enter", startFrame: W("s5", 12), endFrame: W("s5", 12) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "owner.reach", startFrame: W("s5", 14), endFrame: W("s5", 16) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "DINHEIRO MISTURADO", variant: "negative", appearAt: W("s5", 5), disappearAt: W("s5", 11) },
      { text: "É DO DONO?", variant: "warning", icon: "?", appearAt: W("s5", 12), disappearAt: end(4) - 4 },
    ],
    highlights: ["CAIXA", "COMIDA", "DONO"],
    captions: [
      { text: "Mas esse dinheiro entra no caixa,", from: voLocal("s5"), to: W("s5", 6) },
      { text: "junto com o da comida.", from: W("s5", 6), to: W("s5", 11) },
      { text: "O dono pode ficar com ele?", from: W("s5", 11), to: end(4) },
    ],
    audioCues: [narration("s5", "planned"), sfx("coins", W("s5", 3), 0.28), sfx("ka-ching", W("s5", 10), 0.3), sfx("badge-neg", W("s5", 5), 0.28)],
  },
  {
    id: "scene-06-gorjeta-dos-funcionarios",
    startFrame: sc(5).from,
    durationInFrames: sc(5).durationInFrames,
    voKey: "s6",
    narration: "Não. Pela lei, a gorjeta é dos funcionários. Por isso, a taxa aparece separada na conta.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, orbit([0.4, 1.4, -1.0], 6, 2, 10)), key(W("s6", 3), P.register, "soft"), key(W("s6", 11), P.billClose, "soft"), key(end(5), orbit([0.4, 1.25, -0.5], 5.5, 14, 10), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true },
      { id: "tipJar", type: "pote-gorjeta", visible: true },
      { id: "register", type: "caixa-registradora", visible: true, state: { start: "misturado", end: "CASA | GORJETA" } },
      { id: "owner", type: "dono", visible: true, state: { start: "mão na gaveta", end: "recua" } },
      { id: "lawIcon", type: "icone-balanca", visible: true },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "spring", target: "owner.reach", startFrame: W("s6", 0), endFrame: W("s6", 0) + 30, to: 0, damping: 9, unit: "0-1" },
      { type: "interpolate", target: "camera.shake", startFrame: W("s6", 0), endFrame: W("s6", 0) + 4, from: 1, to: 0, easing: "out", unit: "0-1" },
      { type: "spring", target: "lawIcon.pop", startFrame: W("s6", 1), endFrame: W("s6", 1) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "register.split", startFrame: W("s6", 4), endFrame: W("s6", 7) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "coins.sort", startFrame: W("s6", 5), endFrame: W("s6", 8) + 10, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "bill.serviceGlow", startFrame: W("s6", 12), endFrame: W("s6", 12) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
    ],
    badges: [
      { text: "GORJETA É DOS FUNCIONÁRIOS", variant: "positive", appearAt: W("s6", 4), disappearAt: W("s6", 11) },
      { text: "SEPARADA NA CONTA", variant: "positive", appearAt: W("s6", 12), disappearAt: end(5) - 6 },
    ],
    highlights: ["LEI", "GORJETA", "FUNCIONÁRIOS", "SEPARADA"],
    captions: [
      { text: "Não. Pela lei, a gorjeta é dos funcionários.", from: voLocal("s6"), to: W("s6", 8) },
      { text: "Por isso, a taxa aparece separada na conta.", from: W("s6", 8), to: end(5) },
    ],
    audioCues: [narration("s6", "planned"), sfx("thud", W("s6", 0), 0.26), sfx("coins", W("s6", 5), 0.28), sfx("badge", W("s6", 4), 0.28), sfx("badge", W("s6", 12), 0.28)],
  },
  {
    id: "scene-07-quem-leva-quanto",
    startFrame: sc(6).from,
    durationInFrames: sc(6).durationInFrames,
    voKey: "s7",
    narration: "Só que dividir não é simples. Garçom, cozinheiro, ajudante... quem leva quanto?",
    camera: {
      projection: "perspective",
      movement: "vertical",
      keys: [key(0, orbit([0.4, 1.25, -0.5], 5.5, 14, 10)), key(s(1.0), P.top, "soft"), key(end(6), orbit([0.4, 0.4, 0.6], 15, 14, 40), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true },
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "spotlight", type: "holofotes", visible: true },
      { id: "tipStack", type: "pilha-moedas", visible: true, state: { start: "inteira", end: "inteira, balançando" } },
    ),
    animations: [
      { type: "spring", target: "tipStack.drop", startFrame: s(0.6), endFrame: s(0.6) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "spot.waiter", startFrame: W("s7", 6), endFrame: W("s7", 6) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "spot.cook", startFrame: W("s7", 7), endFrame: W("s7", 7) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "spot.dishwasher", startFrame: W("s7", 8), endFrame: W("s7", 8) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "questionMarks", startFrame: W("s7", 10), endFrame: W("s7", 10) + 30, from: 0, to: 1, damping: 9, unit: "0-1" },
    ],
    badges: [{ text: "QUEM LEVA QUANTO?", variant: "warning", icon: "?", appearAt: W("s7", 9), disappearAt: end(6) - 4 }],
    highlights: ["DIVIDIR", "GARÇOM", "COZINHEIRO", "AJUDANTE"],
    captions: [
      { text: "Só que dividir não é simples.", from: voLocal("s7"), to: W("s7", 6) },
      { text: "Garçom, cozinheiro, ajudante... quem leva quanto?", from: W("s7", 6), to: end(6) },
    ],
    audioCues: [narration("s7", "planned"), sfx("whoosh-soft", 0, 0.22), sfx("spot", W("s7", 6), 0.2), sfx("spot", W("s7", 7), 0.2), sfx("spot", W("s7", 8), 0.2), sfx("badge", W("s7", 9), 0.28)],
  },
  {
    id: "scene-08-rateio",
    startFrame: sc(7).from,
    durationInFrames: sc(7).durationInFrames,
    voKey: "s8",
    narration: "As regras são combinadas com os trabalhadores, em acordo com o sindicato. Essa divisão se chama rateio.",
    camera: {
      projection: "perspective",
      movement: "orbit",
      keys: [key(0, orbit([0.4, 0.4, 0.6], 15, 14, 40)), key(W("s8", 12), P.topClose, "soft"), key(end(7), orbit([0.4, 0.3, 0.6], 12, 40, 44), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true },
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "spotlight", type: "holofotes", visible: true },
      { id: "tipStack", type: "pilha-moedas", visible: true, state: { start: "inteira", end: "vira disco" } },
      { id: "rulesBoard", type: "prancheta-regras", visible: true },
      { id: "handshake", type: "icone-aperto-de-mao", visible: true },
      { id: "splitDisc", type: "disco-rateio-sem-numeros", visible: true, state: { start: "inexistente", end: "fatiado" } },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "spring", target: "rulesBoard.drop", startFrame: W("s8", 1), endFrame: W("s8", 1) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "spring", target: "handshake.pop", startFrame: W("s8", 11), endFrame: W("s8", 11) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "splitDisc.form", startFrame: W("s8", 13), endFrame: W("s8", 16) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "splitDisc.slices", startFrame: W("s8", 14), endFrame: W("s8", 16) + 14, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "coins.toStaff", startFrame: W("s8", 16), endFrame: end(7) - 10, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "ACORDO COLETIVO", variant: "info", appearAt: W("s8", 8), disappearAt: W("s8", 12) },
      { text: "RATEIO", subtitle: "critério de divisão", variant: "positive", appearAt: W("s8", 16), disappearAt: end(7) - 6 },
    ],
    highlights: ["REGRAS", "TRABALHADORES", "SINDICATO", "RATEIO"],
    captions: [
      { text: "As regras são combinadas com os trabalhadores,", from: voLocal("s8"), to: W("s8", 7) },
      { text: "em acordo com o sindicato.", from: W("s8", 7), to: W("s8", 12) },
      { text: "Essa divisão se chama rateio.", from: W("s8", 12), to: end(7) },
    ],
    audioCues: [narration("s8", "planned"), sfx("paper", W("s8", 1), 0.22), sfx("badge", W("s8", 8), 0.26), sfx("coins", W("s8", 16), 0.3), sfx("badge", W("s8", 16), 0.28)],
  },
  {
    id: "scene-09-encargos",
    startFrame: sc(8).from,
    durationInFrames: sc(8).durationInFrames,
    voKey: "s9",
    narration: "E tem mais: a gorjeta entra na remuneração, então gera encargos, como INSS e FGTS.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, orbit([0.4, 0.3, 0.6], 12, 40, 44)), key(s(0.8), P.payslip, "soft"), key(end(8), orbit([-1.0, 1.3, 0.2], 5.5, 26, 8), "linear")],
    },
    objects: withBase(
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "splitDisc", type: "disco-rateio-sem-numeros", visible: true },
      { id: "payslip", type: "holerite", visible: true, state: { start: "no bolso", end: "SALÁRIO + GORJETA" } },
      { id: "chargeTags", type: "etiquetas-INSS-FGTS", visible: true },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "spring", target: "payslip.rise", startFrame: W("s9", 3), endFrame: W("s9", 3) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "payslip.tipLine", startFrame: W("s9", 5), endFrame: W("s9", 7) + 6, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "chargeTags.inss", startFrame: W("s9", 12), endFrame: W("s9", 12) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "spring", target: "chargeTags.fgts", startFrame: W("s9", 14), endFrame: W("s9", 14) + 30, from: 0, to: 1, damping: 10, unit: "0-1" },
      { type: "interpolate", target: "coins.leak", startFrame: W("s9", 10), endFrame: end(8) - 8, from: 0, to: 1, easing: "linear", unit: "0-1" },
    ],
    badges: [
      { text: "REMUNERAÇÃO", variant: "info", appearAt: W("s9", 5), disappearAt: W("s9", 9) },
      { text: "ENCARGOS", subtitle: "INSS e FGTS", variant: "negative", appearAt: W("s9", 10), disappearAt: end(8) - 4 },
    ],
    highlights: ["REMUNERAÇÃO", "ENCARGOS", "INSS", "FGTS"],
    captions: [
      { text: "E tem mais: a gorjeta entra na remuneração,", from: voLocal("s9"), to: W("s9", 8) },
      { text: "então gera encargos, como INSS e FGTS.", from: W("s9", 8), to: end(8) },
    ],
    audioCues: [narration("s9", "planned"), sfx("paper", W("s9", 3), 0.22), sfx("badge", W("s9", 5), 0.26), sfx("badge-neg", W("s9", 10), 0.28)],
  },
  {
    id: "scene-10-retencao",
    startFrame: sc(9).from,
    durationInFrames: sc(9).durationInFrames,
    voKey: "s10",
    narration: "Por isso, o acordo pode prever que uma parte fique retida pra pagar esses encargos. O resto vai pra equipe.",
    camera: {
      projection: "perspective",
      movement: "tracking",
      keys: [key(0, orbit([-1.0, 1.3, 0.2], 5.5, 26, 8)), key(s(0.8), P.topClose, "soft"), key(W("s10", 10), P.vault, "soft"), key(end(9), orbit([0.3, 0.8, 0.2], 18, 20, 32), "soft")],
    },
    objects: withBase(
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "splitDisc", type: "disco-rateio-sem-numeros", visible: true, state: { start: "fatiado", end: "fatia pequena no cofre" } },
      { id: "chargeVault", type: "cofre-encargos", visible: true, state: { start: "inexistente", end: "trancado" } },
      { id: "payslip", type: "holerite", visible: false },
      { id: "coins", type: "particulas-moedas", visible: true },
    ),
    animations: [
      { type: "spring", target: "chargeVault.pop", startFrame: W("s10", 10), endFrame: W("s10", 10) + 30, from: 0, to: 1, damping: 11, unit: "0-1" },
      { type: "interpolate", target: "splitDisc.retain", startFrame: W("s10", 8), endFrame: W("s10", 10) + 12, from: 0, to: 1, easing: "inOut", unit: "0-1" },
      { type: "interpolate", target: "chargeVault.lock", startFrame: W("s10", 14), endFrame: W("s10", 14) + 8, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "coins.toStaff", startFrame: W("s10", 15), endFrame: end(9) - 12, from: 0, to: 1, easing: "linear", unit: "0-1" },
      { type: "spring", target: "staff.pocket", startFrame: W("s10", 17), endFrame: W("s10", 17) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
    ],
    badges: [
      { text: "PARTE RETIDA", subtitle: "se o acordo prever", variant: "info", appearAt: W("s10", 8), disappearAt: W("s10", 14) },
      { text: "RESTO PRA EQUIPE", variant: "positive", appearAt: W("s10", 15), disappearAt: end(9) - 6 },
    ],
    highlights: ["ACORDO", "RETIDA", "ENCARGOS", "EQUIPE"],
    captions: [
      { text: "Por isso, o acordo pode prever", from: voLocal("s10"), to: W("s10", 6) },
      { text: "que uma parte fique retida pra pagar esses encargos.", from: W("s10", 6), to: W("s10", 15) },
      { text: "O resto vai pra equipe.", from: W("s10", 15), to: end(9) },
    ],
    audioCues: [narration("s10", "planned"), sfx("whoosh-soft", W("s10", 8), 0.22), sfx("clunk", W("s10", 14), 0.3), sfx("coins", W("s10", 15), 0.3), sfx("badge", W("s10", 15), 0.28)],
  },
  {
    id: "scene-11-opcional",
    startFrame: sc(10).from,
    durationInFrames: sc(10).durationInFrames,
    voKey: "s11",
    narration: "E você, cliente, é obrigado a pagar? Não: a taxa é opcional, e você pode pedir pra tirar.",
    camera: {
      projection: "perspective",
      movement: "dolly-in",
      keys: [key(0, orbit([0.3, 0.8, 0.2], 18, 20, 32)), key(s(0.9), P.customer, "soft"), key(W("s11", 11), orbit([-1.7, 1.1, 0.8], 5, 22, 10), "soft"), key(end(10), orbit([-1.7, 1.1, 0.8], 5, 16, 10), "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true, state: { start: "R$ 100 + R$ 10 (ilustrativo)", end: "SERVIÇO riscado" } },
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "splitDisc", type: "disco-rateio-sem-numeros", visible: true },
      { id: "chargeVault", type: "cofre-encargos", visible: true },
    ),
    animations: [
      { type: "spring", target: "customer.lookUp", startFrame: W("s11", 1), endFrame: W("s11", 1) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "bill.toggle", startFrame: W("s11", 11), endFrame: W("s11", 11) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "bill.serviceOff", startFrame: W("s11", 17), endFrame: W("s11", 17) + 10, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "bill.total", startFrame: W("s11", 17), endFrame: W("s11", 17) + 10, from: 110, to: 100, easing: "out" },
    ],
    badges: [
      { text: "SOU OBRIGADO?", variant: "warning", icon: "?", appearAt: W("s11", 1), disappearAt: W("s11", 7) },
      { text: "OPCIONAL", subtitle: "o restaurante deve informar", variant: "positive", appearAt: W("s11", 7), disappearAt: end(10) - 6 },
    ],
    highlights: ["CLIENTE", "OBRIGADO", "OPCIONAL", "TIRAR"],
    captions: [
      { text: "E você, cliente, é obrigado a pagar?", from: voLocal("s11"), to: W("s11", 7) },
      { text: "Não: a taxa é opcional,", from: W("s11", 7), to: W("s11", 12) },
      { text: "e você pode pedir pra tirar.", from: W("s11", 12), to: end(10) },
    ],
    audioCues: [narration("s11", "planned"), sfx("whoosh-soft", 0, 0.22), sfx("badge", W("s11", 7), 0.28), sfx("click", W("s11", 17), 0.3)],
  },
  {
    id: "scene-12-sistema-completo",
    startFrame: sc(11).from,
    durationInFrames: sc(11).durationInFrames,
    voKey: "s12",
    narration: "Mas, quando paga, ela chega no salão e na cozinha. Pronto: agora você sabe pra onde vão os dez por cento!",
    camera: {
      projection: "perspective",
      movement: "dolly-out",
      keys: [key(0, orbit([-1.7, 1.1, 0.8], 5, 16, 10)), key(W("s12", 3), P.wide, "soft"), key(end(11), P.final, "linear")],
    },
    objects: withBase(
      { id: "bill", type: "conta-impressa", visible: true, state: { start: "SERVIÇO riscado", end: "SERVIÇO pago" } },
      { id: "tipJar", type: "pote-gorjeta", visible: true },
      { id: "register", type: "caixa-registradora", visible: true },
      { id: "splitDisc", type: "disco-rateio-sem-numeros", visible: true },
      { id: "chargeVault", type: "cofre-encargos", visible: true },
      { id: "coins", type: "particulas-moedas", visible: true, state: { start: "parado", end: "fluxo completo em loop" } },
      { id: "finalLabels", type: "rotulos-3d", visible: true },
    ),
    animations: [
      { type: "spring", target: "bill.serviceOff", startFrame: W("s12", 2), endFrame: W("s12", 2) + 30, to: 0, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "bill.total", startFrame: W("s12", 2), endFrame: W("s12", 2) + 10, to: 110, easing: "out" },
      { type: "interpolate", target: "coins.loop", startFrame: W("s12", 3), endFrame: W("s12", 3) + 15, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "spring", target: "staff.glowHall", startFrame: W("s12", 6), endFrame: W("s12", 6) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "spring", target: "staff.glowKitchen", startFrame: W("s12", 9), endFrame: W("s12", 9) + 30, from: 0, to: 1, damping: 12, unit: "0-1" },
      { type: "interpolate", target: "final.labels", startFrame: W("s12", 10), endFrame: W("s12", 10) + 25, from: 0, to: 1, easing: "out", unit: "0-1" },
      { type: "interpolate", target: "fade", startFrame: end(11) - 20, endFrame: end(11), from: 0, to: 1, easing: "in", unit: "0-1" },
    ],
    badges: [{ text: "TAXA DE SERVIÇO", subtitle: "pra onde vão os 10%", variant: "info", size: "large", appearAt: W("s12", 10), disappearAt: end(11) }],
    highlights: ["SALÃO", "COZINHA", "PRONTO", "DEZ"],
    captions: [
      { text: "Mas, quando paga, ela chega no salão e na cozinha.", from: voLocal("s12"), to: W("s12", 10) },
      { text: "Pronto: agora você sabe pra onde vão os dez por cento!", from: W("s12", 10), to: end(11) },
    ],
    audioCues: [narration("s12", "planned"), sfx("click", W("s12", 2), 0.3), sfx("coins", W("s12", 3), 0.3), sfx("badge-final", W("s12", 10), 0.32)],
  },
];

/** Valor de uma trilha de animação (ex.: "coins.flow") no frame global. */
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
