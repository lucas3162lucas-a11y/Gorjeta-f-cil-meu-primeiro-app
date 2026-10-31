import { useMemo } from "react";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { FONT, MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, randRange, type Vec3 } from "../utils/animation";
import { BURNER, GAS_PATH, SPOT, STOVE } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";

// Fogão a gás com a boca da frente em corte: botão, válvula, válvula de segurança, injetor, tubo
// misturador com janela de ar, queimador com furinhos, acendedor, sensor de calor, chama e partículas.
// Tudo é função pura do frame e do estado vindo das trilhas.

const GAS = "#ffd166";
const AIR = "#7fd3ff";
const up = new Vector3(0, 1, 0);

const Pipe: React.FC<{ a: Vec3; b: Vec3; r: number; color: string; glow?: number }> = ({ a, b, r, color, glow = 0 }) => {
  const { pos, q, len } = useMemo(() => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray() as Vec3, q: new Quaternion().setFromUnitVectors(up, dir.clone().normalize()), len: dir.length() };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial {...METAL} color={color} emissive={color} emissiveIntensity={0.1 + 0.6 * glow} />
    </mesh>
  );
};

const pathAt = (pts: Vec3[], t: number): Vec3 => {
  const n = pts.length - 1;
  const x = clamp(t, 0, 0.9999) * n;
  const i = Math.floor(x);
  const k = x - i;
  const a = pts[i];
  const b = pts[i + 1];
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
};

export type StoveState = {
  cut: number;
  burnerCut: number;
  knob: number;
  gas: number;
  leak: number;
  flame: number;
  yellow: number;
  soot: number;
  spark: number;
  igniter: number;
  air: number;
  mixer: number;
  valveShow: number;
  sensorPop: number;
  sensorCool: number;
  safetyClose: number;
};

