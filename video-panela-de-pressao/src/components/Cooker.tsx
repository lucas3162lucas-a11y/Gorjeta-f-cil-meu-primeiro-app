import { DoubleSide } from "three";
import { FONT, MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, randRange, type Vec3 } from "../utils/animation";
import { POT, POT_TOP, SPOT } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";

// Panela de pressão em corte: corpo, água com bolhas, feijão, vapor (preso ou escapando), tampa com
// borracha, pino com peso, válvula de segurança, termômetro com a marca de 100 °C e manômetro sem números.
// Tudo é função pura do frame e do estado vindo das trilhas.

const STEEL = "#c3cad1";

export type CookerState = {
  cut: number;
  boil: number;
  steamOut: number;
  trapped: number;
  density: number;
  beansIn: number;
  beansCook: number;
  lidDrop: number;
  lidLock: number;
  lidOpen: number;
  gasket: number;
};

export const Stove: React.FC<{ flame: number; frame: number }> = ({ flame, frame }) => (
  <group position={SPOT.stove}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.9, 0.64]} />
      <meshStandardMaterial {...METAL} color="#d9dee3" />
    </mesh>
    <mesh position={[0, 0.91, 0]}>
      <boxGeometry args={[0.92, 0.03, 0.66]} />
      <meshStandardMaterial {...MATTE} color="#2d3238" />
    </mesh>
    <mesh position={[0, 0.45, 0.325]}>
      <boxGeometry args={[0.66, 0.45, 0.02]} />
      <meshStandardMaterial {...MATTE} color="#3a3f46" />
    </mesh>
    {[-0.25, 0.25].map((x) => (
      <mesh key={x} position={[x, 0.8, 0.335]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
        <meshStandardMaterial {...MATTE} color="#1f2328" />
      </mesh>
    ))}
    {flame > 0.01
      ? Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const h = (0.07 + 0.025 * Math.sin(frame / 3 + i * 1.7)) * clamp(flame, 0, 1.2);
          return (
            <mesh key={i} position={[0.16 * Math.cos(a), 0.92 + h / 2, POT.z - SPOT.stove[2] + 0.16 * Math.sin(a)]}>
              <coneGeometry args={[0.028, h, 6]} />
              <meshStandardMaterial color="#5fb8ff" emissive="#2f7df6" emissiveIntensity={1.3} />
            </mesh>
          );
        })
      : null}
  </group>
);

