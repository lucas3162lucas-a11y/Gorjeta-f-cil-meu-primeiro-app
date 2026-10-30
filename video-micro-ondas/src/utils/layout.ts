import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0; parede do fundo em z = −1,6.
// Fogão à esquerda; balcão no centro com o micro-ondas translúcido; garçom na ponta esquerda.

export const ROOM = { x0: -2.7, x1: 2.1, z0: -1.6, z1: 1.2, wallH: 2.8 } as const;

/** Micro-ondas: base sobre o balcão (y = 1,0). Cavidade à esquerda, compartimento do magnetron à direita. */
export const MW = { x: 0.3, y: 1.0, z: -0.8, w: 0.9, h: 0.55, d: 0.6, cavX0: -0.12, cavX1: 0.5, frontZ: -0.5 } as const;

export const SPOT = {
  counter: [0.3, 0, -0.8] as Vec3,
  stove: [-1.6, 0, -0.75] as Vec3,
  waiter: [-2.0, 0, 0.55] as Vec3,
  hand: [-1.75, 1.05, 0.65] as Vec3,
  pot: [-1.6, 0.95, -0.7] as Vec3,
  demo: [-0.9, 1.1, -0.4] as Vec3,
  molecules: [-0.9, 1.25, -0.4] as Vec3,
  plate: [0.19, 1.04, -0.8] as Vec3,
  magnetron: [0.635, 1.27, -0.8] as Vec3,
  waveguideTop: 1.5,
  plug: [1.0, 0.35, -1.58] as Vec3,
  serve: [-1.7, 1.08, 0.75] as Vec3,
} as const;

export const CAVITY_CENTER: Vec3 = [(MW.cavX0 + MW.cavX1) / 2, MW.y + 0.27, MW.z];
