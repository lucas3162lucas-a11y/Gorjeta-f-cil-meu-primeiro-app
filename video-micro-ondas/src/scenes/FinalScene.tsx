import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { CAVITY_CENTER, MW, SPOT } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados nas peças do micro-ondas.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "MAGNETRON", point: SPOT.magnetron, offset: [-30, -240], accent: "#ff9a3c" },
  { text: "GUIA DE ONDAS", point: [(SPOT.magnetron[0] + CAVITY_CENTER[0]) / 2, MW.y + MW.h, MW.z], offset: [-170, -170], accent: "#38d9ff" },
  { text: "CAIXA DE METAL", point: [MW.cavX0, MW.y + 0.35, MW.z - 0.2], offset: [-90, -90], accent: "#9aa5b1" },
  { text: "TELA", point: [CAVITY_CENTER[0], CAVITY_CENTER[1], MW.frontZ], offset: [-140, 90], accent: PALETTE.positive },
  { text: "PRATO GIRATÓRIO", point: SPOT.plate, offset: [-20, 170], accent: PALETTE.info },
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
