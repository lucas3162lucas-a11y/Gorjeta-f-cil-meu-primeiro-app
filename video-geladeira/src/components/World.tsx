import { DoubleSide } from "three";
import { useCurrentFrame } from "remotion";
import { isVisible, scenes, track } from "../data/scenes";
import { MATTE, PALETTE } from "../theme";
import { clamp, lerp, randRange, type Vec3 } from "../utils/animation";
import { FRIDGE, SPOT } from "../utils/layout";
import { Arrow3D } from "./Arrow3D";
import { CircuitPart, Compressor, FridgeShell, Gauge, PIPE_COLOR, Thermometer, Thermostat } from "./Fridge";
import { Fluid } from "./Fluid";
import { Kitchen } from "./Kitchen";
import { cameraPoseAt } from "./CameraController";
import { Person } from "./Person";

// O cenário persistente: a mesma cozinha e a mesma geladeira do começo ao fim. Tudo lê as trilhas
// no frame GLOBAL. Não há "tranco" de câmera: só a câmera orbital suave do CameraController.

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const arc = (a: Vec3, b: Vec3, t: number, h: number): Vec3 => {
  const p = lerp3(a, b, t);
  return [p[0], p[1] + 4 * h * t * (1 - t), p[2]];
};

const HEAT = "#ff9a3c";
/** Início da cena 4 (a geladeira entra): antes disso o calor e o termômetro ficam no balcão. */
const FRIDGE_FROM = scenes[3].startFrame;

/** Jarra de suco (vidro + suco laranja); `ice` cobre de cristais, `drops` mostra gotinhas de gelada. */
const Juice: React.FC<{ at: Vec3; ice: number; cold: number }> = ({ at, ice, cold }) => (
  <group position={at}>
    <mesh position={[0, 0.13, 0]}>
      <cylinderGeometry args={[0.09, 0.08, 0.2, 12]} />
      <meshStandardMaterial color={cold > 0.5 ? "#ffb347" : "#ff9f1c"} emissive="#ff8c00" emissiveIntensity={0.15} />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.105, 0.095, 0.3, 12, 1, true]} />
      <meshStandardMaterial color="#e6f6ff" transparent opacity={0.35} side={DoubleSide} depthWrite={false} />
    </mesh>
    <mesh position={[0.11, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.06, 0.012, 6, 10, Math.PI]} />
      <meshStandardMaterial color="#e6f6ff" transparent opacity={0.6} />
    </mesh>
    {ice > 0.02
      ? Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[0.1 * Math.cos(a), 0.06 + (i % 4) * 0.06, 0.1 * Math.sin(a)]} scale={clamp(ice, 0, 1) * 0.9}>
              <octahedronGeometry args={[0.03, 0]} />
              <meshStandardMaterial color="#eaf8ff" emissive="#bfe9ff" emissiveIntensity={0.5} />
            </mesh>
          );
        })
      : null}
    {cold > 0.5
      ? Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`d${i}`} position={[0.1 * Math.cos(i * 1.1 + 0.4), 0.08 + (i % 3) * 0.07, 0.1 * Math.sin(i * 1.1 + 0.4)]}>
            <sphereGeometry args={[0.012, 6, 4]} />
            <meshStandardMaterial color="#d9f2ff" transparent opacity={0.85} />
          </mesh>
        ))
      : null}
  </group>
);