export const GasStove: React.FC<{ s: StoveState; frame: number }> = ({ s, frame }) => {
  const cut = clamp(Math.max(s.cut, s.valveShow), 0, 1);
  const { x, z, w, h, d } = STOVE;
  const flame = clamp(s.flame, 0, 1.4);
  const yellow = clamp(s.yellow, 0, 1);
  const flameColor = `rgb(${Math.round(lerp(80, 255, yellow))},${Math.round(lerp(150, 190, yellow))},${Math.round(lerp(255, 40, yellow))})`;
  const gasOn = clamp(s.gas, 0, 1) * (1 - clamp(s.safetyClose, 0, 1));
  return (
    <group>
      {/* corpo do fogão: metade da frente some no corte */}
      <mesh position={[x, h / 2, z - d / 4]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d / 2]} />
        <meshStandardMaterial {...METAL} color="#d9dee3" />
      </mesh>
      <mesh position={[x, h / 2, z + d / 4]}>
        <boxGeometry args={[w, h, d / 2]} />
        <meshStandardMaterial {...METAL} color="#d9dee3" transparent opacity={1 - 0.82 * cut} depthWrite={cut < 0.05} />
      </mesh>
      <mesh position={[x, h + 0.01, z]}>
        <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
        <meshStandardMaterial {...MATTE} color="#2d3238" transparent opacity={1 - 0.5 * cut} />
      </mesh>
      {/* forno (porta) */}
      <mesh position={[x, 0.4, z + d / 2 + 0.005]}>
        <planeGeometry args={[0.66, 0.42]} />
        <meshStandardMaterial {...MATTE} color="#3a3f46" transparent opacity={1 - 0.75 * cut} />
      </mesh>
      {/* botão */}
      <group position={SPOT.knob} rotation={[Math.PI / 2, 0, -s.knob * 2.2]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.035, 14]} />
          <meshStandardMaterial {...MATTE} color="#1f2328" />
        </mesh>
        <mesh position={[0, 0.02, 0.025]}>
          <boxGeometry args={[0.012, 0.012, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* tubulação interna (vista no corte) */}
      {cut > 0.05 ? (
        <group>
          {GAS_PATH.slice(1, -1).map((p, i) => (
            <Pipe key={i} a={GAS_PATH[i + 1]} b={GAS_PATH[i + 2]} r={0.014} color="#c9a227" glow={gasOn * 0.3} />
          ))}
          <Pipe a={GAS_PATH[0]} b={GAS_PATH[1]} r={0.01} color="#9aa5b1" />
          {/* válvula do botão: abre conforme o giro */}
          <group position={SPOT.valve}>
            <mesh>
              <boxGeometry args={[0.07, 0.06, 0.05]} />
              <meshStandardMaterial {...METAL} color="#b87333" emissive="#ffd166" emissiveIntensity={0.6 * clamp(s.valveShow, 0, 1)} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0, 0]} scale={[1, 0.15 + 0.85 * clamp(s.knob, 0, 1), 1]}>
              <boxGeometry args={[0.02, 0.05, 0.052]} />
              <meshStandardMaterial color={GAS} emissive={GAS} emissiveIntensity={0.8} />
            </mesh>
          </group>
          {/* válvula de segurança (ligada ao sensor) */}
          <mesh position={SPOT.safetyValve}>
            <boxGeometry args={[0.05, 0.04, 0.04]} />
            <meshStandardMaterial {...METAL} color={s.safetyClose > 0.5 ? PALETTE.negative : "#5b6470"} emissive={PALETTE.negative} emissiveIntensity={0.7 * clamp(s.safetyClose, 0, 1)} />
          </mesh>
          {/* injetor + tubo misturador com janela de ar */}
          <mesh position={SPOT.injector}>
            <coneGeometry args={[0.018, 0.04, 8]} />
            <meshStandardMaterial {...METAL} color="#b87333" />
          </mesh>
          <mesh position={[SPOT.tubeTop[0], (SPOT.airWindow[1] + SPOT.tubeTop[1]) / 2 + 0.02, SPOT.tubeTop[2]]}>
            <cylinderGeometry args={[0.032, 0.026, SPOT.tubeTop[1] - SPOT.airWindow[1], 12, 1, true]} />
            <meshStandardMaterial {...METAL} color="#aab3bb" emissive="#7fd3ff" emissiveIntensity={0.5 * clamp(s.mixer, 0, 1)} transparent opacity={0.55} side={DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ) : null}
      {/* queimador com grade */}
      <group position={[BURNER.x, BURNER.y, BURNER.z]}>
        <mesh>
          <cylinderGeometry args={[BURNER.r, BURNER.r + 0.01, 0.03, 18]} />
          <meshStandardMaterial {...METAL} color="#3b4148" transparent={s.burnerCut > 0.01} opacity={1 - 0.5 * clamp(s.burnerCut, 0, 1)} />
        </mesh>
        {[0, Math.PI / 2].map((a) => (
          <mesh key={a} position={[0, 0.07, 0]} rotation={[0, a, 0]}>
            <boxGeometry args={[0.34, 0.012, 0.014]} />
            <meshStandardMaterial {...MATTE} color="#1f2328" />
          </mesh>
        ))}
      </group>
      {/* acendedor e sensor de calor */}
      <mesh position={SPOT.igniter}>
        <cylinderGeometry args={[0.008, 0.01, 0.05, 6]} />
        <meshStandardMaterial {...MATTE} color="#f4f4f4" emissive="#9fdcff" emissiveIntensity={0.9 * clamp(s.igniter, 0, 1)} />
      </mesh>
      <mesh position={SPOT.sensor}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
        <meshStandardMaterial {...METAL} color={s.sensorCool > 0.5 ? "#4fa3ff" : "#ff7043"} emissive={s.sensorCool > 0.5 ? "#4fa3ff" : "#ff7043"} emissiveIntensity={0.9 * clamp(s.sensorPop, 0, 1)} />
      </mesh>
      {/* faísca: raio curto entre o acendedor e a borda do queimador */}
      {s.spark > 0.05 ? (
        <Pipe a={[SPOT.igniter[0], SPOT.igniter[1] + 0.02, SPOT.igniter[2]]} b={[BURNER.x + BURNER.r * 0.7, BURNER.y + 0.02, BURNER.z + 0.03]} r={0.004} color="#e8f6ff" glow={1} />
      ) : null}
      {/* chama: cones em volta do queimador, tremulando só no próprio tamanho */}
      {flame > 0.02
        ? Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const hgt = (0.05 + 0.012 * Math.sin(frame / 3 + i * 1.7)) * flame * (1 - 0.3 * yellow);
            return (
              <mesh key={i} position={[BURNER.x + (BURNER.r + 0.006) * Math.cos(a), BURNER.y + 0.015 + hgt / 2, BURNER.z + (BURNER.r + 0.006) * Math.sin(a)]}>
                <coneGeometry args={[0.012 + 0.006 * yellow, hgt, 6]} />
                <meshStandardMaterial color={flameColor} emissive={flameColor} emissiveIntensity={1.4} transparent opacity={0.9} />
              </mesh>
            );
          })
        : null}
      {flame > 0.02 ? <pointLight position={[BURNER.x, BURNER.y + 0.1, BURNER.z + 0.1]} intensity={0.8 * flame} distance={1.2} color={yellow > 0.5 ? "#ffcf6b" : "#7fb8ff"} /> : null}
      {/* fuligem subindo */}
      {s.soot > 0.02
        ? Array.from({ length: 10 }).map((_, i) => {
            const t = (frame / 30 + i / 10) % 1;
            return (
              <mesh key={i} position={[BURNER.x + 0.07 * Math.sin(i * 2.3), BURNER.y + 0.05 + t * 0.12, BURNER.z + 0.07 * Math.cos(i * 1.7)]} scale={clamp(s.soot, 0, 1)}>
                <sphereGeometry args={[0.008, 6, 4]} />
                <meshStandardMaterial color="#1b1b1b" transparent opacity={1 - t} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Partículas de gás (amarelo-claro) e de ar (azul) — sem estado, por fase do frame. */
export const Particles: React.FC<{ s: StoveState; frame: number }> = ({ s, frame }) => {
  const items = [];
  const gasOn = clamp(s.gas, 0, 1) * (1 - clamp(s.safetyClose, 0, 1));
  const inside = clamp(Math.max(s.cut, s.valveShow), 0, 1) > 0.3;
  if (gasOn > 0.02) {
    for (let i = 0; i < 14; i++) {
      const t = (frame / 50 + i / 14) % 1;
      if (inside) items.push({ p: pathAt(GAS_PATH, t), c: GAS, r: 0.011 });
      // saindo pelos furinhos: sobe e se espalha quando não há chama (vazamento)
      const a = (i / 14) * Math.PI * 2 + frame / 60;
      const free = clamp(Math.max(s.leak, s.flame < 0.05 ? 1 : 0), 0, 1);
      if (free > 0.05) {
        const tt = (frame / 40 + i / 14) % 1;
        items.push({ p: [BURNER.x + (BURNER.r + tt * 0.12) * Math.cos(a), BURNER.y + 0.02 + tt * 0.25, BURNER.z + (BURNER.r + tt * 0.12) * Math.sin(a)] as Vec3, c: GAS, r: 0.012 * (1 - tt * 0.5) });
      }
    }
  }
  if (s.air > 0.02 && inside) {
    for (let i = 0; i < 10; i++) {
      const t = (frame / 35 + i / 10) % 1;
      const from: Vec3 = [SPOT.airWindow[0] - 0.22 + randRange(`ax${i}`, -0.03, 0.03), SPOT.airWindow[1] + randRange(`ay${i}`, -0.04, 0.04), SPOT.airWindow[2] + 0.12];
      const p: Vec3 = t < 0.6 ? [lerp(from[0], SPOT.airWindow[0], t / 0.6), lerp(from[1], SPOT.airWindow[1], t / 0.6), lerp(from[2], SPOT.airWindow[2], t / 0.6)] : [SPOT.airWindow[0], lerp(SPOT.airWindow[1], SPOT.tubeTop[1], (t - 0.6) / 0.4), SPOT.airWindow[2]];
      items.push({ p, c: AIR, r: 0.01 * clamp(s.air, 0, 1) });
    }
  }
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={it.p}>
          <sphereGeometry args={[it.r, 8, 6]} />
          <meshStandardMaterial color={it.c} emissive={it.c} emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
};

/** Panela de sopa sobre a grade (fundo escurece com fuligem). */
export const SoupPot: React.FC<{ place: number; soot: number; serve: number; xray: number }> = ({ place, soot, serve, xray }) => {
  if (place <= 0.001) return null;
  const k = clamp(place, 0, 1.1);
  return (
    <group position={[SPOT.pot[0], SPOT.pot[1] + (1 - clamp(place, 0, 1)) * 0.4, SPOT.pot[2]]} scale={k}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.14, 0.14, 18, 1, true]} />
        <meshStandardMaterial {...METAL} color="#c3cad1" side={DoubleSide} transparent={xray > 0.01} opacity={1 - 0.75 * clamp(xray, 0, 1)} depthWrite={xray < 0.01} />
      </mesh>
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.008, 18]} />
        <meshStandardMaterial {...METAL} color={soot > 0.3 ? "#2a2a2a" : "#9aa3ab"} transparent={xray > 0.01} opacity={1 - 0.6 * clamp(xray, 0, 1)} />
      </mesh>
      {serve < 0.5 ? (
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.135, 0.135, 0.01, 18]} />
          <meshStandardMaterial {...MATTE} color="#e07a3c" />
        </mesh>
      ) : null}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.17, 0.11, 0]}>
          <boxGeometry args={[0.05, 0.015, 0.03]} />
          <meshStandardMaterial {...MATTE} color="#1f2328" />
        </mesh>
      ))}
    </group>
  );
};

