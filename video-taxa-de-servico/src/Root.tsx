import { Composition, Still } from "remotion";
import { MainSequence } from "./MainSequence";
import { ProfilePic } from "./ProfilePic";
import { DURATION } from "./utils/timing";

// Troque o id e mantenha durationInFrames = SECONDS × 30 (utils/timing.ts); scenes.ts valida a soma.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TaxaDeServico" component={MainSequence} durationInFrames={DURATION} fps={30} width={1080} height={1920} />
      <Still id="FotoDePerfil" component={ProfilePic} width={800} height={800} />
    </>
  );
};
