import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0; parede do fundo em z = −1,6.
// Balcão à esquerda; geladeira translúcida no centro; compressor e condensador entre a geladeira e a parede.

export const ROOM = { x0: -2.7, x1: 2.1, z0: -1.6, z1: 1.2, wallH: 2.8 } as const;

export const FRIDGE = { x: 0.4, z: -0.55, w: 1.1, d: 0.9, h: 2.2, freezerY: 1.55 } as const;

export const SPOT = {
  counter: [-1.45, 0, -0.65] as Vec3,
  waiter: [-2.2, 0, 0.3] as Vec3,
  juiceStart: [-1.85, 1.0, -0.55] as Vec3,
  box: [-1.5, 1.0, -0.55] as Vec3,
  cup: [-1.0, 1.0, -0.72] as Vec3,
  shelf: [0.4, 1.02, -0.5] as Vec3,
  serve: [-1.88, 1.08, 0.52] as Vec3,
  compressor: [0.4, 0.0, -1.27] as Vec3,
  thermoCounter: [-1.12, 1.0, -0.36] as Vec3,
  thermoFridge: [0.05, 1.25, -0.25] as Vec3,
  thermostat: [0.4, 1.47, -0.16] as Vec3,
  gauge: [1.1, 1.88, -1.1] as Vec3,
  fluidThermo: [1.1, 1.62, -1.12] as Vec3,
} as const;

// ---------------------------------------------------------------- circuito do refrigerante
export type Segment = "evap" | "suction" | "compressor" | "discharge" | "condenser" | "capillary";

const EVAP_Z = -0.86;
const COND_Z = -1.07;
const SUCT_Z = -1.17;

const evap: Vec3[] = [];
[2.04, 1.94, 1.84, 1.74, 1.64].forEach((y, i) => {
  const xs = i % 2 === 0 ? [0.86, -0.06] : [-0.06, 0.86];
  evap.push([xs[0], y, EVAP_Z], [xs[1], y, EVAP_Z]);
});

const suction: Vec3[] = [
  [-0.06, 1.64, -0.98],
  [-0.08, 1.64, SUCT_Z],
  [-0.08, 0.42, SUCT_Z],
  [0.2, 0.3, -1.27],
];

const compressor: Vec3[] = [
  [0.28, 0.3, -1.27],
  [0.52, 0.3, -1.27],
];

const discharge: Vec3[] = [
  [0.6, 0.32, -1.27],
  [0.9, 0.42, -1.2],
  [0.9, 0.55, COND_Z],
];

const condenser: Vec3[] = [];
for (let i = 0; i < 10; i++) {
  const y = 0.6 + i * 0.15;
  const xs = i % 2 === 0 ? [0.88, 0.04] : [0.04, 0.88];
  condenser.push([xs[0], y, COND_Z], [xs[1], y, COND_Z]);
}

const capillary: Vec3[] = [[1.02, 1.95, -1.03]];
const turns = 7;
for (let k = 0; k <= turns * 8; k++) {
  const a = (k / 8) * Math.PI * 2;
  const y = 1.9 - (k / (turns * 8)) * 0.6;
  capillary.push([1.04 + 0.055 * Math.cos(a), y, -1.0 + 0.055 * Math.sin(a)]);
}
capillary.push([1.04, 1.25, -0.92], [1.04, 2.02, -0.92], [0.98, 2.02, EVAP_Z], [0.86, 2.02, EVAP_Z]);

export const CIRCUIT: { seg: Segment; pts: Vec3[] }[] = [
  { seg: "evap", pts: evap },
  { seg: "suction", pts: suction },
  { seg: "compressor", pts: compressor },
  { seg: "discharge", pts: discharge },
  { seg: "condenser", pts: condenser },
  { seg: "capillary", pts: capillary },
];

/** Polilinha fechada com comprimento acumulado, para posicionar partículas por fração 0→1. */
const flat = CIRCUIT.flatMap((c) => c.pts.map((p) => ({ p, seg: c.seg })));
const cum: number[] = [0];
for (let i = 1; i <= flat.length; i++) {
  const a = flat[i - 1].p;
  const b = flat[i % flat.length].p;
  cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
}
export const LOOP_LENGTH = cum[cum.length - 1];

const segRange = new Map<Segment, [number, number]>();
flat.forEach((f, i) => {
  const r = segRange.get(f.seg);
  const u0 = cum[i] / LOOP_LENGTH;
  const u1 = cum[i + 1] / LOOP_LENGTH;
  segRange.set(f.seg, r ? [Math.min(r[0], u0), Math.max(r[1], u1)] : [u0, u1]);
});

/** Ponto do circuito na fração u (0→1), o trecho e a fração dentro do trecho. */
export const circuitAt = (u: number): { p: Vec3; seg: Segment; t: number } => {
  const d = (((u % 1) + 1) % 1) * LOOP_LENGTH;
  let i = 0;
  while (i < flat.length - 1 && cum[i + 1] < d) i++;
  const a = flat[i].p;
  const b = flat[(i + 1) % flat.length].p;
  const k = (d - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i]);
  const seg = flat[i].seg;
  const [r0, r1] = segRange.get(seg)!;
  return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], seg, t: (d / LOOP_LENGTH - r0) / Math.max(1e-6, r1 - r0) };
};
