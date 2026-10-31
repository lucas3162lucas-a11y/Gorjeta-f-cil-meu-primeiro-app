import { useCurrentFrame } from "remotion";
import { track } from "../data/scenes";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { POT, POT_TOP, SPOT } from "../utils/layout";
import { cameraPoseAt } from "./CameraController";
import { CookerBody, Gauge, Jet, Lid, OpenSteam, Stove, Thermometer } from "./Cooker";
import { Kitchen } from "./Kitchen";
import { Person } from "./Person";

// O cenário persistente: a mesma cozinha, o mesmo fogão e a mesma panela do começo ao fim. Tudo lê as
// trilhas no frame GLOBAL. Sem "tranco" de câmera; o pino balança devagar (~2 Hz).

const HEAT = "#ff9a3c";

/** Pontinhos de calor que sobem com o vapor e somem no ar (cena 3). */
const HeatInSteam: React.FC<{ k: number; frame: number }> = ({ k, frame }) => {
  if (k <= 0.01) return null;
  return (
    <group position={[POT.x, POT_TOP, POT.z]}>
      {Array.from({ length: 10 }).map((_, i) => {
        const t = (frame / 40 + i / 10) % 1;
        return (
          <mesh key={i} position={[0.1 * Math.sin(i * 2.2 + frame / 25) + t * 0.15, t * 1.1, 0.08 * Math.cos(i)]} scale={clamp(k, 0, 1) * (1 - t * 0.6)}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color={HEAT} emissive={HEAT} emissiveIntensity={0.9} transparent opacity={1 - t} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Prato de feijão servido (cena final). */
const Plate: React.FC<{ at: Vec3; k: number; frame: number }> = ({ at, k, frame }) =>
  k <= 0.01 ? null : (
    <group position={at} scale={clamp(k, 0, 1.1)}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.1, 0.03, 16]} />
        <meshStandardMaterial {...MATTE} color="#fbfbf7" />
      </mesh>
      <mesh position={[0, 0.025, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.09, 12, 8]} />
        <meshStandardMaterial {...MATTE} color="#7a4a2f" />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => {
        const t = (frame / 35 + i / 4) % 1;
        return (
          <mesh key={i} position={[-0.04 + i * 0.03, 0.06 + t * 0.3, 0]} scale={0.6 + t}>
            <sphereGeometry args={[0.025, 8, 6]} />
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
  const lidOpen = t("lid.open");
  const valveWobble = t("valve.wobble") * (1 - t("valve.clog"));
  const s = {
    cut: t("pot.cut"),
    boil: t("pot.boil"),
    steamOut: t("steam.amount"),
    trapped: t("steam.trapped") * (1 - clamp(lidOpen * 1.5, 0, 1)),
    density: t("steam.density"),
    beansIn: t("beans.toPot"),
    beansCook: t("beans.cook"),
    lidDrop: t("lid.drop"),
    lidLock: t("lid.lock"),
    lidOpen,
    gasket: t("gasket.glow") * (1 - clamp(lidOpen * 2, 0, 1)),
  };
  // vapor aberto: só antes da tampa fechar (cenas 2–4)
  const steamOpen = s.lidDrop < 0.5 ? s.steamOut : 0;
  const escape = t("steam.escape");
  const jetK = t("jet.on");
  const servePos: Vec3 = [lerp(POT.x, SPOT.serve[0], clamp(serve, 0, 1)), lerp(POT_TOP + 0.1, SPOT.serve[1], clamp(serve, 0, 1)) + 0.25 * Math.sin(Math.PI * clamp(serve, 0, 1)), lerp(POT.z, SPOT.serve[2], clamp(serve, 0, 1))];
  // feijão entrando: o garçom inclina o pacote sobre a panela
  const pouring = t("beans.toPot") > 0 && t("beans.toPot") < 1;

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Kitchen />
      <Stove flame={t("stove.flame")} frame={frame} />
      <Person
        at={SPOT.waiter}
        rotY={serve > 0.5 ? -Math.PI / 2 + 0.7 : 0.35}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={pouring ? 1.6 : 1.2 * clamp(serve, 0, 1)}
        smile={serve > 0.5}
      />
      <CookerBody s={s} frame={frame} />
      <OpenSteam amount={steamOpen} escape={s.lidDrop < 0.5 ? escape : 0} frame={frame} />
      <HeatInSteam k={s.lidDrop < 0.5 ? t("heat.inSteam") : 0} frame={frame} />
      <Lid s={s} valveLift={t("valve.lift")} valveWobble={valveWobble} clog={t("valve.clog")} safety={Math.max(t("safety.highlight"), t("safety.release"))} frame={frame} valveCut={t("valve.cut")} />
      <Jet at={[SPOT.valve[0], SPOT.valve[1] + 0.08, SPOT.valve[2]]} k={jetK * (1 - clamp(lidOpen * 2, 0, 1))} frame={frame} pulse={valveWobble} />
      <Jet at={[SPOT.safety[0], SPOT.safety[1] + 0.04, SPOT.safety[2]]} k={t("safety.release")} frame={frame} />
      <Thermometer level={t("thermo.level", 0.3)} pop={t("thermo.pop") * (1 - clamp(lidOpen, 0, 1))} />
      <Gauge needle={t("gauge.needle", 0.1)} pop={t("gauge.pop") * (1 - clamp(lidOpen, 0, 1))} alert={t("gauge.alert") * (t("gauge.needle", 0.1) > 0.85 ? 1 : 0)} yaw={yawTo(SPOT.gauge)} frame={frame} />
      <Plate at={servePos} k={serve} frame={frame} />
    </group>
  );
};
