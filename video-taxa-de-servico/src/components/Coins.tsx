import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, randRange, type Vec3 } from "../utils/animation";

// Moedas e cédulas voando em arco. Cada peça é função pura do progresso (sem estado acumulado):
// a peça i sai com um pequeno atraso e só aparece enquanto está no ar.

export const arc = (from: Vec3, to: Vec3, t: number, height: number): Vec3 => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t) + 4 * height * t * (1 - t),
  lerp(from[2], to[2], t),
];

export const Coin: React.FC<{ at: Vec3; spin?: number; kind?: "coin" | "cash"; scale?: number }> = ({ at, spin = 0, kind = "coin", scale = 1 }) =>
  kind === "coin" ? (
    <mesh position={at} rotation={[Math.PI / 2 + spin * 0.6, spin, 0]} scale={scale} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.025, 10]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.gold} emissive={PALETTE.goldDark} emissiveIntensity={0.35} />
    </mesh>
  ) : (
    <mesh position={at} rotation={[spin * 0.4, spin, spin * 0.2]} scale={scale} castShadow>
      <boxGeometry args={[0.22, 0.012, 0.11]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.cash} />
    </mesh>
  );

export type StreamProps = {
  from: Vec3;
  to: Vec3;
  /** progresso da trilha 0→1 */
  p: number;
  count: number;
  height?: number;
  seed: string;
  kind?: "coin" | "cash";
  /** espalhamento da origem (u3d) */
  spread?: number;
};

/** Leva `count` peças de `from` até `to` ao longo do progresso p. */
export const CoinStream: React.FC<StreamProps> = ({ from, to, p, count, height = 0.6, seed, kind = "coin", spread = 0.12 }) => {
  if (p <= 0 || p >= 1) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const delay = (i / Math.max(1, count - 1)) * 0.55;
    const t = clamp((p - delay) / 0.45, 0, 1);
    if (t <= 0 || t >= 1) continue;
    const o: Vec3 = [from[0] + randRange(`${seed}x${i}`, -spread, spread), from[1], from[2] + randRange(`${seed}z${i}`, -spread, spread)];
    items.push(<Coin key={i} at={arc(o, to, t, height * randRange(`${seed}h${i}`, 0.8, 1.2))} spin={t * 9 + i} kind={kind} />);
  }
  return <group>{items}</group>;
};

/** Fluxo contínuo em loop (cena final): fase pelo frame, intensidade 0→1. */
export const CoinLoop: React.FC<{ from: Vec3; to: Vec3; frame: number; period: number; count: number; height?: number; seed: string; intensity: number }> = ({
  from,
  to,
  frame,
  period,
  count,
  height = 0.6,
  seed,
  intensity,
}) => {
  if (intensity <= 0.01) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const t = (((frame / period + i / count + randRange(`${seed}${i}`, 0, 0.1)) % 1) + 1) % 1;
    items.push(<Coin key={i} at={arc(from, to, t, height)} spin={t * 9 + i} scale={intensity} />);
  }
  return <group>{items}</group>;
};
