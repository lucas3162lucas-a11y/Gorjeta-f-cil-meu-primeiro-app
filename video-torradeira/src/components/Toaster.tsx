import { DoubleSide } from "three";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { SLOTS, SPOT, TOASTER } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";

// Torradeira em corte: carcaça translúcida, resistências em zigue-zague (cinza → vermelho), corrente,
// fatias de pão (bege → dourado → escuro), alavanca, eletroímã, mola, botão de tempo e bandeja.
// Tudo é função pura do frame e do estado vindo das trilhas.

export type ToasterState = {
  rise: number;
  cut: number;
  heat: number;
  glow: number;
  current: number;
  breadDrop: number;
  breadPop: number;
  toast: number;
  heatBoth: number;
  smoke: number;
  knob: number;
  knobHi: number;
  timerShow: number;
  timerRun: number;
  lever: number;
  magnet: number;
  tray: number;
  crumbs: number;
};

/** Cor da resistência: cinza → laranja → vermelho brilhante. */
const wireColor = (h: number) => {
  const k = clamp(h, 0, 1);
  return `rgb(${Math.round(lerp(140, 255, k))},${Math.round(lerp(140, 70 + 40 * (1 - k), k))},${Math.round(lerp(150, 30, k))})`;
};

/** Cor do pão: bege → dourado → quase carvão. */
export const breadColor = (t: number) => {
  const k = clamp(t, 0, 1);
  if (k < 0.6) {
    const u = k / 0.6;
    return `rgb(${Math.round(lerp(240, 214, u))},${Math.round(lerp(222, 150, u))},${Math.round(lerp(180, 70, u))})`;
  }
  const u = (k - 0.6) / 0.4;
  return `rgb(${Math.round(lerp(214, 60, u))},${Math.round(lerp(150, 40, u))},${Math.round(lerp(70, 25, u))})`;
};

/** Caminho da resistência em serpentina (linhas horizontais ao longo da fenda, ligadas nas pontas). */
const ROWS = 6;
const serpentine = (x: number): Vec3[] => {
  const pts: Vec3[] = [];
  const z0 = TOASTER.z - 0.085;
  const z1 = TOASTER.z + 0.085;
  for (let i = 0; i < ROWS; i++) {
    const yy = TOASTER.y + 0.06 + (i / (ROWS - 1)) * 0.13;
    const [za, zb] = i % 2 === 0 ? [z0, z1] : [z1, z0];
    pts.push([x, yy, za], [x, yy, zb]);
  }
  return pts;
};

const pointOn = (pts: Vec3[], u: number): Vec3 => {
  const n = pts.length - 1;
  const xx = clamp(u, 0, 0.9999) * n;
  const i = Math.floor(xx);
  const f = xx - i;
  return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), lerp(pts[i][2], pts[i + 1][2], f)];
};