/** Botijão com mangueira até o fogão. */
export const Cylinder: React.FC<{ pop: number; smell: number; frame: number }> = ({ pop, smell, frame }) => (
  <group>
    <group position={SPOT.cylinder}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.5, 16]} />
        <meshStandardMaterial {...MATTE} color="#2f6fd6" emissive="#2f6fd6" emissiveIntensity={0.15 * clamp(pop, 0, 1)} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial {...MATTE} color="#2f6fd6" />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <torusGeometry args={[0.1, 0.018, 6, 16]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
        <meshStandardMaterial {...METAL} color="#c9a227" />
      </mesh>
    </group>
    <Pipe a={[SPOT.cylinder[0], 0.74, SPOT.cylinder[2]]} b={[STOVE.x + STOVE.w / 2 + 0.05, 0.5, STOVE.z - 0.2]} r={0.012} color="#3a3a3a" />
    {smell > 0.01
      ? Array.from({ length: 6 }).map((_, i) => {
          const t = (frame / 45 + i / 6) % 1;
          return (
            <mesh key={i} position={[SPOT.cylinder[0] - 0.1 + 0.06 * Math.sin(frame / 10 + i), 0.85 + t * 0.6, SPOT.cylinder[2] + 0.05]} rotation={[0, 0, Math.PI / 2]} scale={(0.6 + t) * clamp(smell, 0, 1)}>
              <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
              <meshStandardMaterial color="#b5d33a" emissive="#b5d33a" emissiveIntensity={0.7} transparent opacity={0.85 * (1 - t)} depthWrite={false} />
            </mesh>
          );
        })
      : null}
  </group>
);

