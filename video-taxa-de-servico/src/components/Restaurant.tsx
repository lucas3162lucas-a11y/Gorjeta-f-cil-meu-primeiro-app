import { MATTE, METAL, PALETTE } from "../theme";
import type { Vec3 } from "../utils/animation";
import { ROOM, SPOT } from "../utils/layout";

// Restaurante em corte (casa de bonecas sem a parede da frente): piso, paredes, meio-muro com
// janela de passagem, mesas, balcão do caixa, fogão e pia. Peças fixas; os personagens e o
// dinheiro ficam em outros componentes.

const Box: React.FC<{ p: Vec3; s: Vec3; c: string; metal?: boolean; shadow?: boolean }> = ({ p, s, c, metal, shadow = true }) => (
  <mesh position={p} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...(metal ? METAL : MATTE)} color={c} />
  </mesh>
);

const Table: React.FC<{ at: Vec3; w?: number; d?: number; plates?: number }> = ({ at, w = 1.2, d = 0.8, plates = 2 }) => (
  <group position={at}>
    <Box p={[0, 0.74, 0]} s={[w, 0.06, d]} c={PALETTE.wood} />
    <Box p={[0, 0.72, 0]} s={[w + 0.06, 0.04, d + 0.06]} c={PALETTE.cloth} />
    <mesh position={[0, 0.36, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.72, 6]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.woodDark} />
    </mesh>
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <cylinderGeometry args={[0.28, 0.32, 0.04, 8]} />
      <meshStandardMaterial {...MATTE} color={PALETTE.woodDark} />
    </mesh>
    {Array.from({ length: plates }).map((_, i) => (
      <mesh key={i} position={[(i - (plates - 1) / 2) * (w * 0.45), 0.79, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.03, 10]} />
        <meshStandardMaterial {...MATTE} color={PALETTE.plate} />
      </mesh>
    ))}
  </group>
);

const Chair: React.FC<{ at: Vec3; rotY?: number }> = ({ at, rotY = 0 }) => (
  <group position={at} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.45, 0]} s={[0.42, 0.06, 0.42]} c={PALETTE.woodDark} />
    <Box p={[-0.19, 0.78, 0]} s={[0.05, 0.62, 0.42]} c={PALETTE.woodDark} />
    {[-0.17, 0.17].map((x) =>
      [-0.17, 0.17].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.44, 0.05]} c={PALETTE.woodDark} />),
    )}
  </group>
);