/** Resistência desenhada como serpentina de segmentos retos. */
const Zigzag: React.FC<{ x: number; color: string; emissive: number; r?: number }> = ({ x, color, emissive, r = 0.0045 }) => {
  const pts = serpentine(x);
  return (
    <group>
      {pts.slice(0, -1).map((a, i) => {
        const bb = pts[i + 1];
        const len = Math.hypot(bb[1] - a[1], bb[2] - a[2]);
        const ang = Math.atan2(bb[2] - a[2], bb[1] - a[1]);
        return (
          <mesh key={i} position={[x, (a[1] + bb[1]) / 2, (a[2] + bb[2]) / 2]} rotation={[ang, 0, 0]}>
            <cylinderGeometry args={[r, r, len, 5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} />
          </mesh>
        );
      })}
    </group>
  );
};

export const WIRE_XS = SLOTS.flatMap((sx) => [sx - 0.028, sx + 0.028]);

export const ToasterBody: React.FC<{ s: ToasterState; frame: number }> = ({ s, frame }) => {
  const { x, y, z, w, h, d } = TOASTER;
  const k = clamp(s.rise, 0, 1.1);
  if (k <= 0.001) return null;
  const cut = clamp(s.cut, 0, 1);
  const wHeat = clamp(Math.max(s.heat, s.glow), 0, 1);
  const wc = wireColor(wHeat);
  const breadY = y + 0.05 + 0.065 + (1 - clamp(s.breadDrop, 0, 1)) * 0.3 + 0.09 * clamp(s.breadPop, 0, 1.15);
  const leverY = y + 0.2 - 0.14 * clamp(s.lever, 0, 1);
  const springLen = 0.06 + 0.06 * (1 - clamp(s.lever, 0, 1));
  return (
    <group scale={[1, k, 1]} position={[0, (1 - k) * -0.3, 0]}>
      {/* carcaça (translúcida no corte) */}
      <mesh position={[x, y + h / 2, z]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...METAL} color="#d8dde2" transparent opacity={1 - 0.82 * cut} depthWrite={cut < 0.05} side={DoubleSide} />
      </mesh>
      {/* fendas no topo */}
      {SLOTS.map((sx) => (
        <mesh key={sx} position={[sx, y + h + 0.001, z]}>
          <boxGeometry args={[0.035, 0.002, d - 0.04]} />
          <meshStandardMaterial {...MATTE} color="#1f2328" />
        </mesh>
      ))}
      {/* pés */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[x + (sx * w) / 2.4, y + 0.005, z + (sz * d) / 2.4]}>
            <boxGeometry args={[0.03, 0.01, 0.03]} />
            <meshStandardMaterial {...MATTE} color="#333" />
          </mesh>
        )),
      )}
      {/* resistências dos dois lados de cada fenda */}
      {WIRE_XS.map((wx) => (
        <Zigzag key={wx} x={wx} color={wc} emissive={0.15 + 1.3 * wHeat} />
      ))}
      {/* fatias de pão */}
      {s.breadDrop > 0.01
        ? SLOTS.map((sx) => (
            <mesh key={sx} position={[sx, breadY, z]} castShadow>
              <boxGeometry args={[0.018, 0.13, 0.13]} />
              <meshStandardMaterial {...MATTE} color={breadColor(s.toast)} />
            </mesh>
          ))
        : null}
      {/* ondas de calor dos dois lados das fatias */}
      {s.heatBoth > 0.01
        ? WIRE_XS.map((wx, i) =>
            [0, 1, 2].map((j) => {
              const t = (frame / 25 + j / 3 + i * 0.13) % 1;
              const dir = i % 2 === 0 ? 1 : -1;
              return (
                <mesh key={`${i}-${j}`} position={[wx + dir * t * 0.02, y + 0.12, z]} rotation={[0, Math.PI / 2, 0]} scale={(0.5 + 0.5 * t) * clamp(s.heatBoth, 0, 1)}>
                  <torusGeometry args={[0.035, 0.003, 4, 12, Math.PI]} />
                  <meshStandardMaterial color="#ff9a3c" emissive="#ff9a3c" emissiveIntensity={1} transparent opacity={0.8 * (1 - t)} depthWrite={false} />
                </mesh>
              );
            }),
          )
        : null}
      {/* fumaça de queimado */}
      {s.smoke > 0.01
        ? Array.from({ length: 8 }).map((_, i) => {
            const t = (frame / 40 + i / 8) % 1;
            return (
              <mesh key={i} position={[SLOTS[i % 2] + 0.02 * Math.sin(frame / 12 + i), y + h + 0.03 + t * 0.35, z + 0.03 * Math.cos(i)]} scale={(0.6 + t) * clamp(s.smoke, 0, 1)}>
                <sphereGeometry args={[0.03, 8, 6]} />
                <meshStandardMaterial color="#555b61" transparent opacity={0.5 * (1 - t)} depthWrite={false} />
              </mesh>
            );
          })
        : null}
      {/* corrente: partículas amarelas correndo pelo fio */}
      {s.current > 0.01
        ? WIRE_XS.map((wx, i) =>
            [0, 1, 2].map((j) => {
              const t = (frame / 30 + j / 3 + i * 0.21) % 1;
              const p = pointOn(serpentine(wx), t);
              return (
                <mesh key={`${i}-${j}`} position={p} scale={clamp(s.current, 0, 1)}>
                  <sphereGeometry args={[0.007, 6, 4]} />
                  <meshStandardMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={1.3} />
                </mesh>
              );
            }),
          )
        : null}
      {/* alavanca (lado direito) */}
      <mesh position={[SPOT.lever[0], leverY, SPOT.lever[2]]}>
        <boxGeometry args={[0.02, 0.025, 0.06]} />
        <meshStandardMaterial {...MATTE} color="#1f2328" />
      </mesh>
      {/* eletroímã: bobina que brilha em azul quando liga */}
      <mesh position={SPOT.magnet} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.04, 12]} />
        <meshStandardMaterial {...METAL} color="#b87333" emissive="#4fa3ff" emissiveIntensity={1.4 * clamp(s.magnet, 0, 1)} />
      </mesh>
      {/* mola: espiral vertical que comprime com a alavanca */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[SPOT.spring[0], SPOT.spring[1] + (i / 7) * springLen, SPOT.spring[2]]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.012, 0.0025, 4, 10]} />
          <meshStandardMaterial {...METAL} color="#c9d1d8" emissive="#3be37a" emissiveIntensity={0.6 * clamp(s.breadPop, 0, 1) * (1 - clamp(s.lever, 0, 1))} />
        </mesh>
      ))}
      {/* botão de tempo (frente, à direita) e barra de tempo sem números */}
      <group position={SPOT.knob} rotation={[Math.PI / 2, 0, -clamp(s.knob, 0, 1) * 2.4]}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
          <meshStandardMaterial {...MATTE} color="#1f2328" emissive={PALETTE.info} emissiveIntensity={0.7 * clamp(s.knobHi, 0, 1)} />
        </mesh>
        <mesh position={[0, 0.008, 0.009]}>
          <boxGeometry args={[0.004, 0.004, 0.016]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {s.timerShow > 0.01 ? (
        <group position={[SPOT.knob[0] + 0.045, SPOT.knob[1] + 0.02, SPOT.knob[2] + 0.004]} scale={clamp(s.timerShow, 0, 1)}>
          <mesh>
            <planeGeometry args={[0.014, 0.1]} />
            <meshBasicMaterial color="#1f2328" toneMapped={false} />
          </mesh>
          {(() => {
            const full = (0.25 + 0.75 * clamp(s.knob, 0, 1)) * (1 - clamp(s.timerRun, 0, 1));
            return (
              <mesh position={[0, -0.05 + 0.05 * full, 0.001]}>
                <planeGeometry args={[0.01, 0.1 * full + 0.0001]} />
                <meshBasicMaterial color={PALETTE.info} toneMapped={false} />
              </mesh>
            );
          })()}
        </group>
      ) : null}
      {/* bandeja de migalhas */}
      <mesh position={[x, y + 0.012, z + clamp(s.tray, 0, 1) * 0.16]}>
        <boxGeometry args={[w - 0.03, 0.01, d - 0.02]} />
        <meshStandardMaterial {...METAL} color="#9aa5b1" emissive="#3be37a" emissiveIntensity={0.4 * clamp(s.tray, 0, 1)} />
      </mesh>
      {s.crumbs > 0.01
        ? Array.from({ length: 14 }).map((_, i) => {
            const fall = clamp(s.crumbs * 1.4 - (i / 14) * 0.4, 0, 1);
            return (
              <mesh key={i} position={[SLOTS[i % 2] + ((i * 7) % 5) * 0.006 - 0.012, lerp(y + 0.1, y + 0.022, fall), z - 0.07 + ((i * 3) % 7) * 0.02 + clamp(s.tray, 0, 1) * 0.16 * fall]}>
                <boxGeometry args={[0.008, 0.006, 0.008]} />
                <meshStandardMaterial {...MATTE} color="#b07a3c" />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Fio de cobre comum derretendo (esquemático). */
export const BadWire: React.FC<{ pop: number; melt: number; out: number; frame: number }> = ({ pop, melt, out, frame }) => {
  const k = clamp(pop, 0, 1.1) * (1 - clamp(out, 0, 1));
  if (k <= 0.001) return null;
  const m = clamp(melt, 0, 1);
  const col = `rgb(${Math.round(lerp(200, 255, m))},${Math.round(lerp(120, 70, m))},${Math.round(lerp(60, 30, m))})`;
  return (
    <group position={SPOT.badWire} scale={k}>
      {Array.from({ length: 7 }).map((_, i) => {
        const xx = (i - 3) * 0.03;
        const sag = m * 0.03 * Math.sin((i / 6) * Math.PI);
        return (
          <mesh key={i} position={[xx, -sag, 0]} rotation={[0, 0, Math.PI / 2 + (i % 2 ? 0.5 : -0.5) * (1 - m * 0.6)]}>
            <cylinderGeometry args={[0.004, 0.004, 0.035, 5]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.6 + m} />
          </mesh>
        );
      })}
      {m > 0.4
        ? [-0.03, 0.03].map((dx, i) => {
            const t = ((frame / 30 + i * 0.5) % 1) * clamp((m - 0.4) / 0.6, 0, 1);
            return (
              <mesh key={dx} position={[dx, -0.04 - t * 0.08, 0]}>
                <sphereGeometry args={[0.006, 6, 4]} />
                <meshStandardMaterial color="#ff8a3c" emissive="#ff5a00" emissiveIntensity={1} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Ícone de tomada desligada (canvas). */
export const UnplugIcon: React.FC<{ at: Vec3; yaw: number; k: number }> = ({ at, yaw, k }) => {
  const map = useCanvasTexture("unplug", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.warning;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1d1a0c";
    ctx.fillRect(86, 70, 18, 46);
    ctx.fillRect(152, 70, 18, 46);
    ctx.beginPath();
    ctx.roundRect(70, 110, 116, 70, 18);
    ctx.fill();
    ctx.fillRect(118, 180, 20, 40);
    ctx.strokeStyle = PALETTE.negative;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(40, 216);
    ctx.lineTo(216, 40);
    ctx.stroke();
  });
  if (k <= 0.001) return null;
  return (
    <mesh position={at} rotation={[0, yaw, 0]} scale={clamp(k, 0, 1.2)}>
      <planeGeometry args={[0.12, 0.12]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} />
    </mesh>
  );
};
