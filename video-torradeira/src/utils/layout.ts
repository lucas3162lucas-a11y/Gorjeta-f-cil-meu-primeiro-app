import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0; parede do fundo em z = −1,6.
// Fogão com frigideira à esquerda; torradeira em corte no balcão do centro; garçom à esquerda.

export const ROOM = { x0: -2.7, x1: 2.1, z0: -1.6, z1: 1.2, wallH: 2.8 } as const;

/** Torradeira: base sobre o balcão (y = 1,0). Duas fendas ao longo de z, em x = SLOTS[i]. */
export const TOASTER = { x: 0.2, y: 1.0, z: -0.75, w: 0.36, h: 0.24, d: 0.22 } as const;
export const SLOTS = [0.14, 0.26] as const;

export const SPOT = {
  counter: [0.2, 0, -0.8] as Vec3,
  stove: [-1.2, 0, -0.72] as Vec3,
  pan: [-1.2, 0.95, -0.6] as Vec3,
  waiter: [-1.95, 0, 0.3] as Vec3,
  knob: [0.33, 1.08, -0.635] as Vec3,
  lever: [0.395, 1.0, -0.75] as Vec3,
  magnet: [0.33, 1.04, -0.75] as Vec3,
  spring: [0.33, 1.06, -0.83] as Vec3,
  badWire: [0.2, 1.1, -0.58] as Vec3,
  plug: [0.55, 1.12, -0.85] as Vec3,
  serve: [-1.72, 1.1, 0.48] as Vec3,
} as const;