/** Corpo da panela; com `cut` a metade da frente some e mostra o interior. */
export const CookerBody: React.FC<{ s: CookerState; frame: number }> = ({ s, frame }) => {
  const cut = clamp(s.cut, 0, 1);
  // metade de trás sempre; metade da frente só sem corte (transparência cruzada)
  const waterH = 0.17;
  const steamCount = Math.round(4 + 10 * clamp(s.density, 0, 1));
  return (
    <group position={[POT.x, POT.y, POT.z]}>
      <mesh position={[0, POT.h / 2, 0]}>
        <cylinderGeometry args={[POT.r + 0.01, POT.r, POT.h, 24, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial {...METAL} color={STEEL} side={DoubleSide} />
      </mesh>
      {cut < 0.99 ? (
        <mesh position={[0, POT.h / 2, 0]}>
          <cylinderGeometry args={[POT.r + 0.01, POT.r, POT.h, 24, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial {...METAL} color={STEEL} side={DoubleSide} transparent={cut > 0.01} opacity={1 - cut} depthWrite={cut < 0.01} />
        </mesh>
      ) : null}
      {/* fundo e cabo longo */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[POT.r, POT.r, 0.02, 24]} />
        <meshStandardMaterial {...METAL} color="#9aa3ab" />
      </mesh>
      <mesh position={[-POT.r - 0.17, POT.h - 0.04, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.06]} />
        <meshStandardMaterial {...MATTE} color="#1f2328" />
      </mesh>
      {/* água (vista melhor em corte) */}
      <mesh position={[0, waterH / 2 + 0.02, 0]}>
        <cylinderGeometry args={[POT.r - 0.01, POT.r - 0.01, waterH, 24]} />
        <meshStandardMaterial color="#6fc3f2" transparent opacity={0.35 + 0.35 * cut} depthWrite={false} />
      </mesh>
      {/* feijão: escuro e anguloso → claro e redondo */}
      {s.beansIn > 0.01
        ? Array.from({ length: 16 }).map((_, i) => {
            const a = randRange(`ba${i}`, 0, Math.PI * 2);
            const r = randRange(`br${i}`, 0.02, POT.r - 0.05);
            const fall = (1 - clamp(s.beansIn * 1.3 - i * 0.02, 0, 1)) * 0.6;
            const c = clamp(s.beansCook, 0, 1);
            const col = `rgb(${Math.round(lerp(92, 150, c))},${Math.round(lerp(48, 88, c))},${Math.round(lerp(34, 58, c))})`;
            return (
              <mesh key={i} position={[r * Math.cos(a), 0.04 + (i % 3) * 0.022 + fall, r * Math.sin(a)]} rotation={[a, a * 2, 0]} scale={[1.3, 0.8 + 0.2 * c, 0.9]}>
                {c > 0.5 ? <sphereGeometry args={[0.022, 8, 6]} /> : <icosahedronGeometry args={[0.022, 0]} />}
                <meshStandardMaterial {...MATTE} color={col} />
              </mesh>
            );
          })
        : null}
      {/* bolhas subindo */}
      {s.boil > 0.01
        ? Array.from({ length: 12 }).map((_, i) => {
            const t = (frame / 22 + i / 12) % 1;
            const a = (i * 2.4) % (Math.PI * 2);
            return (
              <mesh key={i} position={[0.12 * Math.cos(a) * (1 - t * 0.3), 0.03 + t * waterH, 0.12 * Math.sin(a)]} scale={clamp(s.boil, 0, 1) * (0.5 + t)}>
                <sphereGeometry args={[0.012, 6, 4]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
              </mesh>
            );
          })
        : null}
      {/* vapor preso dentro: nuvens mais numerosas e juntas quando a pressão sobe */}
      {s.trapped > 0.01
        ? Array.from({ length: steamCount }).map((_, i) => {
            const a = randRange(`st${i}`, 0, Math.PI * 2);
            const r = randRange(`sr${i}`, 0, POT.r - 0.06);
            const y = waterH + 0.04 + randRange(`sy${i}`, 0, POT.h - waterH - 0.06) + 0.008 * Math.sin(frame / 12 + i);
            return (
              <mesh key={i} position={[r * Math.cos(a), y, r * Math.sin(a)]} scale={clamp(s.trapped, 0, 1) * (0.8 + 0.4 * clamp(s.density, 0, 1))}>
                <sphereGeometry args={[0.035, 8, 6]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Vapor saindo da panela aberta (sobe e some no ar). */
export const OpenSteam: React.FC<{ amount: number; escape: number; frame: number }> = ({ amount, escape, frame }) => {
  const k = clamp(Math.max(amount * (1 - escape * 0), escape), 0, 1);
  if (k <= 0.01) return null;
  const height = 0.5 + 0.9 * clamp(escape, 0, 1);
  return (
    <group position={[POT.x, POT_TOP, POT.z]}>
      {Array.from({ length: 14 }).map((_, i) => {
        const t = (frame / 45 + i / 14) % 1;
        const dx = 0.12 * Math.sin(i * 1.9 + frame / 20) + t * 0.2 * clamp(escape, 0, 1);
        return (
          <mesh key={i} position={[dx, t * height, 0.08 * Math.cos(i * 2.3)]} scale={(0.6 + t * 1.4) * k}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5 * (1 - t)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Lid: React.FC<{ s: CookerState; valveLift: number; valveWobble: number; clog: number; safety: number; frame: number; valveCut: number }> = ({
  s,
  valveLift,
  valveWobble,
  clog,
  safety,
  frame,
  valveCut,
}) => {
  const xMap = useCanvasTexture("clogX", 128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = PALETTE.negative;
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(w - 24, h - 24);
    ctx.moveTo(w - 24, 24);
    ctx.lineTo(24, h - 24);
    ctx.stroke();
  });
  const drop = clamp(s.lidDrop, 0, 1.1);
  if (drop <= 0.001) return null;
  const y = POT_TOP + (1 - clamp(drop, 0, 1)) * 0.55 + clamp(s.lidOpen, 0, 1) * 0.45;
  const x = POT.x - clamp(s.lidOpen, 0, 1) * 0.35;
  const twist = (1 - clamp(s.lidLock, 0, 1)) * 0.6;
  const wob = valveWobble * 0.16 * Math.sin(frame * 0.42);
  const lift = 0.03 * clamp(valveLift, 0, 1) + valveWobble * 0.01 * Math.max(0, Math.sin(frame * 0.42));
  return (
    <group position={[x, y, POT.z]} rotation={[0, twist, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[POT.r + 0.025, POT.r + 0.03, 0.04, 24]} />
        <meshStandardMaterial {...METAL} color={STEEL} transparent={s.cut > 0.01} opacity={1 - 0.55 * clamp(s.cut, 0, 1)} />
      </mesh>
      {/* cabo da tampa (alinha com o cabo da panela quando trava) */}
      <mesh position={[-POT.r - 0.15, 0.03, 0]}>
        <boxGeometry args={[0.28, 0.035, 0.055]} />
        <meshStandardMaterial {...MATTE} color="#2a2e33" />
      </mesh>
      {/* borracha de vedação */}
      <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[POT.r + 0.005, 0.012, 6, 32]} />
        <meshStandardMaterial {...MATTE} color={s.gasket > 0.3 ? PALETTE.positive : "#3a3a3a"} emissive={PALETTE.positive} emissiveIntensity={0.9 * s.gasket} />
      </mesh>
      {/* pino com peso (válvula de pressão) */}
      <group position={[0, 0.04 + lift, 0]} rotation={[0, 0, wob]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
          <meshStandardMaterial {...METAL} color="#e0e5ea" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.05, 12]} />
          <meshStandardMaterial {...METAL} color={clog > 0.5 ? "#7d858d" : "#3b4148"} transparent={valveCut > 0.01} opacity={1 - 0.6 * clamp(valveCut, 0, 1)} />
        </mesh>
        {valveCut > 0.01 ? (
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.07, 6]} />
            <meshStandardMaterial color="#ffffff" emissive="#9fdcff" emissiveIntensity={0.9} />
          </mesh>
        ) : null}
        {clog > 0.01 ? (
          <mesh position={[0, 0.06, 0.05]} scale={clamp(clog, 0, 1)}>
            <planeGeometry args={[0.08, 0.08]} />
            <meshBasicMaterial map={xMap} transparent toneMapped={false} />
          </mesh>
        ) : null}
      </group>
      {/* válvula de segurança */}
      <mesh position={[SPOT.safety[0] - POT.x, 0.05, SPOT.safety[2] - POT.z]}>
        <cylinderGeometry args={[0.018, 0.022, 0.03, 10]} />
        <meshStandardMaterial {...MATTE} color="#e85d3a" emissive="#ff8a3c" emissiveIntensity={0.9 * safety} />
      </mesh>
    </group>
  );
};

/** Jato de vapor saindo de um ponto (pino ou válvula de segurança). */
export const Jet: React.FC<{ at: Vec3; k: number; frame: number; pulse?: number }> = ({ at, k, frame, pulse = 0 }) => {
  if (k <= 0.01) return null;
  const p = pulse > 0 ? 0.6 + 0.4 * Math.max(0, Math.sin(frame * 0.42)) : 1;
  return (
    <group position={at}>
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (frame / 14 + i / 9) % 1;
        return (
          <mesh key={i} position={[0.02 * Math.sin(i * 2.1), 0.03 + t * 0.32, 0.02 * Math.cos(i * 1.3)]} scale={(0.4 + t * 1.3) * clamp(k, 0, 1) * p}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75 * (1 - t)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Termômetro com uma única marca: 100 °C. `level` 0,62 = na marca. */
export const Thermometer: React.FC<{ level: number; pop: number }> = ({ level, pop }) => {
  const mark = useCanvasTexture("mark100", 256, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(10,20,32,0.85)";
    ctx.beginPath();
    ctx.roundRect(4, 8, w - 8, h - 16, 24);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 54px ${FONT}, sans-serif`;
    ctx.fillText("100 °C", w / 2, h / 2 + 2);
  });
  if (pop <= 0.001) return null;
  const L = 0.42;
  const l = clamp(level, 0.05, 1);
  const color = l > 0.64 ? "#ff3c2e" : "#ff8a3c";
  return (
    <group position={SPOT.thermo} scale={clamp(pop, 0, 1.2)}>
      <mesh position={[0, 0.06 + L / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, L, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.06 + (L * l) / 2, 0]}>
        <cylinderGeometry args={[0.017, 0.017, L * l, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* marca de 100 °C */}
      <mesh position={[0, 0.06 + L * 0.62, 0]}>
        <boxGeometry args={[0.09, 0.006, 0.006]} />
        <meshStandardMaterial color="#1f2328" />
      </mesh>
      <mesh position={[-0.13, 0.06 + L * 0.62, 0.01]}>
        <planeGeometry args={[0.18, 0.068]} />
        <meshBasicMaterial map={mark} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Manômetro sem números: ponteiro 0 (baixo) → 1 (vermelho). `alert` pisca devagar a faixa vermelha. */
export const Gauge: React.FC<{ needle: number; pop: number; alert: number; yaw: number; frame: number }> = ({ needle, pop, alert, yaw, frame }) => {
  const map = useCanvasTexture("gauge", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 24;
    const seg = (a0: number, a1: number, c: string) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 92, a0, a1);
      ctx.stroke();
    };
    seg(Math.PI * 0.75, Math.PI * 1.5, "#4fc3ff");
    seg(Math.PI * 1.5, Math.PI * 1.95, "#f8c815");
    seg(Math.PI * 1.95, Math.PI * 2.25, "#e5383b");
    ctx.fillStyle = "#1f3b57";
    ctx.textAlign = "center";
    ctx.font = `900 30px ${FONT}, sans-serif`;
    ctx.fillText("PRESSÃO", w / 2, h / 2 + 72);
  });
  if (pop <= 0.001) return null;
  const ang = Math.PI * 0.75 + clamp(needle, 0, 1) * Math.PI * 1.5;
  const blink = alert * (0.5 + 0.5 * Math.sin(frame * 0.2));
  return (
    <group position={SPOT.gauge} rotation={[0, yaw, 0]} scale={clamp(pop, 0, 1.2)}>
      <mesh position={[0, -0.12, -0.02]}>
        <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.025, 20]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" emissive="#e5383b" emissiveIntensity={0.8 * blink} />
      </mesh>
      <mesh position={[0, 0, 0.014]}>
        <circleGeometry args={[0.075, 24]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {/* ponteiro com pivô no centro */}
      <group position={[0, 0, 0.02]} rotation={[0, 0, -(ang - Math.PI / 2) + Math.PI]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.008, 0.06, 0.004]} />
          <meshStandardMaterial color="#e5383b" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.006, 10]} />
          <meshStandardMaterial color="#1f2328" />
        </mesh>
      </group>
    </group>
  );
};
