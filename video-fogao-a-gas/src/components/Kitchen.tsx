import { MATTE, METAL, PALETTE } from "../theme";
import type { Vec3 } from "../utils/animation";
import { ROOM, SPOT } from "../utils/layout";

// Canto de cozinha fixo: piso de ladrilho, paredes, balcão e prateleira. Peças sem animação.

export const Box: React.FC<{ p: Vec3; s: Vec3; c: string; metal?: boolean; shadow?: boolean }> = ({ p, s, c, metal, shadow = true }) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...(metal ? METAL : MATTE)} color={c} />
  </mesh>
);

export const Kitchen: React.FC = () => {
  const { x0, x1, z0, z1, wallH } = ROOM;
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  return (
    <group>
      <Box p={[cx, -0.3, cz]} s={[w + 0.3, 0.5, d + 0.3]} c={PALETTE.pedestal} />
      <Box p={[cx, -0.04, cz]} s={[w, 0.08, d]} c={PALETTE.kitchenFloor} />
      {Array.from({ length: 9 }).map((_, i) =>
        Array.from({ length: 6 }).map((__, j) =>
          (i + j) % 2 === 0 ? <Box key={`t${i}-${j}`} p={[x0 + 0.27 + i * 0.533, 0.001, z0 + 0.235 + j * 0.467]} s={[0.533, 0.002, 0.467]} c={PALETTE.kitchenTile} shadow={false} /> : null,
        ),
      )}
      <Box p={[cx, wallH / 2, z0 - 0.06]} s={[w, wallH, 0.12]} c={PALETTE.wallKitchen} />
      <Box p={[x0 - 0.06, wallH / 2, cz]} s={[0.12, wallH, d]} c={PALETTE.wallKitchen} />
      {/* faixa de azulejos na parede */}
      <Box p={[cx, 1.35, z0 + 0.005]} s={[w, 0.5, 0.02]} c="#cfe3ea" shadow={false} />
      {/* balcão com tampo */}
      <group position={SPOT.counter}>
        <Box p={[0, 0.47, 0]} s={[1.3, 0.94, 0.62]} c={PALETTE.woodDark} />
        <Box p={[0, 0.97, 0]} s={[1.4, 0.06, 0.7]} c={PALETTE.steel} metal />
        {[-0.32, 0.32].map((x) => (
          <Box key={x} p={[x, 0.55, 0.315]} s={[0.56, 0.6, 0.02]} c={PALETTE.wood} shadow={false} />
        ))}
      </group>
      {/* prateleira com potes */}
      <Box p={[-1.5, 2.05, z0 + 0.14]} s={[1.2, 0.05, 0.28]} c={PALETTE.wood} />
      {[-1.9, -1.6, -1.3, -1.05].map((x, i) => (
        <mesh key={x} position={[x, 2.18, z0 + 0.14]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 8]} />
          <meshStandardMaterial {...MATTE} color={["#e07a5f", "#81b29a", "#f2cc8f", "#9fb4d6"][i]} />
        </mesh>
      ))}
      {/* tomada da geladeira */}
      <Box p={[1.0, 0.35, z0 + 0.01]} s={[0.12, 0.16, 0.02]} c="#f5f5f5" shadow={false} />
    </group>
  );
};