/** Caixa de madeira com tampa articulada; `xray` deixa a frente translúcida. */
const CrateBox: React.FC<{ lid: number; xray: number; vanish: number }> = ({ lid, xray, vanish }) => {
  const k = 1 - clamp(vanish, 0, 1);
  if (k <= 0.001) return null;
  const W = 0.5;
  const H = 0.42;
  const D = 0.42;
  const wall = (p: Vec3, s: Vec3, front = false) => (
    <mesh position={p} castShadow={!front}>
      <boxGeometry args={s} />
      <meshStandardMaterial {...MATTE} color={PALETTE.wood} transparent={front && xray > 0.01} opacity={front ? 1 - 0.8 * xray : 1} depthWrite={!(front && xray > 0.01)} />
    </mesh>
  );
  return (
    <group position={SPOT.box} scale={k}>
      {wall([0, 0.015, 0], [W, 0.03, D])}
      {wall([0, H / 2, -D / 2], [W, H, 0.03])}
      {wall([-W / 2, H / 2, 0], [0.03, H, D])}
      {wall([W / 2, H / 2, 0], [0.03, H, D])}
      {wall([0, H / 2, D / 2], [W, H, 0.03], true)}
      <group position={[0, H, -D / 2]} rotation={[-(1 - clamp(lid, 0, 1.1)) * 1.9, 0, 0]}>
        <mesh position={[0, 0.015, D / 2]} castShadow>
          <boxGeometry args={[W + 0.03, 0.03, D + 0.02]} />
          <meshStandardMaterial {...MATTE} color={PALETTE.woodDark} />
        </mesh>
      </group>
    </group>
  );
};

