import { useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { BURNER, SPOT } from "../utils/layout";
import { cameraPoseAt } from "./CameraController";
import { Cylinder, GasStove, Icon, Particles, SoupPot, Wind } from "./GasStove";
import { Kitchen } from "./Kitchen";
import { Person } from "./Person";

// O cenário persistente: a mesma cozinha e o mesmo fogão do começo ao fim, lendo as trilhas no frame
// GLOBAL. Sem "tranco" de câmera; a chama só tremula no tamanho dos próprios cones.

/** Tigela de sopa servida (cena final). */
const Bowl: React.FC<{ at: Vec3; k: number; frame: number }> = ({ at, k, frame }) =>
  k <= 0.01 ? null : (
    <group position={at} scale={clamp(k, 0, 1.1)}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.07, 0.06, 16]} />
        <meshStandardMaterial {...MATTE} color="#fbfbf7" />
      </mesh>
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.005, 16]} />
        <meshStandardMaterial {...MATTE} color="#e07a3c" />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => {
        const t = (frame / 35 + i / 4) % 1;
        return (
          <mesh key={i} position={[-0.04 + i * 0.03, 0.05 + t * 0.3, 0]} scale={0.6 + t}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5 * (1 - t)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (id: string, fb = 0) => track(id, frame, fb);
  const pose = cameraPoseAt(frame);
  const yawTo = (p: Vec3) => Math.atan2(pose.position[0] - p[0], pose.position[2] - p[2]);

  const reveal = t("kitchen.reveal");
  const serve = t("waiter.serve");
  const sootOn = t("soot.on");
  const s = {
    cut: t("stove.cut"),
    burnerCut: t("burner.cut"),
    knob: t("knob.turn"),
    gas: t("gas.flow"),
    leak: t("gas.leakShow"),
    flame: t("flame.size"),
    yellow: t("flame.yellow"),
    soot: sootOn,
    spark: t("spark.on") > 0.05 && t("spark.on") < 0.98 ? 1 : 0,
    igniter: t("igniter.glow"),
    air: t("air.in"),
    mixer: t("mixer.glow"),
    valveShow: t("valve.show"),
    sensorPop: t("sensor.pop"),
    sensorCool: t("sensor.cool"),
    safetyClose: t("safetyValve.close"),
  };
  const bowlAt: Vec3 = [
    lerp(SPOT.pot[0], SPOT.serve[0], clamp(serve, 0, 1)),
    lerp(SPOT.pot[1] + 0.15, SPOT.serve[1], clamp(serve, 0, 1)) + 0.25 * Math.sin(Math.PI * clamp(serve, 0, 1)),
    lerp(SPOT.pot[2], SPOT.serve[2], clamp(serve, 0, 1)),
  ];
  const xAt: Vec3 = [BURNER.x, BURNER.y + 0.3, BURNER.z + 0.05];
  const noseAt: Vec3 = [SPOT.cylinder[0] - 0.35, 0.95, SPOT.cylinder[2] + 0.25];

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Kitchen />
      <Person
        at={SPOT.waiter}
        rotY={serve > 0.5 ? -Math.PI / 2 + 0.7 : 0.35}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={1.2 * clamp(serve, 0, 1) + (t("pot.place") > 0 && t("pot.place") < 1 ? 1.2 : 0)}
        smile={serve > 0.5}
      />
      <GasStove s={s} frame={frame} />
      <Particles s={s} frame={frame} />
      <SoupPot place={t("pot.place")} soot={sootOn} serve={serve} xray={Math.max(t("burner.cut"), t("stove.cut")) * (1 - clamp(t("final.labels") + serve, 0, 1))} />
      <Cylinder pop={t("cylinder.pop")} smell={t("smell.on")} frame={frame} />
      <Wind k={t("wind.gust")} frame={frame} />
      <Icon kind="x" at={xAt} yaw={yawTo(xAt)} k={t("noFire.mark") * (1 - clamp(t("spark.on") * 3, 0, 1))} />
      <Icon kind="nose" at={noseAt} yaw={yawTo(noseAt)} k={t("noSmell.mark") * (1 - clamp(t("smell.on") * 2, 0, 1))} size={0.22} />
      <Icon kind="noseAlert" at={noseAt} yaw={yawTo(noseAt)} k={t("nose.pop")} size={0.22} />
      <Bowl at={bowlAt} k={serve} frame={frame} />
    </group>
  );
};
