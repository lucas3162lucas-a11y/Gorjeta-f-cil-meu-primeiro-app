import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { SPOT } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados nas peças do fogão.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "ACENDEDOR", point: SPOT.igniter, offset: [110, -190], accent: "#e8f6ff" },
  { text: "SENSOR", point: SPOT.sensor, offset: [-130, -170], accent: "#ff7043" },
  { text: "TUBO MISTURADOR", point: [SPOT.tubeTop[0], 0.78, SPOT.tubeTop[2]], offset: [-200, -20], accent: "#7fd3ff" },
  { text: "BOTÃO E VÁLVULA", point: SPOT.knob, offset: [200, 50], accent: PALETTE.positive },
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
