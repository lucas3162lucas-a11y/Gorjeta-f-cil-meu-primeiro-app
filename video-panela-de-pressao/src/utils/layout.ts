import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0; parede do fundo em z = −1,6.
// Fogão no centro com a panela de pressão sobre a boca da frente; balcão à esquerda; garçom à esquerda.

export const ROOM = { x0: -2.7, x1: 2.1, z0: -1.6, z1: 1.2, wallH: 2.8 } as const;

/** Panela: base sobre o fogão. Raio interno, altura do corpo e posição. */
export const POT = { x: 0, y: 0.93, z: -0.65, r: 0.22, h: 0.3 } as const;
export const POT_TOP = POT.y + POT.h;

export const SPOT = {
  counter: [-1.6, 0, -0.75] as Vec3,
  stove: [0, 0, -0.72] as Vec3,
  waiter: [-1.05, 0, 0.35] as Vec3,
  hand: [-0.8, 1.15, 0.2] as Vec3,
  valve: [POT.x, POT_TOP + 0.07, POT.z] as Vec3,
  safety: [POT.x + 0.13, POT_TOP + 0.045, POT.z + 0.04] as Vec3,
  thermo: [POT.x + 0.27, POT.y, POT.z + 0.27] as Vec3,
  gauge: [POT.x + 0.24, POT_TOP + 0.2, POT.z + 0.02] as Vec3,
  serve: [-0.82, 1.1, 0.5] as Vec3,
} as const;