export const Restaurant: React.FC = () => {
  const { x0, x1, z0, z1, wallH, kitchenX, kitchenWallZ1 } = ROOM;
  const w = x1 - x0;
  const d = z1 - z0;
  const kz = (z0 + kitchenWallZ1) / 2;
  const kd = kitchenWallZ1 - z0;
  return (
    <group>
      {/* pedestal e piso */}
      <Box p={[(x0 + x1) / 2, -0.32, (z0 + z1) / 2]} s={[w + 0.3, 0.5, d + 0.3]} c={PALETTE.pedestal} />
      <Box p={[(x0 + kitchenX) / 2, -0.04, (z0 + z1) / 2]} s={[kitchenX - x0, 0.08, d]} c={PALETTE.floor} />
      <Box p={[(kitchenX + x1) / 2, -0.04, (z0 + z1) / 2]} s={[x1 - kitchenX, 0.08, d]} c={PALETTE.kitchenFloor} />
      {/* ladrilhos da cozinha */}
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 6 }).map((__, j) =>
          (i + j) % 2 === 0 ? <Box key={`t${i}-${j}`} p={[kitchenX + 0.27 + i * 0.54, 0.001, z0 + 0.28 + j * 0.57]} s={[0.54, 0.002, 0.57]} c={PALETTE.kitchenTile} shadow={false} /> : null,
        ),
      )}
      {/* tábuas do salão */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={`b${i}`} p={[(x0 + kitchenX) / 2, 0.001, z0 + 0.22 + i * 0.43]} s={[kitchenX - x0, 0.004, 0.02]} c={PALETTE.floorEdge} shadow={false} />
      ))}
      {/* paredes do fundo e da esquerda */}
      <Box p={[(x0 + kitchenX) / 2, wallH / 2, z0 - 0.06]} s={[kitchenX - x0, wallH, 0.12]} c={PALETTE.wall} />
      <Box p={[(kitchenX + x1) / 2, wallH / 2, z0 - 0.06]} s={[x1 - kitchenX, wallH, 0.12]} c={PALETTE.wallKitchen} />
      <Box p={[x0 - 0.06, wallH / 2, (z0 + z1) / 2]} s={[0.12, wallH, d]} c={PALETTE.wall} />
      <Box p={[(x0 + kitchenX) / 2, 0.08, z0 + 0.01]} s={[kitchenX - x0, 0.16, 0.04]} c={PALETTE.trim} />
      {/* quadro decorativo e luminárias do salão */}
      <Box p={[-2.85, 1.7, z0 + 0.02]} s={[0.6, 0.45, 0.03]} c="#5d8a6b" />
      {[-2.5, -1.4].map((x) => (
        <group key={x} position={[x, wallH - 0.35, x === -2.5 ? -0.9 : 0.7]}>
          <mesh>
            <coneGeometry args={[0.2, 0.18, 8, 1, true]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.trim} side={2} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color="#fff3c4" emissive="#ffd27a" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      {/* meio-muro da cozinha com balcão de passagem (deixa ver salão e cozinha juntos) */}
      <Box p={[kitchenX, 0.5, kz]} s={[0.14, 1.0, kd]} c={PALETTE.wall} />
      <Box p={[kitchenX, 1.02, kz]} s={[0.4, 0.05, kd]} c={PALETTE.steel} metal />
      {/* mesas e cadeiras */}
      <Table at={SPOT.table} />
      <Chair at={[SPOT.customer[0], 0, SPOT.customer[2]]} />
      <Table at={SPOT.table2} w={0.9} d={0.7} plates={1} />
      <Chair at={[SPOT.table2[0] - 0.6, 0, SPOT.table2[2]]} />
      <Table at={SPOT.table3} w={0.9} d={0.7} plates={1} />
      <Chair at={[SPOT.table3[0] + 0.6, 0, SPOT.table3[2]]} rotY={Math.PI} />
      {/* balcão do caixa */}
      <group position={SPOT.counter}>
        <Box p={[0, 0.48, 0]} s={[1.3, 0.96, 0.62]} c={PALETTE.woodDark} />
        <Box p={[0, 0.98, 0]} s={[1.4, 0.05, 0.7]} c={PALETTE.wood} />
        <Box p={[0, 0.5, 0.32]} s={[1.2, 0.08, 0.02]} c={PALETTE.gold} shadow={false} />
      </group>
      {/* fogão com panelas */}
      <group position={SPOT.stove}>
        <Box p={[0, 0.45, 0]} s={[1.1, 0.9, 0.6]} c={PALETTE.steel} metal />
        <Box p={[0, 0.92, 0]} s={[1.12, 0.04, 0.62]} c="#3b4148" />
        <mesh position={[-0.25, 1.06, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.22, 10]} />
          <meshStandardMaterial {...METAL} color="#c3cad0" />
        </mesh>
        <mesh position={[0.27, 0.98, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 10]} />
          <meshStandardMaterial {...MATTE} color="#2d3238" />
        </mesh>
        <Box p={[0, 2.05, -0.05]} s={[1.2, 0.5, 0.5]} c={PALETTE.steel} metal />
      </group>
      {/* pia com pilha de pratos */}
      <group position={SPOT.sink}>
        <Box p={[0, 0.45, 0]} s={[0.55, 0.9, 1.0]} c={PALETTE.steel} metal />
        <Box p={[0, 0.88, 0]} s={[0.45, 0.06, 0.6]} c="#7fa9c4" shadow={false} />
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.94 + i * 0.035, 0.38]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.025, 10]} />
            <meshStandardMaterial {...MATTE} color={PALETTE.plate} />
          </mesh>
        ))}
      </group>
      {/* prateleira da cozinha */}
      <Box p={[2.9, 1.75, z0 + 0.12]} s={[1.0, 0.05, 0.25]} c={PALETTE.steel} metal />
      {[2.6, 2.85, 3.1].map((x, i) => (
        <mesh key={x} position={[x, 1.86, z0 + 0.12]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 8]} />
          <meshStandardMaterial {...MATTE} color={["#e07a5f", "#81b29a", "#f2cc8f"][i]} />
        </mesh>
      ))}
    </group>
  );
};
