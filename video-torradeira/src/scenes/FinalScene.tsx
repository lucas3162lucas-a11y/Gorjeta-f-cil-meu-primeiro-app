import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { SLOTS, SPOT, TOASTER } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados nas peças da torradeira.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "RESISTÊNCIAS", point: [SLOTS[0] - 0.028, TOASTER.y + 0.16, TOASTER.z], offset: [-170, -170], accent: "#ff5a3c" },
  { text: "BOTÃO DE TEMPO", point: SPOT.knob, offset: [-130, 170], accent: PALETTE.info },
  { text: "ÍMÃ ELÉTRICO", point: SPOT.magnet, offset: [-190, 70], accent: "#4fa3ff" },
  { text: "MOLA", point: [SPOT.spring[0], SPOT.spring[1] + 0.06, SPOT.spring[2]], offset: [10, -240], accent: PALETTE.positive },
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
