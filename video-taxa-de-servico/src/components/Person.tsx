import { MATTE, PALETTE } from "../theme";
import type { Vec3 } from "../utils/animation";

// Personagem low-poly articulado (pernas, tronco, braços, cabeça). Poses vêm de trilhas:
// ângulos dos braços em radianos (0 = ao lado do corpo; positivo = para a frente).

export type PersonProps = {
  at: Vec3;
  rotY?: number;
  shirt: string;
  pants?: string;
  skin?: string;
  hair?: string;
  apron?: string;
  hat?: "chef" | "cap" | null;
  seated?: boolean;
  armL?: number;
  armR?: number;
  /** abre os braços para os lados (rad) */
  spreadR?: number;
  headTilt?: number;
  /** sobe/desce o corpo (u3d) */
  lift?: number;
  glow?: number;
  glowColor?: string;
  scale?: number;
};

const Limb: React.FC<{ pivot: Vec3; angle: number; spread?: number; len: number; r: number; color: string; hand?: string }> = ({ pivot, angle, spread = 0, len, r, color, hand }) => (
  <group position={pivot} rotation={[-angle, 0, spread]}>
    <mesh position={[0, -len / 2, 0]} castShadow>
      <cylinderGeometry args={[r, r * 0.9, len, 6]} />
      <meshStandardMaterial {...MATTE} color={color} />
    </mesh>
    {hand ? (
      <mesh position={[0, -len - 0.04, 0]} castShadow>
        <icosahedronGeometry args={[r * 1.15, 0]} />
        <meshStandardMaterial {...MATTE} color={hand} />
      </mesh>
    ) : null}
  </group>
);

export const Person: React.FC<PersonProps> = ({
  at,
  rotY = 0,
  shirt,
  pants = "#2f3a4a",
  skin = PALETTE.skin,
  hair = PALETTE.hair,
  apron,
  hat = null,
  seated = false,
  armL = 0,
  armR = 0,
  spreadR = 0,
  headTilt = 0,
  lift = 0,
  glow = 0,
  glowColor = PALETTE.gold,
  scale = 1,
}) => {
  if (scale <= 0.001) return null;
  const hip = seated ? 0.5 : 0.78;
  const emissive = { emissive: glowColor, emissiveIntensity: glow * 0.55 };
  return (
    <group position={[at[0], at[1] + lift, at[2]]} rotation={[0, rotY, 0]} scale={scale}>
      {/* pernas */}
      {[-0.09, 0.09].map((z) =>
        seated ? (
          <group key={z}>
            <mesh position={[0.2, hip, z]} castShadow>
              <boxGeometry args={[0.42, 0.13, 0.13]} />
              <meshStandardMaterial {...MATTE} color={pants} />
            </mesh>
            <mesh position={[0.4, hip / 2, z]} castShadow>
              <boxGeometry args={[0.12, hip, 0.12]} />
              <meshStandardMaterial {...MATTE} color={pants} />
            </mesh>
          </group>
        ) : (
          <mesh key={z} position={[0, hip / 2, z]} castShadow>
            <boxGeometry args={[0.13, hip, 0.13]} />
            <meshStandardMaterial {...MATTE} color={pants} />
          </mesh>
        ),
      )}
      {/* tronco */}
      <mesh position={[0, hip + 0.29, 0]} castShadow>
        <boxGeometry args={[0.26, 0.58, 0.38]} />
        <meshStandardMaterial {...MATTE} color={shirt} {...emissive} />
      </mesh>
      {apron ? (
        <mesh position={[0.135, hip + 0.12, 0]} castShadow>
          <boxGeometry args={[0.02, 0.62, 0.32]} />
          <meshStandardMaterial {...MATTE} color={apron} {...emissive} />
        </mesh>
      ) : null}
      {/* braços (pivô no ombro). Frente do personagem = +x local */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <Limb pivot={[0.25, hip + 0.54, 0]} angle={armR} spread={-spreadR} len={0.5} r={0.055} color={shirt} hand={skin} />
        <Limb pivot={[-0.25, hip + 0.54, 0]} angle={armL} len={0.5} r={0.055} color={shirt} hand={skin} />
      </group>
      {/* cabeça */}
      <group position={[0, hip + 0.7, 0]} rotation={[0, 0, headTilt]}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.17, 1]} />
          <meshStandardMaterial {...MATTE} color={skin} />
        </mesh>
        <mesh position={[-0.03, 0.08, 0]} castShadow>
          <icosahedronGeometry args={[0.165, 0]} />
          <meshStandardMaterial {...MATTE} color={hair} />
        </mesh>
        {/* olhos */}
        {[-0.06, 0.06].map((z) => (
          <mesh key={z} position={[0.155, 0.02, z]}>
            <sphereGeometry args={[0.022, 6, 4]} />
            <meshStandardMaterial color="#1b1b1b" />
          </mesh>
        ))}
        {hat === "chef" ? (
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.13, 0.22, 8]} />
            <meshStandardMaterial {...MATTE} color="#ffffff" />
          </mesh>
        ) : null}
        {hat === "cap" ? (
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.07, 8]} />
            <meshStandardMaterial {...MATTE} color="#2a9d8f" />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};
