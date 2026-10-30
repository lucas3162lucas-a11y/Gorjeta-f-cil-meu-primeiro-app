import { DoubleSide } from "three";
import { MATTE, METAL } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { CAVITY_CENTER, MW, SPOT } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";

// Micro-ondas translúcido ("raio X"): carcaça, cavidade com paredes de metal, magnetron com aletas,
// guia de ondas, prato giratório e porta com tela metálica. E as ondas: arcos ciano, funções puras do frame.

export const WAVE = "#38d9ff";

export const MicrowaveBody: React.FC<{ rise: number; metal: number; door: number; spin: number; magOn: number }> = ({ rise, metal, door, spin, magOn }) => {
  const mesh = useCanvasTexture("mesh", 512, 320, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(40,48,56,0.55)";
    ctx.fillRect(0, 0, w, h);
    // furinhos: a luz passa por eles
    ctx.globalCompositeOperation = "destination-out";
    for (let y = 8; y < h; y += 14) {
      for (let x = 8 + ((y / 14) % 2) * 7; x < w; x += 14) {
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  });
  if (rise <= 0.001) return null;
  const k = clamp(rise, 0, 1.12);
  const { x, y, z, w, h, d, cavX0, cavX1 } = MW;
  const cw = cavX1 - cavX0;
  const ccx = (cavX0 + cavX1) / 2 - x;
  const wallColor = metal > 0.5 ? "#c9d3dc" : "#e8eef3";
  return (
    <group position={[x, y + (1 - clamp(rise, 0, 1)) * -0.6, z]} scale={[1, k, 1]}>
      {/* carcaça translúcida */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#f2f6f9" transparent opacity={0.14} side={DoubleSide} depthWrite={false} />
      </mesh>
      {/* paredes da cavidade: viram metal brilhante quando a solução aparece */}
      {[
        { p: [ccx, h - 0.04, 0] as Vec3, s: [cw, 0.02, d - 0.06] as Vec3 },
        { p: [ccx, 0.03, 0] as Vec3, s: [cw, 0.02, d - 0.06] as Vec3 },
        { p: [ccx, h / 2, -d / 2 + 0.03] as Vec3, s: [cw, h - 0.06, 0.02] as Vec3 },
        { p: [cavX0 - x, h / 2, 0] as Vec3, s: [0.02, h - 0.06, d - 0.06] as Vec3 },
        { p: [cavX1 - x, h / 2, 0] as Vec3, s: [0.02, h - 0.06, d - 0.06] as Vec3 },
      ].map((wl, i) => (
        <mesh key={i} position={wl.p}>
          <boxGeometry args={wl.s} />
          <meshStandardMaterial {...METAL} color={wallColor} emissive="#9fdcff" emissiveIntensity={0.25 * metal} transparent opacity={0.25 + 0.5 * metal} depthWrite={false} />
        </mesh>
      ))}
      {/* painel de controle */}
      <mesh position={[w / 2 - 0.12, h / 2, d / 2 + 0.005]}>
        <planeGeometry args={[0.2, h - 0.08]} />
        <meshStandardMaterial {...MATTE} color="#2b3036" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh position={[w / 2 - 0.12, h - 0.12, d / 2 + 0.01]}>
        <planeGeometry args={[0.14, 0.06]} />
        <meshStandardMaterial color="#9fe3b0" emissive="#5fd38a" emissiveIntensity={0.9 * magOn + 0.1} />
      </mesh>
      {/* porta com tela metálica */}
      <group position={[ccx, h / 2, d / 2 + 0.01]}>
        <mesh>
          <planeGeometry args={[cw, h - 0.08]} />
          <meshBasicMaterial map={mesh} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        {door > 0.01 ? (
          <mesh position={[0, 0, -0.002]}>
            <planeGeometry args={[cw + 0.04, h - 0.04]} />
            <meshBasicMaterial color="#ffd166" transparent opacity={0.35 * clamp(door, 0, 1)} toneMapped={false} depthWrite={false} />
          </mesh>
        ) : null}
      </group>
      {/* prato giratório */}
      <group position={[SPOT.plate[0] - x, 0.045, SPOT.plate[2] - z]} rotation={[0, spin, 0]}>
        <mesh>
          <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
          <meshStandardMaterial color="#d8eef8" transparent opacity={0.6} roughness={0.1} />
        </mesh>
        <mesh position={[0.2, 0.01, 0]}>
          <boxGeometry args={[0.03, 0.01, 0.03]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* magnetron: cilindro com aletas de resfriamento */}
      <group position={[SPOT.magnetron[0] - x, SPOT.magnetron[1] - y, 0]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.065, 0.16, 12]} />
          <meshStandardMaterial {...METAL} color="#b87333" emissive="#ff7a3c" emissiveIntensity={0.6 * magOn} />
        </mesh>
        {[-0.05, -0.02, 0.01, 0.04].map((fy) => (
          <mesh key={fy} position={[0, fy, 0]}>
            <boxGeometry args={[0.17, 0.008, 0.17]} />
            <meshStandardMaterial {...METAL} color="#aab3bb" />
          </mesh>
        ))}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
          <meshStandardMaterial {...METAL} color="#d9dee3" emissive={WAVE} emissiveIntensity={0.8 * magOn} />
        </mesh>
      </group>
      {/* guia de ondas: tubo retangular do magnetron até o teto da cavidade */}
      <mesh position={[(SPOT.magnetron[0] + CAVITY_CENTER[0]) / 2 - x, h - 0.02, 0]}>
        <boxGeometry args={[SPOT.magnetron[0] - CAVITY_CENTER[0], 0.05, 0.12]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* LED interno quando liga */}
      {magOn > 0.05 ? <pointLight position={[ccx, h - 0.1, 0]} intensity={0.6 * magOn} distance={1.2} color="#fff1c2" /> : null}
      {/* pés */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * w) / 2.4, -0.01, (sz * d) / 2.4]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 6]} />
            <meshStandardMaterial {...MATTE} color="#333" />
          </mesh>
        )),
      )}
    </group>
  );
};

/** Arco de onda (meio anel) — usado para todas as ondas do vídeo. */
export const WaveArc: React.FC<{ at: Vec3; r: number; opacity: number; rotY?: number; rotZ?: number; color?: string; thick?: number }> = ({
  at,
  r,
  opacity,
  rotY = 0,
  rotZ = 0,
  color = WAVE,
  thick = 0.012,
}) =>
  opacity <= 0.01 ? null : (
    <mesh position={at} rotation={[0, rotY, rotZ]}>
      <torusGeometry args={[r, thick, 6, 20, Math.PI]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
