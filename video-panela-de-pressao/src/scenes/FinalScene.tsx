import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { POT, POT_TOP, SPOT } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados nas peças da panela.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "PINO COM PESO", point: [SPOT.valve[0], SPOT.valve[1] + 0.05, SPOT.valve[2]], offset: [-60, -230], accent: "#9aa5b1" },
  { text: "VÁLVULA DE SEGURANÇA", point: SPOT.safety, offset: [40, -150], accent: "#e85d3a" },
  { text: "TAMPA E BORRACHA", point: [POT.x - POT.r, POT_TOP, POT.z + 0.1], offset: [-120, -60], accent: PALETTE.positive },
  { text: "MANÔMETRO", point: SPOT.gauge, offset: [60, 90], accent: PALETTE.info },
];

const FinalOverlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const k = track("final.labels", frame);
  return (
    <>
      {LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.point} text={l.text} appear={clamp(k * 1.6 - i * 0.15, 0, 1)} offset={l.offset} accent={l.accent} size={32} />
      ))}
    </>
  );
};

export const FinalScene: SceneModule = { Overlay: FinalOverlay };
