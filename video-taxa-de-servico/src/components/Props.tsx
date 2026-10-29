import { DoubleSide, type Texture } from "three";
import { FONT, MATTE, METAL, PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { SLICES } from "../utils/layout";
import { roundRect, useCanvasTexture } from "./canvasTexture";

// Objetos com texto e peças do sistema: conta, caixa, pote, disco de rateio, cofre, holerite,
// placa de aviso, balança da lei, prancheta e ícones. Todos recebem o estado pronto (trilhas).

const font = (weight: number, px: number) => `${weight} ${px}px ${FONT}, sans-serif`;
const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

/** Cartão plano com textura (sempre de frente para a câmera via yaw). */
const Card: React.FC<{ map: Texture; w: number; h: number; at: Vec3; yaw: number; scale?: number; tilt?: number }> = ({ map, w, h, at, yaw, scale = 1, tilt = 0 }) => (
  <group position={at} rotation={[tilt, yaw, 0]} scale={scale}>
    <mesh castShadow>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} transparent side={DoubleSide} toneMapped={false} />
    </mesh>
  </group>
);

// ---------------------------------------------------------------- conta
export type BillState = { print: number; serviceLine: number; percent: number; glow: number; toggle: number; off: number; stamp: number };

export const Bill: React.FC<{ at: Vec3; yaw: number; s: BillState }> = ({ at, yaw, s }) => {
  const pct = Math.round(s.percent);
  const lineOn = s.serviceLine > 0.5;
  const tog = s.toggle > 0.5;
  const off = s.off > 0.5;
  const key = `${pct}-${lineOn}-${tog}-${off}`;
  const map = useCanvasTexture(key, 600, 860, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.paper;
    roundRect(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.fill();
    ctx.strokeStyle = "#d7cfbd";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#2b2b2b";
    ctx.textAlign = "center";
    ctx.font = font(900, 64);
    ctx.fillText("CONTA", w / 2, 108);
    ctx.font = font(700, 30);
    ctx.fillStyle = "#7a7468";
    ctx.fillText("Mesa 4 · valores ilustrativos", w / 2, 156);
    ctx.setLineDash([14, 12]);
    ctx.strokeStyle = "#bdb4a2";
    ctx.beginPath();
    ctx.moveTo(40, 196);
    ctx.lineTo(w - 40, 196);
    ctx.stroke();
    ctx.setLineDash([]);
    const row = (y: number, label: string, value: string, color = "#2b2b2b", size = 44) => {
      ctx.fillStyle = color;
      ctx.font = font(800, size);
      ctx.textAlign = "left";
      ctx.fillText(label, 50, y);
      ctx.textAlign = "right";
      ctx.fillText(value, w - 50, y);
    };
    row(290, "Consumo", brl(100));
    if (lineOn) {
      ctx.fillStyle = off ? "#eeeeee" : "#d9f5e1";
      roundRect(ctx, 30, 335, w - 60, 110, 20);
      ctx.fill();
      row(408, `Serviço ${pct}%`, brl(pct), off ? "#9a9a9a" : "#167a3c");
      if (off) {
        ctx.strokeStyle = PALETTE.negative;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(44, 392);
        ctx.lineTo(w - 44, 392);
        ctx.stroke();
      }
    }
    if (tog) {
      // interruptor de opcional
      ctx.fillStyle = off ? "#b9b9b9" : PALETTE.positive;
      roundRect(ctx, w / 2 - 70, 470, 140, 70, 35);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(off ? w / 2 - 35 : w / 2 + 35, 505, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#555";
      ctx.font = font(800, 28);
      ctx.textAlign = "center";
      ctx.fillText("OPCIONAL", w / 2, 580);
    }
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(40, 640);
    ctx.lineTo(w - 40, 640);
    ctx.stroke();
    row(720, "TOTAL", brl(100 + (lineOn && !off ? pct : 0)), "#111", 54);
    ctx.fillStyle = "#c9c1ae";
    for (let x = 30; x < w - 30; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, h - 6);
      ctx.lineTo(x + 20, h - 26);
      ctx.lineTo(x + 40, h - 6);
      ctx.fill();
    }
  });
  const stampMap = useCanvasTexture("stamp", 400, 400, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = PALETTE.negative;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.negative;
    ctx.textAlign = "center";
    ctx.font = font(900, 92);
    ctx.fillText("NÃO É", w / 2, h / 2 - 8);
    ctx.fillText("LEI", w / 2, h / 2 + 88);
  });
  if (s.print <= 0.001) return null;
  const W = 0.78;
  const H = 1.12;
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <group position={[0, (H / 2) * (1 - s.print), 0]} scale={[1, s.print, 1]}>
        {s.glow > 0.01 ? (
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[W + 0.12 * s.glow, H + 0.12 * s.glow]} />
            <meshBasicMaterial color={PALETTE.positive} transparent opacity={0.85 * s.glow} toneMapped={false} />
          </mesh>
        ) : null}
        <mesh castShadow>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={map} transparent side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      {s.stamp > 0.01 ? (
        <mesh position={[0.12, 0.05, 0.02]} rotation={[0, 0, -0.25]} scale={clamp(s.stamp, 0, 1.3)}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial map={stampMap} transparent toneMapped={false} opacity={clamp(s.stamp, 0, 1)} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- caixa registradora e gaveta da gorjeta
const useLabel = (text: string, bg: string, fg = "#ffffff", w = 512, h = 160) =>
  useCanvasTexture(`${text}-${bg}`, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    roundRect(ctx, 4, 4, w - 8, h - 8, 28);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 86;
    ctx.font = font(900, size);
    while (ctx.measureText(text).width > w - 40 && size > 30) {
      size -= 4;
      ctx.font = font(900, size);
    }
    ctx.fillText(text, w / 2, h / 2 + 4);
  });

export const Register: React.FC<{ at: Vec3; drawer: number; mix: number; split: number }> = ({ at, drawer, mix, split }) => {
  const casa = useLabel("CASA", "#4a4f57");
  return (
    <group position={at}>
      <mesh position={[0, 0.17, -0.05]} castShadow>
        <boxGeometry args={[0.62, 0.34, 0.5]} />
        <meshStandardMaterial {...MATTE} color="#454b54" />
      </mesh>
      <mesh position={[0, 0.42, -0.18]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.22, 0.05]} />
        <meshStandardMaterial {...MATTE} color="#2b3036" />
      </mesh>
      <mesh position={[0, 0.425, -0.152]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[0.32, 0.14]} />
        <meshStandardMaterial color="#9fe3b0" emissive="#5fd38a" emissiveIntensity={0.8} />
      </mesh>
      {/* teclado */}
      <mesh position={[0, 0.35, 0.08]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.46, 0.04, 0.2]} />
        <meshStandardMaterial {...MATTE} color="#d8d2c4" />
      </mesh>
      {/* gaveta */}
      <group position={[0, 0.06, 0.12 + drawer * 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.58, 0.1, 0.42]} />
          <meshStandardMaterial {...MATTE} color="#3a3f46" />
        </mesh>
        {mix > 0.05 ? (
          <group scale={clamp(mix, 0, 1)}>
            {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
              <mesh key={x} position={[x, 0.065, (i % 2) * 0.08 - 0.04]} rotation={[0, i, 0]}>
                {i % 2 ? <cylinderGeometry args={[0.06, 0.06, 0.03, 8]} /> : <boxGeometry args={[0.16, 0.03, 0.09]} />}
                <meshStandardMaterial {...MATTE} color={i % 2 ? PALETTE.gold : PALETTE.cash} />
              </mesh>
            ))}
          </group>
        ) : null}
      </group>
      {split > 0.01 ? (
        <mesh position={[0, 0.2, 0.205]} scale={clamp(split, 0, 1)}>
          <planeGeometry args={[0.36, 0.11]} />
          <meshBasicMaterial map={casa} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

export const TipBox: React.FC<{ at: Vec3; scale: number; fill: number; glow: number }> = ({ at, scale, fill, glow }) => {
  const label = useLabel("GORJETA", PALETTE.positive);
  if (scale <= 0.001) return null;
  return (
    <group position={at} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.36, 0.32, 0.36]} />
        <meshStandardMaterial {...MATTE} color="#1f6e43" emissive={PALETTE.positive} emissiveIntensity={0.15 + 0.5 * glow} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[0.38, 0.03, 0.38]} />
        <meshStandardMaterial {...METAL} color={PALETTE.gold} />
      </mesh>
      {Array.from({ length: Math.round(fill * 5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.36 + i * 0.026, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.024, 10]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.gold} emissive={PALETTE.goldDark} emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, 0.185]}>
        <planeGeometry args={[0.34, 0.1]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

export const TipJar: React.FC<{ at: Vec3; drop: number; fill: number }> = ({ at, drop, fill }) => {
  const label = useLabel("GORJETA", PALETTE.positive);
  if (drop <= 0.001) return null;
  return (
    <group position={[at[0], at[1] + (1 - clamp(drop, 0, 1)) * 0.8, at[2]]} scale={clamp(drop, 0, 1.2)}>
      {fill > 0.01 ? (
        <mesh position={[0, 0.02 + fill * 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, fill * 0.4, 12]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.gold} emissive={PALETTE.goldDark} emissiveIntensity={0.3} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.18, 0.17, 0.44, 12, 1, true]} />
        <meshStandardMaterial color="#cdeefc" transparent opacity={0.35} roughness={0.1} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <torusGeometry args={[0.18, 0.02, 6, 16]} />
        <meshStandardMaterial {...METAL} color="#cfd6dc" />
      </mesh>
      <mesh position={[0, 0.2, 0.185]}>
        <planeGeometry args={[0.32, 0.1]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- pilha e disco do rateio
export const TipStack: React.FC<{ at: Vec3; drop: number; form: number; wobble: number }> = ({ at, drop, form, wobble }) => {
  const k = clamp(drop, 0, 1.2) * (1 - clamp(form * 1.4, 0, 1));
  if (k <= 0.001) return null;
  return (
    <group position={[at[0], at[1] + (1 - clamp(drop, 0, 1)) * 1.6, at[2]]} scale={k} rotation={[0, 0, wobble * 0.08]}>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.7) * 0.02, 0.02 + i * 0.045, Math.cos(i * 2.3) * 0.02]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 14]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.gold} emissive={PALETTE.goldDark} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

/** Disco do rateio: fatias de tamanhos diferentes, sem números; a fatia "retida" pode voar até o cofre. */
export const SplitDisc: React.FC<{ at: Vec3; form: number; slices: number; retain: number; vault: Vec3; pulse: number }> = ({ at, form, slices, retain, vault, pulse }) => {
  if (form <= 0.001) return null;
  let start = Math.PI / 2;
  return (
    <group>
      {SLICES.map((sl) => {
        const len = sl.share * Math.PI * 2;
        const mid = start + len / 2;
        const off = 0.09 * clamp(slices, 0, 1);
        let pos: Vec3 = [at[0] + Math.cos(mid) * off, at[1], at[2] - Math.sin(mid) * off];
        let sc = form;
        if (sl.id === "retained" && retain > 0) {
          const t = clamp(retain, 0, 1);
          const target: Vec3 = [vault[0], vault[1] + 0.62, vault[2]];
          pos = [pos[0] + (target[0] - pos[0]) * t, pos[1] + (target[1] - pos[1]) * t + Math.sin(Math.PI * t) * 0.9, pos[2] + (target[2] - pos[2]) * t];
          sc = form * (1 - 0.55 * t);
        }
        const el = (
          <group key={sl.id} position={pos} scale={[sc, 1, sc]}>
            <mesh position={[0, 0.04, 0]} rotation={[0, start, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.62, 0.62, 0.08, 24, 1, false, 0, len]} />
              <meshStandardMaterial {...MATTE} color={sl.color} emissive={sl.color} emissiveIntensity={0.12 + 0.25 * pulse} />
            </mesh>
          </group>
        );
        start += len;
        return el;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- cofre de encargos
export const Vault: React.FC<{ at: Vec3; pop: number; lock: number }> = ({ at, pop, lock }) => {
  const label = useLabel("ENCARGOS", "#2b3036");
  if (pop <= 0.001) return null;
  return (
    <group position={at} scale={clamp(pop, 0, 1.25)}>
      <mesh position={[0, 0.29, 0]} castShadow>
        <boxGeometry args={[0.56, 0.58, 0.5]} />
        <meshStandardMaterial {...METAL} color="#5b6470" />
      </mesh>
      <mesh position={[0, 0.27, 0.252]}>
        <boxGeometry args={[0.44, 0.44, 0.02]} />
        <meshStandardMaterial {...METAL} color="#6f7a87" />
      </mesh>
      <group position={[0, 0.27, 0.27]} rotation={[0, 0, lock * Math.PI * 1.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 10]} />
          <meshStandardMaterial {...METAL} color="#d4d9de" />
        </mesh>
        <mesh position={[0, 0.06, 0.02]}>
          <boxGeometry args={[0.02, 0.06, 0.01]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
      <mesh position={[0.17, 0.44, 0.265]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color={lock > 0.5 ? "#3be37a" : "#e5383b"} emissive={lock > 0.5 ? "#3be37a" : "#e5383b"} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.66, 0.1]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[0.6, 0.19]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- holerite e etiquetas de encargos
export const Payslip: React.FC<{ at: Vec3; yaw: number; rise: number; tipLine: number; inss: number; fgts: number }> = ({ at, yaw, rise, tipLine, inss, fgts }) => {
  const showTip = tipLine > 0.5;
  const map = useCanvasTexture(`slip-${showTip}`, 560, 720, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f6fbff";
    roundRect(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.fill();
    ctx.strokeStyle = "#b9cfe0";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = "#1f3b57";
    ctx.textAlign = "center";
    ctx.font = font(900, 62);
    ctx.fillText("HOLERITE", w / 2, 100);
    ctx.font = font(700, 30);
    ctx.fillStyle = "#6a8299";
    ctx.fillText("Garçom", w / 2, 146);
    const bar = (y: number, label: string, color: string, frac: number) => {
      ctx.fillStyle = color;
      ctx.font = font(800, 42);
      ctx.textAlign = "left";
      ctx.fillText(label, 44, y);
      ctx.fillStyle = color;
      roundRect(ctx, 44, y + 20, (w - 88) * frac, 30, 15);
      ctx.fill();
    };
    bar(250, "Salário", "#3d6f9e", 0.62);
    if (showTip) bar(380, "+ Gorjeta", "#167a3c", 0.4);
    ctx.strokeStyle = "#1f3b57";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(40, 500);
    ctx.lineTo(w - 40, 500);
    ctx.stroke();
    ctx.fillStyle = "#1f3b57";
    ctx.font = font(900, 46);
    ctx.textAlign = "left";
    ctx.fillText("REMUNERAÇÃO", 44, 580);
  });
  const inssMap = useLabel("INSS", PALETTE.negative, "#fff", 300, 140);
  const fgtsMap = useLabel("FGTS", PALETTE.negative, "#fff", 300, 140);
  if (rise <= 0.001) return null;
  const r = clamp(rise, 0, 1.15);
  return (
    <group position={[at[0], at[1] - (1 - clamp(rise, 0, 1)) * 0.5, at[2]]} rotation={[0, yaw, 0]} scale={r}>
      <mesh castShadow>
        <planeGeometry args={[0.66, 0.85]} />
        <meshBasicMaterial map={map} transparent side={DoubleSide} toneMapped={false} />
      </mesh>
      {[
        { k: inss, m: inssMap, y: 0.12 },
        { k: fgts, m: fgtsMap, y: -0.12 },
      ].map(({ k, m, y }, i) =>
        k > 0.01 ? (
          <group key={i} position={[y * 1.4, -0.52 - 0.08 * clamp(k, 0, 1), 0.02]} scale={clamp(k, 0, 1.2)}>
            <mesh>
              <planeGeometry args={[0.3, 0.14]} />
              <meshBasicMaterial map={m} transparent toneMapped={false} />
            </mesh>
          </group>
        ) : null,
      )}
    </group>
  );
};

// ---------------------------------------------------------------- placa de aviso, balança e prancheta
export const NoticeBoard: React.FC<{ at: Vec3; reveal: number }> = ({ at, reveal }) => {
  const map = useCanvasTexture("notice", 700, 360, (ctx, w, h) => {
    ctx.fillStyle = "#2f3b2f";
    roundRect(ctx, 0, 0, w, h, 30);
    ctx.fill();
    ctx.strokeStyle = PALETTE.wood;
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.fillStyle = PALETTE.warning;
    ctx.textAlign = "center";
    ctx.font = font(900, 58);
    ctx.fillText("AVISO", w / 2, 92);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(900, 56);
    ctx.fillText("TAXA DE SERVIÇO", w / 2, 190);
    ctx.font = font(900, 96);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText("10%", w / 2, 300);
  });
  if (reveal <= 0.001) return null;
  return (
    <mesh position={at} scale={clamp(reveal, 0, 1.2)}>
      <planeGeometry args={[1.05, 0.54]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
};

export const LawIcon: React.FC<{ at: Vec3; pop: number; frame: number }> = ({ at, pop, frame }) => {
  if (pop <= 0.001) return null;
  const tilt = 0.12 * Math.sin(frame / 9) * Math.exp(-Math.max(0, pop - 1) * 0);
  return (
    <group position={at} scale={clamp(pop, 0, 1.25)}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.025, 0.04, 0.5, 6]} />
        <meshStandardMaterial {...METAL} color={PALETTE.gold} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.05, 8]} />
        <meshStandardMaterial {...METAL} color={PALETTE.gold} />
      </mesh>
      <group position={[0, 0.5, 0]} rotation={[0, 0, tilt]}>
        <mesh>
          <boxGeometry args={[0.7, 0.03, 0.03]} />
          <meshStandardMaterial {...METAL} color={PALETTE.gold} />
        </mesh>
        {[-0.33, 0.33].map((x) => (
          <group key={x} position={[x, -0.16, 0]} rotation={[0, 0, -tilt]}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.16, 4]} />
              <meshStandardMaterial color="#8a6a1a" />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.12, 0.08, 0.04, 10]} />
              <meshStandardMaterial {...METAL} color={PALETTE.gold} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

export const RulesBoard: React.FC<{ at: Vec3; yaw: number; drop: number }> = ({ at, yaw, drop }) => {
  const map = useCanvasTexture("rules", 520, 640, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.wood;
    roundRect(ctx, 0, 0, w, h, 30);
    ctx.fill();
    ctx.fillStyle = "#fffdf6";
    roundRect(ctx, 34, 70, w - 68, h - 104, 16);
    ctx.fill();
    ctx.fillStyle = "#9aa5b1";
    roundRect(ctx, w / 2 - 90, 24, 180, 70, 16);
    ctx.fill();
    ctx.fillStyle = "#1f3b57";
    ctx.textAlign = "center";
    ctx.font = font(900, 48);
    ctx.fillText("REGRAS DO", w / 2, 170);
    ctx.fillText("RATEIO", w / 2, 226);
    const colors = ["#3d8bfd", "#ff8c42", "#22b8a8"];
    for (let i = 0; i < 3; i++) {
      const y = 300 + i * 92;
      ctx.strokeStyle = PALETTE.positive;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(92, y + 22);
      ctx.lineTo(130, y - 20);
      ctx.stroke();
      ctx.fillStyle = colors[i];
      roundRect(ctx, 160, y - 16, 260 - i * 50, 34, 17);
      ctx.fill();
    }
  });
  if (drop <= 0.001) return null;
  return (
    <group position={[at[0], at[1] + (1 - clamp(drop, 0, 1)) * 1.5, at[2]]} rotation={[0, yaw, 0]} scale={clamp(drop, 0, 1.2)}>
      <mesh castShadow>
        <planeGeometry args={[0.62, 0.76]} />
        <meshBasicMaterial map={map} transparent side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Aperto de mão estilizado: duas mangas (trabalhadores × sindicato) se encontram. */
export const Handshake: React.FC<{ at: Vec3; yaw: number; pop: number }> = ({ at, yaw, pop }) => {
  if (pop <= 0.001) return null;
  const k = clamp(pop, 0, 1.1);
  const gap = (1 - clamp(pop, 0, 1)) * 0.35;
  return (
    <group position={at} rotation={[0, yaw, 0]} scale={0.9}>
      {[
        { side: -1, sleeve: "#3d8bfd", skin: PALETTE.skin },
        { side: 1, sleeve: "#22b8a8", skin: PALETTE.skin2 },
      ].map(({ side, sleeve, skin }) => (
        <group key={side} position={[side * (0.2 + gap), 0, 0]} scale={k}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 0.12, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.3, 8]} />
            <meshStandardMaterial {...MATTE} color={sleeve} />
          </mesh>
          <mesh position={[side * -0.07, 0, 0]}>
            <boxGeometry args={[0.16, 0.12, 0.12]} />
            <meshStandardMaterial {...MATTE} color={skin} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Ponto de interrogação flutuante (de frente para a câmera). */
export const Question: React.FC<{ at: Vec3; yaw: number; k: number; color?: string }> = ({ at, yaw, k, color = PALETTE.warning }) => {
  const map = useCanvasTexture(`q-${color}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1d1a0c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(900, 170);
    ctx.fillText("?", w / 2, h / 2 + 10);
  });
  if (k <= 0.001) return null;
  return <Card map={map} w={0.36} h={0.36} at={at} yaw={yaw} scale={clamp(k, 0, 1.2)} />;
};

/** Facho de luz colorido sobre um funcionário. */
export const Spotlight: React.FC<{ at: Vec3; k: number; color: string }> = ({ at, k, color }) => {
  if (k <= 0.001) return null;
  const a = clamp(k, 0, 1);
  return (
    <group position={[at[0], 0, at[2]]}>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.12, 0.55, 2.7, 14, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.16 * a} side={DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55 * a, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.45 * a} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};