/** Ícone flutuante desenhado em canvas (✖ vermelho, nariz, nariz com "!"). */
export const Icon: React.FC<{ kind: "x" | "nose" | "noseAlert"; at: Vec3; yaw: number; k: number; size?: number }> = ({ kind, at, yaw, k, size = 0.14 }) => {
  const map = useCanvasTexture(`icon-${kind}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = kind === "x" ? PALETTE.negative : "#ffffff";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = "round";
    if (kind === "x") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(78, 78);
      ctx.lineTo(178, 178);
      ctx.moveTo(178, 78);
      ctx.lineTo(78, 178);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#e7b48a";
      ctx.beginPath();
      ctx.moveTo(120, 50);
      ctx.quadraticCurveTo(160, 150, 175, 175);
      ctx.quadraticCurveTo(150, 200, 110, 190);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8a5a3c";
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = kind === "noseAlert" ? PALETTE.warning : PALETTE.negative;
      ctx.font = `900 90px ${FONT}, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(kind === "noseAlert" ? "!" : "✕", 70, 110);
    }
  });
  if (k <= 0.001) return null;
  return (
    <mesh position={at} rotation={[0, yaw, 0]} scale={clamp(k, 0, 1.2)}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} />
    </mesh>
  );
};

/** Rajada de vento: linhas brancas passando da esquerda para a direita. */
export const Wind: React.FC<{ k: number; frame: number }> = ({ k, frame }) => {
  if (k <= 0.01 || k >= 0.999) return null;
  const sweep = clamp(k, 0, 1);
  return (
    <group>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[BURNER.x - 0.5 + sweep * 1.0 + (i % 2) * 0.08, BURNER.y + 0.04 + i * 0.025, BURNER.z + 0.05 * Math.sin(i + frame / 6)]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.004, 0.004, 0.22, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} transparent opacity={0.85 * (1 - Math.abs(sweep - 0.5) * 1.6)} />
        </mesh>
      ))}
    </group>
  );
};
