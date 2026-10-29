import type { Vec3 } from "./animation";

// Planta do diorama (unidades do mundo). Frente aberta para +z; piso em y = 0.
// Salão à esquerda, balcão do caixa no fundo ao centro, cozinha à direita do meio-muro (x = 0,9).

export const ROOM = { x0: -3.4, x1: 3.6, z0: -1.8, z1: 1.6, wallH: 2.6, kitchenX: 0.9, kitchenWallZ1: 0.6 } as const;

export const SPOT = {
  table: [-1.5, 0, 0.7] as Vec3,
  table2: [-2.5, 0, -0.9] as Vec3,
  table3: [-1.25, 0, -0.95] as Vec3,
  customer: [-2.2, 0, 0.7] as Vec3,
  waiter: [-0.7, 0, 1.2] as Vec3,
  counter: [0.25, 0, -1.0] as Vec3,
  register: [0.45, 1.0, -1.0] as Vec3,
  tipBox: [-0.12, 1.0, -0.95] as Vec3,
  jar: [-0.12, 1.0, -0.85] as Vec3,
  owner: [0.02, 0, -1.5] as Vec3,
  cook: [2.0, 0, -0.85] as Vec3,
  stove: [2.0, 0, -1.45] as Vec3,
  dishwasher: [2.75, 0, 0.15] as Vec3,
  sink: [3.25, 0, 0.15] as Vec3,
  disc: [0.1, 0.02, 0.6] as Vec3,
  vault: [0.6, 0, -0.18] as Vec3,
  notice: [-1.55, 1.95, -1.77] as Vec3,
  /** conta flutuando em frente ao caixa / em frente ao cliente */
  billCounter: [-0.75, 1.55, -0.35] as Vec3,
  billTable: [-1.55, 1.4, 1.05] as Vec3,
  payslip: [-0.2, 1.5, 1.55] as Vec3,
} as const;

/** Mão/peito de cada funcionário: destino das moedas do rateio. */
export const STAFF_POCKET: Record<"waiter" | "cook" | "dishwasher", Vec3> = {
  waiter: [SPOT.waiter[0], 1.0, SPOT.waiter[2]],
  cook: [SPOT.cook[0], 1.0, SPOT.cook[2]],
  dishwasher: [SPOT.dishwasher[0], 1.0, SPOT.dishwasher[2]],
};

/** Fatias do disco de rateio (frações ilustrativas, sem números na tela). */
export const SLICES = [
  { id: "waiter", share: 0.36, color: "#3d8bfd" },
  { id: "cook", share: 0.31, color: "#ff8c42" },
  { id: "dishwasher", share: 0.23, color: "#22b8a8" },
  { id: "retained", share: 0.1, color: "#9aa5b1" },
] as const;
