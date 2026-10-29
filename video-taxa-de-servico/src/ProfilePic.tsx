import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Coin } from "./components/Coins";
import { usePose } from "./components/CameraController";
import { Person } from "./components/Person";
import { CAMERA, FONT, LIGHTING, PALETTE } from "./theme";

// Foto de perfil do canal: o garçom do vídeo (personagem principal) acenando, com o nome do canal.
// Pensada para o recorte redondo do YouTube: tudo que importa fica dentro do círculo central.

export const CHANNEL_NAME = "EXPLICA AÍ";

const Camera: React.FC = () => {
  usePose({ position: [0.3, 1.62, 3.6], target: [0.05, 1.4, 0], fov: CAMERA.fov });
  return null;
};

export const ProfilePic: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #ffe1a8 0%, #ffb867 45%, #f0803c 100%)" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 58%, rgba(120,40,10,0.35) 72%)" }} />
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }} flat camera={{ fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far, position: [0, 1.5, 4.3] }}>
        <Camera />
        <ambientLight intensity={0.7} />
        <hemisphereLight args={[LIGHTING.hemisphere.sky, LIGHTING.hemisphere.ground, 1.1]} />
        <directionalLight position={[3, 5, 6]} intensity={2.4} color={LIGHTING.key.color} />
        <directionalLight position={[-4, 2, 3]} intensity={0.7} color={LIGHTING.fill.color} />
        <Person at={[0, 0, 0]} rotY={-Math.PI / 2 + 0.25} shirt="#ffffff" pants="#1f2430" apron="#1f2430" skin={PALETTE.skin2} armR={2.5} spreadR={0.35} armL={0.15} headTilt={0.12} smile />
        <Coin at={[-0.36, 1.78, 0.3]} spin={0.6} scale={1.3} />
        <Coin at={[0.5, 1.5, 0.2]} spin={2.1} scale={1.3} />
        <Coin at={[-0.45, 1.22, 0.4]} spin={4.0} scale={1.1} />
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * 0.71,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: width * 0.088,
            letterSpacing: 2,
            color: "#ffffff",
            background: PALETTE.info,
            border: `${width * 0.012}px solid #ffffff`,
            borderRadius: width * 0.06,
            padding: `${width * 0.012}px ${width * 0.05}px`,
            boxShadow: "0 12px 26px rgba(60,20,0,0.35)",
            WebkitTextStroke: `${width * 0.01}px ${PALETTE.outline}`,
            paintOrder: "stroke fill",
            whiteSpace: "nowrap",
          }}
        >
          {CHANNEL_NAME}
        </div>
      </div>
    </AbsoluteFill>
  );
};
