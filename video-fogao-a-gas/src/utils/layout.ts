import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0; parede do fundo em z = −1,6.
// Fogão no centro, com a boca da frente em corte (botão → válvula → injetor → tubo misturador → queimador).
// Botijão à direita; balcão à esquerda; garçom à esquerda.

export const ROOM = { x0: -2.7, x1: 2.1, z0: -1.6, z1: 1.2, wallH: 2.8 } as const;

export const STOVE = { x: 0, z: -0.72, w: 0.9, h: 0.9, d: 0.64 } as const;
export const BURNER = { x: 0, y: 0.92, z: -0.55, r: 0.085 } as const;

export const SPOT = {
  counter: [-1.6, 0, -0.75] as Vec3,
  waiter: [-1.05, 0, 0.35] as Vec3,
  knob: [0, 0.78, -0.385] as Vec3,
  valve: [0, 0.78, -0.47] as Vec3,
  safetyValve: [0, 0.7, -0.47] as Vec3,
  injector: [0, 0.64, -0.55] as Vec3,
  tubeTop: [0, 0.88, -0.55] as Vec3,
  airWindow: [0, 0.7, -0.55] as Vec3,
  igniter: [0.115, 0.935, -0.5] as Vec3,
  sensor: [-0.11, 0.94, -0.5] as Vec3,
  pot: [0, 1.0, -0.55] as Vec3,
  cylinder: [1.1, 0, -0.9] as Vec3,
  serve: [-0.82, 1.1, 0.5] as Vec3,
} as const;

/** Caminho do gás: botão → válvula → injetor → topo do tubo misturador. */
export const GAS_PATH: Vec3[] = [SPOT.knob, SPOT.valve, [0, 0.64, -0.47], SPOT.injector, SPOT.tubeTop];
