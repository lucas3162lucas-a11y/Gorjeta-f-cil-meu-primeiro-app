import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { SKY } from "../theme";
import { DURATION } from "../utils/timing";

// Fundo atrás do diorama: degradê quente de bistrô que escurece aos poucos (anoitecer).
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / DURATION;
  const c = SKY.start.map((top, i) => interpolateColors(t, [0, 1], [top, SKY.end[i]]));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 55%, ${c[2]} 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 48%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0) 55%, rgba(60,25,10,0.28) 100%)" }} />
    </AbsoluteFill>
  );
};
