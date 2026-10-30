import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { FONT, MATTE, METAL } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { CIRCUIT, FRIDGE, SPOT, type Segment } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";

// Geladeira translúcida ("raio X") e as peças do circuito: tubos, compressor, grade do condensador,
// tubo capilar, termostato e manômetro. Cada peça recebe seu estado pronto (trilhas).

const COLD = "#4fc3ff";
const HOT = "#ff5a3c";

const up = new Vector3(0, 1, 0);

/** Tubo reto entre dois pontos (cilindro orientado). */
const Pipe: React.FC<{ a: Vec3; b: Vec3; r: number; color: string; glow?: number; opacity?: number }> = ({ a, b, r, color, glow = 0, opacity = 1 }) => {
  const { pos, q, len } = useMemo(() => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    const l = dir.length();
    return { pos: va.add(vb).multiplyScalar(0.5).toArray() as Vec3, q: new Quaternion().setFromUnitVectors(up, dir.normalize()), len: l };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial {...METAL} color={color} emissive={color} emissiveIntensity={0.15 + glow * 0.7} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

/** Desenha um trecho do circuito até a fração `draw` (0→1) do seu comprimento. */
export const CircuitPart: React.FC<{ seg: Segment; draw: number; r?: number; color: string; glow?: number }> = ({ seg, draw, r = 0.022, color, glow = 0 }) => {
  const pts = CIRCUIT.find((c) => c.seg === seg)!.pts;
  if (draw <= 0.001) return null;
  const n = pts.length - 1;
  const lim = clamp(draw, 0, 1) * n;
  const out = [];
  for (let i = 0; i < n; i++) {
    if (i >= lim) break;
    const a = pts[i];
    const k = clamp(lim - i, 0, 1);
    const b: Vec3 = [a[0] + (pts[i + 1][0] - a[0]) * k, a[1] + (pts[i + 1][1] - a[1]) * k, a[2] + (pts[i + 1][2] - a[2]) * k];
    out.push(<Pipe key={i} a={a} b={b} r={r} color={color} glow={glow} />);
    // cotovelo arredondado
    out.push(
      <mesh key={`j${i}`} position={a}>
        <sphereGeometry args={[r * 1.05, 6, 4]} />
        <meshStandardMaterial {...METAL} color={color} emissive={color} emissiveIntensity={0.15 + glow * 0.7} />
      </mesh>,
    );
  }
  return <group>{out}</group>;
};

export const FridgeShell: React.FC<{ rise: number }> = ({ rise }) => {
  if (rise <= 0.001) return null;
  const { x, z, w, d, h, freezerY } = FRIDGE;
  const k = clamp(rise, 0, 1.15);
  const edge = (p: Vec3, s: Vec3, i: number) => (
    <mesh key={i} position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial {...MATTE} color="#e9eef2" />
    </mesh>
  );
  const e = 0.035;
  return (
    <group position={[x, (1 - clamp(rise, 0, 1)) * -2.4, z]} scale={[1, k, 1]}>
      {/* carcaça translúcida */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#dff3ff" transparent opacity={0.16} roughness={0.2} side={DoubleSide} depthWrite={false} />
      </mesh>
      {/* arestas opacas (leitura da forma) */}
      {[
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
      ].map(([ex, ez], i) => edge([ex, h / 2, ez], [e, h, e], i))}
      {[0, h].map((y, i) =>
        [
          edge([0, y, -d / 2], [w, e, e], 10 + i * 4),
          edge([0, y, d / 2], [w, e, e], 11 + i * 4),
          edge([-w / 2, y, 0], [e, e, d], 12 + i * 4),
          edge([w / 2, y, 0], [e, e, d], 13 + i * 4),
        ],
      )}
      {/* divisória do congelador e prateleira */}
      <mesh position={[0, freezerY, 0]}>
        <boxGeometry args={[w - 0.06, 0.04, d - 0.06]} />
        <meshStandardMaterial color="#cfe9f7" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.0, 0.03]}>
        <boxGeometry args={[w - 0.08, 0.025, d - 0.12]} />
        <meshStandardMaterial color="#cfe9f7" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* pés */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * w) / 2.4, 0.03, (sz * d) / 2.4]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
            <meshStandardMaterial {...MATTE} color="#333" />
          </mesh>
        )),
      )}
    </group>
  );
};

