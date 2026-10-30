import { Color } from "three";
import { track } from "../data/scenes";
import { clamp, randRange } from "../utils/animation";
import { circuitAt, LOOP_LENGTH, type Segment } from "../utils/layout";
import { DURATION } from "../utils/timing";
import { COLD, HOT } from "./Fridge";

// Partículas do refrigerante percorrendo o circuito. A fase de cada partícula é a soma da velocidade
// frame a frame (pré-calculada uma vez), então o fluxo acelera e para suavemente — sem saltos.

const N = 90;
const SPEED = 0.55; // u3d por segundo com fluxo total

const PHASE: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION; f++) {
    const flow = Math.max(track("fluid.flow", f - 1), track("fluid.loop", f - 1));
    out.push(out[f - 1] + (clamp(flow, 0, 1.2) * SPEED) / 30 / LOOP_LENGTH);
  }
  return out;
})();

const c = (hex: string) => new Color(hex);
const BLUE = c(COLD);
const PEACH = c("#ffb27a");
const RED = c(HOT);
const ORANGE = c("#ff8a3d");
const tmp = new Color();

export type FluidState = {
  /** quais trechos já existem na tela */
  shown: Record<Segment, boolean>;
  evap: number;
  saturate: number;
  hot: number;
  condense: number;
  cold: number;
};

const colorFor = (seg: Segment, t: number, s: FluidState) => {
  switch (seg) {
    case "evap":
      // entra azul; com o fluxo, esquenta ao longo da serpentina (pegou o calor de dentro)
      return tmp.copy(BLUE).lerp(PEACH, clamp(s.saturate, 0, 1) * (s.hot > 0.01 ? t * 0.85 : 1));
    case "suction":
      return tmp.copy(PEACH);
    case "compressor":
      return tmp.copy(PEACH).lerp(RED, clamp(s.hot, 0, 1) * t);
    case "discharge":
      return tmp.copy(PEACH).lerp(RED, clamp(s.hot, 0, 1));
    case "condenser":
      return tmp.copy(RED).lerp(ORANGE, clamp(s.condense, 0, 1) * t);
    case "capillary":
      return tmp.copy(ORANGE).lerp(BLUE, clamp(s.cold, 0, 1) * clamp((t - 0.25) / 0.6, 0, 1));
  }
};

export const Fluid: React.FC<{ frame: number; s: FluidState }> = ({ frame, s }) => {
  const phase = PHASE[Math.min(Math.max(frame, 0), DURATION)];
  const items = [];
  for (let i = 0; i < N; i++) {
    const u = i / N + randRange(`fl${i}`, 0, 0.6 / N) + phase;
    const { p, seg, t } = circuitAt(u);
    if (!s.shown[seg]) continue;
    if (seg === "evap" && s.evap <= 0.01) continue;
    const liquid = (seg === "condenser" && t > 0.5 && s.condense > 0.5) || seg === "capillary";
    const size = (liquid ? 0.034 : 0.027) * (seg === "evap" ? clamp(s.evap, 0, 1.1) : 1);
    // bolhas paradas na serpentina antes do fluxo: leve vaivém
    const wob = s.hot > 0.01 ? 0 : 0.01 * Math.sin(frame / 7 + i);
    const col = colorFor(seg, t, s).getHex();
    items.push(
      <mesh key={i} position={[p[0], p[1] + wob, p[2] + 0.02]} scale={liquid ? [1, 1.25, 1] : 1}>
        <sphereGeometry args={[size, 8, 6]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.55} />
      </mesh>,
    );
  }
  return <group>{items}</group>;
};
