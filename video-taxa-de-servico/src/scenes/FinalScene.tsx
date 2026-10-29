import { useCurrentFrame } from "remotion";
import { cameraPoseAt } from "../components/CameraController";
import { WorldLabel } from "../components/WorldLabel";
import { track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, type Vec3 } from "../utils/animation";
import { SPOT } from "../utils/layout";
import type { SceneModule, SceneProps } from "./types";

// Cena final: rótulos 2D ancorados em cada etapa do fluxo do dinheiro.

const LABELS: { text: string; point: Vec3; offset: [number, number]; accent: string }[] = [
  { text: "CONTA", point: SPOT.billTable, offset: [-40, -150], accent: PALETTE.gold },
  { text: "GORJETA", point: [SPOT.tipBox[0], SPOT.tipBox[1] + 0.3, SPOT.tipBox[2]], offset: [120, -170], accent: PALETTE.positive },
  { text: "RATEIO", point: SPOT.disc, offset: [150, 120], accent: PALETTE.info },
  { text: "ENCARGOS", point: [SPOT.vault[0], 0.6, SPOT.vault[2]], offset: [170, -40], accent: "#9aa5b1" },
  { text: "EQUIPE", point: [SPOT.cook[0], 1.5, SPOT.cook[2]], offset: [60, -190], accent: PALETTE.positive },
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
