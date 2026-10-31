import { useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { SPOT, TOASTER } from "../utils/layout";
import { cameraPoseAt } from "./CameraController";
import { Kitchen } from "./Kitchen";
import { Person } from "./Person";
import { BadWire, breadColor, ToasterBody, UnplugIcon } from "./Toaster";

// O cenário persistente: a mesma cozinha do começo ao fim, lendo as trilhas no frame GLOBAL.
// Sem "tranco" de câmera e sem nada piscando quadro a quadro.

const Stove: React.FC<{ heat: number }> = ({ heat }) => (
  <group position={SPOT.stove}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.8, 0.9, 0.62]} />
      <meshStandardMaterial {...METAL} color="#d9dee3" />
    </mesh>
    <mesh position={[0, 0.91, 0]}>
      <boxGeometry args={[0.82, 0.03, 0.64]} />
      <meshStandardMaterial {...MATTE} color="#2d3238" />
    </mesh>
    <mesh position={[0, 0.4, 0.315]}>
      <planeGeometry args={[0.58, 0.42]} />
      <meshStandardMaterial {...MATTE} color="#3a3f46" />
    </mesh>
    {/* frigideira */}
    <group position={[SPOT.pan[0] - SPOT.stove[0], 0.94, SPOT.pan[2] - SPOT.stove[2]]}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.17, 0.04, 18, 1, true]} />
        <meshStandardMaterial {...METAL} color="#3b4148" side={2} />
      </mesh>
      <mesh position={[0, -0.018, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.006, 18]} />
        <meshStandardMaterial {...METAL} color="#2d3238" emissive="#ff5a00" emissiveIntensity={0.35 * clamp(heat, 0, 1)} />
      </mesh>
      <mesh position={[-0.33, 0.0, 0]}>
        <boxGeometry args={[0.28, 0.025, 0.04]} />
        <meshStandardMaterial {...MATTE} color="#1f2328" />
      </mesh>
    </group>
  </group>
);

/** Fatias na frigideira: face de cima clara, de baixo escurece; `flip` vira as fatias. */
const PanBread: React.FC<{ toPan: number; burn: number; flip: number }> = ({ toPan, burn, flip }) => {
  if (toPan <= 0.001) return null;
  const p = clamp(toPan, 0, 1);
  const top = breadColor(0);
  const bottom = breadColor(0.6 + 0.4 * clamp(burn, 0, 1));
  return (
    <group>
      {[-0.07, 0.07].map((dx) => {
        const from: Vec3 = [SPOT.waiter[0] + 0.25, 1.15, SPOT.waiter[2] - 0.1];
        const to: Vec3 = [SPOT.pan[0] + dx, SPOT.pan[1] - 0.005, SPOT.pan[2]];
        const at: Vec3 = [lerp(from[0], to[0], p), lerp(from[1], to[1], p) + 0.3 * Math.sin(Math.PI * p), lerp(from[2], to[2], p)];
        return (
          <group key={dx} position={at} rotation={[Math.PI * clamp(flip, 0, 1), 0, 0]}>
            <mesh position={[0, 0.006, 0]}>
              <boxGeometry args={[0.12, 0.008, 0.12]} />
              <meshStandardMaterial {...MATTE} color={top} />
            </mesh>
            <mesh position={[0, -0.002, 0]}>
              <boxGeometry args={[0.12, 0.008, 0.12]} />
              <meshStandardMaterial {...MATTE} color={bottom} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Prato com torradas servido (cena final). */
const Plate: React.FC<{ at: Vec3; k: number }> = ({ at, k }) =>
  k <= 0.01 ? null : (
    <group position={at} scale={clamp(k, 0, 1.1)}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.1, 0.02, 16]} />
        <meshStandardMaterial {...MATTE} color="#fbfbf7" />
      </mesh>
      {[-0.035, 0.035].map((dx, i) => (
        <mesh key={dx} position={[dx, 0.035, 0]} rotation={[0, 0, (i ? -1 : 1) * 0.35]}>
          <boxGeometry args={[0.018, 0.11, 0.11]} />
          <meshStandardMaterial {...MATTE} color={breadColor(0.6)} />
        </mesh>
      ))}
    </group>
  );

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (id: string, fb = 0) => track(id, frame, fb);
  const pose = cameraPoseAt(frame);
  const yawTo = (p: Vec3) => Math.atan2(pose.position[0] - p[0], pose.position[2] - p[2]);

  const reveal = t("kitchen.reveal");
  const serve = t("waiter.serve");
  const s = {
    rise: t("toaster.rise"),
    cut: t("toaster.cut") * (1 - clamp(serve * 1.5, 0, 1)),
    heat: t("wires.heat"),
    glow: t("wires.glow") * (1 - clamp(t("timer.run"), 0, 1)),
    current: t("current.flow"),
    breadDrop: t("bread.drop") * (1 - clamp(serve * 2, 0, 1)),
    breadPop: t("bread.pop"),
    toast: t("bread.toast"),
    heatBoth: t("heat.both") * (1 - clamp(t("timer.run"), 0, 1)),
    smoke: t("smoke.on"),
    knob: t("knob.turn"),
    knobHi: t("knob.highlight"),
    timerShow: t("timer.show"),
    timerRun: t("timer.run"),
    lever: t("lever.down"),
    magnet: t("magnet.on"),
    tray: t("tray.out"),
    crumbs: t("crumbs.fall"),
  };
  const plateAt: Vec3 = [
    lerp(TOASTER.x, SPOT.serve[0], clamp(serve, 0, 1)),
    lerp(TOASTER.y + 0.3, SPOT.serve[1], clamp(serve, 0, 1)) + 0.25 * Math.sin(Math.PI * clamp(serve, 0, 1)),
    lerp(TOASTER.z, SPOT.serve[2], clamp(serve, 0, 1)),
  ];
  const plugAt: Vec3 = [SPOT.plug[0], SPOT.plug[1], SPOT.plug[2] + 0.2];
  // as fatias da frigideira saem de cena quando a torradeira entra (sem voltar para a mão)
  const toPan = t("toaster.rise") > 0.3 ? 0 : t("bread.toPan");

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Kitchen />
      <Stove heat={t("pan.heat") * (1 - clamp(t("toaster.rise"), 0, 1))} />
      <Person
        at={SPOT.waiter}
        rotY={serve > 0.5 ? -Math.PI / 2 + 0.7 : 0.35}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={1.2 * clamp(serve, 0, 1) + (toPan > 0 && toPan < 1 ? 1.2 : 0)}
        smile={serve > 0.5}
      />
      <PanBread toPan={toPan} burn={t("bread.burnBottom")} flip={t("bread.flip")} />
      <ToasterBody s={s} frame={frame} />
      <BadWire pop={t("badWire.pop")} melt={t("badWire.melt")} out={t("badWire.out")} frame={frame} />
      <UnplugIcon at={plugAt} yaw={yawTo(plugAt)} k={t("unplug.pop") * (1 - clamp(t("final.labels") * 2, 0, 1))} />
      <Plate at={plateAt} k={serve} />
    </group>
  );
};