/** Pontinhos de calor. Função pura do frame e das trilhas. */
const HeatDots: React.FC<{ frame: number }> = ({ frame }) => {
  const dots = [];
  const inside = track("heat.inside", frame) * (1 - clamp(track("heat.out", frame) * 1.5, 0, 1));
  const toVapor = track("heat.toVapor", frame);
  const out = track("heat.out", frame);
  const toEvap = track("heat.toEvap", frame);
  const loop = track("fluid.loop", frame);
  const boxCenter: Vec3 = [SPOT.box[0], SPOT.box[1] + 0.2, SPOT.box[2]];
  // presos na caixa, girando em volta da jarra
  if (inside > 0.01 && frame < FRIDGE_FROM) {
    for (let i = 0; i < 12; i++) {
      const a = frame / 18 + (i / 12) * Math.PI * 2;
      const r = 0.15 + 0.03 * Math.sin(frame / 9 + i);
      dots.push([boxCenter[0] + r * Math.cos(a), boxCenter[1] + 0.12 * Math.sin(a * 2 + i), boxCenter[2] + r * Math.sin(a)] as Vec3);
    }
  }
  // puxados pelo vapor do copo (cena 3)
  if (out > 0.01 && toVapor < 0.999 && frame < FRIDGE_FROM) {
    const cupTop: Vec3 = [SPOT.cup[0], SPOT.cup[1] + 0.25, SPOT.cup[2]];
    for (let i = 0; i < 12; i++) {
      const t = clamp(toVapor * 1.4 - i * 0.03, 0, 1);
      const start: Vec3 = [boxCenter[0] + 0.15 * Math.cos(i), boxCenter[1] + 0.25, boxCenter[2] + 0.15 * Math.sin(i)];
      const mid = lerp3(boxCenter, start, clamp(out, 0, 1));
      const p = t > 0 ? arc(mid, [cupTop[0] + randRange(`v${i}`, -0.1, 0.1), cupTop[1] + 0.5, cupTop[2]], t, 0.15) : mid;
      if (t < 0.98) dots.push(p);
    }
  }
  // da jarra para a serpentina do evaporador (cena 4 e loop final)
  const flowIn = Math.max(toEvap < 0.999 ? toEvap : 0, loop);
  if (flowIn > 0.01 && frame >= FRIDGE_FROM) {
    const from: Vec3 = [SPOT.shelf[0], SPOT.shelf[1] + 0.2, SPOT.shelf[2]];
    for (let i = 0; i < 10; i++) {
      const t = loop > 0.01 ? ((frame / 45 + i / 10) % 1) : clamp(toEvap * 1.5 - i * 0.05, 0, 1);
      if (t <= 0 || t >= 1) continue;
      dots.push(arc([from[0] + randRange(`e${i}`, -0.12, 0.12), from[1], from[2]], [FRIDGE.x + randRange(`ex${i}`, -0.4, 0.4), 1.8, -0.84], t, 0.1));
    }
  }
  return (
    <group>
      {dots.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color={HEAT} emissive={HEAT} emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/** Vapor do copo de demonstração e gelo na borda. */
const DemoCup: React.FC<{ vapor: number; frost: number; frame: number; vanish: number }> = ({ vapor, frost, frame, vanish }) => {
  const k = 1 - clamp(vanish, 0, 1);
  if (k <= 0.001) return null;
  return (
    <group position={SPOT.cup} scale={k}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.2, 12, 1, true]} />
        <meshStandardMaterial color="#e6f6ff" transparent opacity={0.4} side={DoubleSide} depthWrite={false} />
      </mesh>
      {vapor < 0.95 ? (
        <mesh position={[0, 0.03, 0]} scale={[1, 1 - clamp(vapor, 0, 1), 1]}>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 12]} />
          <meshStandardMaterial color="#7fd3ff" emissive="#4fc3ff" emissiveIntensity={0.4} />
        </mesh>
      ) : null}
      {vapor > 0.01 && vapor < 1
        ? Array.from({ length: 8 }).map((_, i) => {
            const t = ((frame / 40 + i / 8) % 1) * clamp(vapor * 2, 0, 1);
            return (
              <mesh key={i} position={[0.03 * Math.sin(i * 2 + frame / 10), 0.2 + t * 0.6, 0.03 * Math.cos(i)]} scale={0.6 + t}>
                <sphereGeometry args={[0.035, 8, 6]} />
                <meshStandardMaterial color="#bfe9ff" transparent opacity={0.55 * (1 - t)} depthWrite={false} />
              </mesh>
            );
          })
        : null}
      {frost > 0.01 ? (
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={clamp(frost, 0, 1)}>
          <torusGeometry args={[0.07, 0.018, 6, 16]} />
          <meshStandardMaterial color="#f2fbff" emissive="#cdeeff" emissiveIntensity={0.6} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Ondas de calor subindo do condensador para o ar da cozinha. */
const HeatWaves: React.FC<{ k: number; frame: number }> = ({ k, frame }) => {
  if (k <= 0.01) return null;
  return (
    <group>
      {Array.from({ length: 7 }).map((_, i) => {
        const t = (frame / 50 + i / 7) % 1;
        return (
          <mesh key={i} position={[FRIDGE.x + 0.6 + t * 0.5 + 0.06 * Math.sin(frame / 8 + i), 0.8 + (i % 3) * 0.35 + t * 0.9, -1.12]} rotation={[0, Math.PI / 2, 0]} scale={(0.6 + t) * k}>
            <torusGeometry args={[0.09, 0.016, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#ff5a3c" emissive="#ff5a3c" emissiveIntensity={0.7} transparent opacity={0.8 * (1 - t)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (id: string, fb = 0) => track(id, frame, fb);
  const vis = (id: string) => isVisible(id, frame);
  const pose = cameraPoseAt(frame);
  const yawTo = (p: Vec3) => Math.atan2(pose.position[0] - p[0], pose.position[2] - p[2]);

  const reveal = t("kitchen.reveal");
  const vanish = t("box.vanish");
  const rise = t("fridge.rise");

  // jarra: balcão → caixa → prateleira da geladeira → mão do garçom
  const inBox = t("juice.inBox");
  const toFridge = t("juice.toFridge");
  const serve = t("waiter.serve");
  const boxSpot: Vec3 = [SPOT.box[0], SPOT.box[1] + 0.03, SPOT.box[2]];
  let juiceAt = arc(SPOT.juiceStart, boxSpot, inBox, 0.35);
  if (toFridge > 0) juiceAt = arc(boxSpot, SPOT.shelf, toFridge, 0.6);
  if (serve > 0) juiceAt = arc(SPOT.shelf, SPOT.serve, clamp(serve, 0, 1), 0.4);

  const compOn = t("compressor.on");
  const fluidState = {
    shown: {
      evap: vis("evaporator"),
      suction: vis("pipeSuction"),
      compressor: vis("compressor"),
      discharge: vis("pipeDischarge"),
      condenser: vis("condenser"),
      capillary: vis("capillary"),
    },
    evap: t("fluid.evap"),
    saturate: t("fluid.saturate"),
    hot: t("fluid.hot"),
    condense: t("fluid.condense"),
    cold: t("fluid.cold"),
  };
  const thermoInFridge = frame >= FRIDGE_FROM;

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Kitchen />

      <Person
        at={SPOT.waiter}
        rotY={serve > 0.5 ? -Math.PI / 2 + 0.5 : -Math.PI / 4}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={1.2 * clamp(serve, 0, 1) + (inBox > 0 && inBox < 1 ? 1.1 : 0)}
        smile={serve > 0.5}
      />

      <CrateBox lid={t("box.lid")} xray={t("box.xray")} vanish={vanish} />
      <Juice at={juiceAt} ice={t("juice.ice")} cold={serve > 0.3 ? 1 : 0} />
      {vis("demoCup") || vanish < 1 ? <DemoCup vapor={t("vapor.rise")} frost={t("frost.cup")} frame={frame} vanish={vanish} /> : null}
      {vis("thermo") ? (
        <Thermometer at={thermoInFridge ? SPOT.thermoFridge : SPOT.thermoCounter} level={thermoInFridge ? t("thermo.level", 0.45) : 0.85 + 0.03 * Math.sin(frame / 10)} pop={thermoInFridge ? 1 : t("thermo.pop")} scale={thermoInFridge ? 0.9 : 1} />
      ) : null}
      {vis("heat") ? <HeatDots frame={frame} /> : null}

      {/* geladeira e circuito */}
      <FridgeShell rise={rise} />
      {rise > 0.6 ? (
        <>
          <CircuitPart seg="evap" draw={t("evaporator.draw")} r={0.024} color={PIPE_COLOR.evap} glow={t("fluid.evap") * (1 - t("fluid.saturate") * 0.6)} />
          {vis("pipeSuction") ? <CircuitPart seg="suction" draw={1} color={PIPE_COLOR.suction} /> : null}
          {vis("compressor") ? <Compressor on={compOn} frame={frame} /> : null}
          {vis("pipeDischarge") || vis("compressor") ? <CircuitPart seg="compressor" draw={1} r={0.02} color={PIPE_COLOR.discharge} /> : null}
          {vis("pipeDischarge") ? <CircuitPart seg="discharge" draw={1} color={PIPE_COLOR.discharge} glow={t("pipeDischarge.glow")} /> : null}
          {vis("condenser") ? <CircuitPart seg="condenser" draw={t("condenser.draw")} r={0.02} color={PIPE_COLOR.condenser} glow={t("heatWaves.on") * 0.6} /> : null}
          {vis("capillary") ? <CircuitPart seg="capillary" draw={1} r={0.012} color={PIPE_COLOR.capillary} glow={t("capillary.glow")} /> : null}
          {vis("thermostat") ? <Thermostat pop={t("thermostat.pop")} knob={t("thermostat.knob")} /> : null}
          {vis("gauge") ? <Gauge needle={t("gauge.needle", 0.2)} yaw={yawTo(SPOT.gauge)} /> : null}
          {vis("fluidThermo") ? <Thermometer at={SPOT.fluidThermo} level={0.82} pop={t("fluidThermo.pop")} scale={0.8} /> : null}
          {vis("fluid") ? <Fluid frame={frame} s={fluidState} /> : null}
        </>
      ) : null}
      {vis("heatArrow") ? <Arrow3D from={[1.05, 1.15, -1.2]} dir={[1, 0.35, 0.2]} length={0.75} color="#ff5a3c" scale={t("heatArrow.pop")} /> : null}
      {vis("heatWaves") ? <HeatWaves k={t("heatWaves.on")} frame={frame} /> : null}
    </group>
  );
};
