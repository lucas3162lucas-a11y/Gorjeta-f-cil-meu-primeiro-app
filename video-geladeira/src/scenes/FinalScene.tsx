import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { SPOT } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados nas quatro peças do ciclo.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "EVAPORADOR", point: [0.4, 1.85, -0.86], offset: [-150, -170], accent: "#4fc3ff" },
  { text: "CAPILAR", point: [1.04, 1.55, -1.0], offset: [-110, -200], accent: "#c98a4b" },
  { text: "CONDENSADOR", point: [0.75, 1.0, -1.07], offset: [-90, 175], accent: "#ff5a3c" },
  { text: "COMPRESSOR", point: [SPOT.compressor[0], 0.3, SPOT.compressor[2]], offset: [-170, 110], accent: PALETTE.positive },
];

const FinalOverlay: React.FC<SceneProps> = ({ scene }) => {
  const frame = useCurrentFrame() + scene.startFrame;
  const pose = cameraPoseAt(frame);
  const k = track("final.labels", frame);
  return (
    <>
      {LABELS.map((l, i) => (
        <WorldLabel key={l.text} pose={pose} point={l.point} text={l.text} appear={clamp(k * 1.6 - i * 0.15, 0, 1)} offset={l.offset} accent={l.accent} size={34} />
      ))}
    </>
  );
};

export const FinalScene: SceneModule = { Overlay: FinalOverlay };