/** Compressor: cápsula preta com pistão visível em corte; `on` controla brilho e ritmo. */
export const Compressor: React.FC<{ on: number; frame: number }> = ({ on, frame }) => {
  const piston = Math.sin(frame * 0.9) * 0.035 * clamp(on, 0, 1);
  return (
    <group position={SPOT.compressor}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.18, 4, 10]} />
        <meshStandardMaterial {...METAL} color="#30353c" emissive={HOT} emissiveIntensity={0.12 * on} />
      </mesh>
      <mesh position={[0, 0.3 + piston, 0.12]}>
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshStandardMaterial {...METAL} color="#c9d1d8" emissive="#ffffff" emissiveIntensity={0.2 * on} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.46, 0.06, 0.34]} />
        <meshStandardMaterial {...MATTE} color="#4a4f57" />
      </mesh>
      {/* LED de ligado */}
      <mesh position={[0.12, 0.42, 0.15]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color={on > 0.5 ? "#3be37a" : "#666"} emissive={on > 0.5 ? "#3be37a" : "#000"} emissiveIntensity={1.4 * on} />
      </mesh>
    </group>
  );
};

const font = (weight: number, px: number) => `${weight} ${px}px ${FONT}, sans-serif`;

export const Thermostat: React.FC<{ pop: number; knob: number }> = ({ pop, knob }) => {
  if (pop <= 0.001) return null;
  return (
    <group position={SPOT.thermostat} scale={clamp(pop, 0, 1.25)}>
      <mesh>
        <boxGeometry args={[0.34, 0.14, 0.06]} />
        <meshStandardMaterial {...MATTE} color="#f4f7f9" />
      </mesh>
      <group position={[-0.07, 0, 0.04]} rotation={[Math.PI / 2, knob * Math.PI * 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
          <meshStandardMaterial {...MATTE} color="#2f7df6" />
        </mesh>
        <mesh position={[0, 0.025, 0.03]}>
          <boxGeometry args={[0.012, 0.012, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh position={[0.09, 0, 0.035]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color={knob > 0.5 ? "#3be37a" : "#f8c815"} emissive={knob > 0.5 ? "#3be37a" : "#f8c815"} emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
};

/** Manômetro sem números: ponteiro de 0 (baixo, azul) a 1 (alto, vermelho). */
export const Gauge: React.FC<{ needle: number; yaw: number }> = ({ needle, yaw }) => {
  const map = useCanvasTexture("gauge", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 22;
    const arc = (a0: number, a1: number, c: string) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 92, a0, a1);
      ctx.stroke();
    };
    arc(Math.PI * 0.75, Math.PI * 1.25, COLD);
    arc(Math.PI * 1.25, Math.PI * 1.75, "#f8c815");
    arc(Math.PI * 1.75, Math.PI * 2.25, HOT);
    ctx.fillStyle = "#1f3b57";
    ctx.textAlign = "center";
    ctx.font = font(900, 30);
    ctx.fillText("PRESSÃO", w / 2, h / 2 + 70);
  });
  const ang = Math.PI * 0.75 + clamp(needle, 0, 1) * Math.PI * 1.5;
  return (
    <group position={SPOT.gauge} rotation={[0, yaw, 0]}>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 20]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <circleGeometry args={[0.145, 24]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.03]} rotation={[0, 0, -(ang - Math.PI / 2) + Math.PI]}>
        <boxGeometry args={[0.014, 0.22, 0.008]} />
        <meshStandardMaterial color="#e5383b" />
      </mesh>
    </group>
  );
};

/** Termômetro sem números (bulbo + coluna), nível 0→1. */
export const Thermometer: React.FC<{ at: Vec3; level: number; pop: number; scale?: number }> = ({ at, level, pop, scale = 1 }) => {
  if (pop <= 0.001) return null;
  const l = clamp(level, 0.05, 1);
  const color = l > 0.6 ? HOT : l > 0.4 ? "#f8a215" : COLD;
  return (
    <group position={at} scale={clamp(pop, 0, 1.2) * scale}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.06 + (0.38 * l) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.38 * l, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

export const PIPE_COLOR = { evap: "#7fb8d6", suction: "#8fa7b8", discharge: "#c0504d", condenser: "#3a3f46", capillary: "#c98a4b" } as const;
export { COLD, HOT };

