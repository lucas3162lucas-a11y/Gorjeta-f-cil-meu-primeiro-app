import { useCurrentFrame } from "remotion";
import { isVisible, track } from "../data/scenes";
import { DURATION } from "../utils/timing";
import { FONT, MATTE, METAL, PALETTE } from "../theme";
import { clamp, lerp, type Vec3 } from "../utils/animation";
import { CAVITY_CENTER, MW, SPOT } from "../utils/layout";
import { useCanvasTexture } from "./canvasTexture";
import { cameraPoseAt } from "./CameraController";
import { Box, Kitchen } from "./Kitchen";
import { MicrowaveBody, WaveArc } from "./Microwave";
import { Person } from "./Person";

// O cenário persistente: a mesma cozinha do começo ao fim, com tudo lendo as trilhas no frame GLOBAL.
// Sem "tranco" de câmera: só a câmera orbital suave do CameraController.

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const arc = (a: Vec3, b: Vec3, t: number, h: number): Vec3 => {
  const p = lerp3(a, b, t);
  return [p[0], p[1] + 4 * h * t * (1 - t), p[2]];
};
const q = (v: number, n = 10) => Math.round(clamp(v, 0, 1) * n);

/** Ângulo do prato giratório: soma da velocidade frame a frame (gira e para sem saltos). */
const SPIN: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION; f++) out.push(out[f - 1] + 0.06 * clamp(Math.max(track("turntable.spin", f - 1), track("final.labels", f - 1)), 0, 1));
  return out;
})();

const Stove: React.FC<{ flame: number; frame: number }> = ({ flame, frame }) => (
  <group position={SPOT.stove}>
    <Box p={[0, 0.45, 0]} s={[0.8, 0.9, 0.62]} c="#d9dee3" metal />
    <Box p={[0, 0.91, 0]} s={[0.82, 0.03, 0.64]} c="#2d3238" />
    <Box p={[0, 0.45, 0.315]} s={[0.6, 0.45, 0.02]} c="#3a3f46" shadow={false} />
    {/* panela */}
    <mesh position={[0, 1.0, 0.05]} castShadow>
      <cylinderGeometry args={[0.2, 0.18, 0.16, 14, 1, true]} />
      <meshStandardMaterial {...METAL} color="#8a939b" side={2} />
    </mesh>
    {flame > 0.01
      ? Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const hgt = (0.08 + 0.03 * Math.sin(frame / 3 + i * 1.7)) * clamp(flame, 0, 1.2);
          return (
            <mesh key={i} position={[0.15 * Math.cos(a), 0.92 + hgt / 2, 0.05 + 0.15 * Math.sin(a)]}>
              <coneGeometry args={[0.03, hgt, 6]} />
              <meshStandardMaterial color="#ff8a1c" emissive="#ff5a00" emissiveIntensity={1.4} />
            </mesh>
          );
        })
      : null}
  </group>
);

/** Marmita com face em corte mostrando a temperatura (borda, centro, absorção e alcance das ondas). */
const Marmita: React.FC<{ at: Vec3; cut: number; edge: number; core: number; absorb: number; depth: number; even: number; scale?: number; steam: number; frame: number }> = ({
  at,
  cut,
  edge,
  core,
  absorb,
  depth,
  even,
  scale = 1,
  steam,
  frame,
}) => {
  const key = `${q(edge)}-${q(core)}-${q(absorb)}-${q(depth)}-${q(even)}`;
  const map = useCanvasTexture(key, 320, 160, (ctx, w, h) => {
    const e = clamp(edge, 0, 1);
    const c = clamp(core, 0, 1);
    const a = clamp(Math.max(absorb, even), 0, 1);
    // borda quente → centro frio; com absorção, tudo vai para laranja
    const g = ctx.createLinearGradient(0, 0, w, 0);
    const hot = `rgb(${Math.round(lerp(214, 240, e))},${Math.round(lerp(140, 70, e))},${Math.round(lerp(80, 40, e))})`;
    const mid = `rgb(${Math.round(lerp(214, 90, c))},${Math.round(lerp(140, 170, c))},${Math.round(lerp(80, 230, c))})`;
    const warm = "rgb(242,140,60)";
    g.addColorStop(0, a > 0 ? warm : hot);
    g.addColorStop(0.5, a > 0.5 ? warm : mid);
    g.addColorStop(1, a > 0 ? warm : hot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (a > 0 && a <= 0.5) {
      ctx.fillStyle = `rgba(242,140,60,${a * 2})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (depth > 0.05) {
      // linha tracejada: até onde as ondas entram (alguns centímetros)
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#38d9ff";
      const inset = 70 * clamp(depth, 0, 1);
      ctx.strokeRect(inset * 0.6, inset * 0.45, w - inset * 1.2, h - inset * 0.9);
    }
    ctx.font = `900 28px ${FONT}, sans-serif`;
  });
  return (
    <group position={at} scale={scale}>
      {/* pote */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.3, 0.12, 0.2]} />
        <meshStandardMaterial color="#e9f2f7" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* comida */}
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[0.27, 0.09, 0.17]} />
        <meshStandardMaterial {...MATTE} color="#c9773c" />
      </mesh>
      {cut > 0.01 ? (
        <mesh position={[0, 0.06, 0.102]} scale={[1, clamp(cut, 0, 1), 1]}>
          <planeGeometry args={[0.28, 0.1]} />
          <meshBasicMaterial map={map} toneMapped={false} />
        </mesh>
      ) : null}
      {steam > 0.01
        ? Array.from({ length: 5 }).map((_, i) => {
            const t = (frame / 35 + i / 5) % 1;
            return (
              <mesh key={i} position={[-0.08 + i * 0.04, 0.14 + t * 0.35, 0.02 * Math.sin(frame / 9 + i)]} scale={(0.6 + t) * steam}>
                <sphereGeometry args={[0.03, 8, 6]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.5 * (1 - t)} depthWrite={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Moléculas de água (O + 2 H) que balançam e esquentam. */
const Molecules: React.FC<{ pop: number; shake: number; heat: number; out: number; frame: number }> = ({ pop, shake, heat, out, frame }) => {
  const k = clamp(pop, 0, 1.15) * (1 - clamp(out, 0, 1));
  if (k <= 0.001) return null;
  const hot = clamp(heat, 0, 1);
  const col = `rgb(${Math.round(lerp(79, 255, hot))},${Math.round(lerp(195, 90, hot))},${Math.round(lerp(255, 60, hot))})`;
  return (
    <group position={SPOT.molecules} scale={k}>
      {Array.from({ length: 9 }).map((_, i) => {
        const gx = ((i % 3) - 1) * 0.16;
        const gy = (Math.floor(i / 3) - 1) * 0.13;
        const rot = shake * 0.9 * Math.sin(frame * 1.35 + i * 1.1);
        return (
          <group key={i} position={[gx, gy, 0.02 * (i % 2)]} rotation={[0, 0, rot]}>
            <mesh>
              <sphereGeometry args={[0.04, 12, 10]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35 + 0.5 * hot} />
            </mesh>
            {[-0.91, 0.91].map((a) => (
              <mesh key={a} position={[0.048 * Math.sin(a), -0.048 * Math.cos(a) * -1 - 0.01, 0.01]}>
                <sphereGeometry args={[0.024, 10, 8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/** Mapa de pontos quentes/frios sobre o prato; gira com o prato e se uniformiza. */
const Hotspots: React.FC<{ show: number; even: number; spin: number }> = ({ show, even, spin }) => {
  const map = useCanvasTexture(`hot-${q(even)}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const e = clamp(even, 0, 1);
    const spots: [number, number, string][] = [
      [0.3, 0.3, "255,70,50"],
      [0.72, 0.62, "255,70,50"],
      [0.65, 0.25, "60,170,255"],
      [0.28, 0.72, "60,170,255"],
    ];
    for (const [x, y, rgb] of spots) {
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, 70);
      g.addColorStop(0, `rgba(${rgb},${1 - e})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = `rgba(242,140,60,${0.85 * e})`;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  if (show <= 0.01) return null;
  return (
    <mesh position={[SPOT.plate[0], SPOT.plate[1] + 0.15, SPOT.plate[2]]} rotation={[-Math.PI / 2, 0, spin]}>
      <circleGeometry args={[0.24, 32]} />
      <meshBasicMaterial map={map} transparent opacity={clamp(show * 1.2, 0, 1)} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

/** Ícone flutuante (olho da porta / "ding") desenhado em canvas e virado para a câmera. */
const Icon: React.FC<{ kind: "eye" | "ding"; at: Vec3; yaw: number; k: number }> = ({ kind, at, yaw, k }) => {
  const map = useCanvasTexture(`icon-${kind}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = kind === "eye" ? "#ffffff" : PALETTE.warning;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2);
    ctx.fill();
    if (kind === "eye") {
      ctx.fillStyle = "#1f3b57";
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 90, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#1d1a0c";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 72px ${FONT}, sans-serif`;
      ctx.fillText("DING!", w / 2, h / 2 + 4);
    }
  });
  if (k <= 0.001) return null;
  return (
    <mesh position={at} rotation={[0, yaw, 0]} scale={clamp(k, 0, 1.2)}>
      <planeGeometry args={[0.22, 0.22]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} />
    </mesh>
  );
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (id: string, fb = 0) => track(id, frame, fb);
  const vis = (id: string) => isVisible(id, frame);
  const pose = cameraPoseAt(frame);
  const yawTo = (p: Vec3) => Math.atan2(pose.position[0] - p[0], pose.position[2] - p[2]);

  const reveal = t("kitchen.reveal");
  const rise = t("microwave.rise");
  const spin = SPIN[clamp(frame, 0, DURATION)];
  const magOn = t("magnetron.on");

  // marmita: mão → panela → demonstração → prato do micro-ondas → mão do garçom
  const toPot = t("marmita.toPot");
  const toMicro = t("marmita.toMicro");
  const serve = t("waiter.serve");
  const potTop: Vec3 = [SPOT.pot[0], SPOT.pot[1] + 0.02, SPOT.pot[2]];
  const flame = t("stove.flame");
  // na explicação, a marmita "salta" da panela para perto da câmera, maior (esquemático)
  const cut = t("marmita.cut");
  const toDemo = t("marmita.toDemo");
  // na cena 2 ela sobe um pouco na panela (corte visível); na 3 salta para perto da câmera (esquemático)
  const inPot: Vec3 = [potTop[0], potTop[1] + 0.12 * clamp(cut, 0, 1), potTop[2]];
  let mAt = toDemo > 0 ? lerp3(inPot, SPOT.demo, clamp(toDemo, 0, 1)) : cut > 0 ? inPot : arc(SPOT.hand, potTop, toPot, 0.3);
  let mScale = 1 + 0.4 * clamp(cut, 0, 1) + 0.6 * clamp(toDemo, 0, 1);
  if (toMicro > 0) {
    mAt = arc(SPOT.demo, [SPOT.plate[0], SPOT.plate[1] + 0.03, SPOT.plate[2]], toMicro, 0.4);
    mScale = lerp(2.0, 1, toMicro);
  }
  if (serve > 0) {
    mAt = arc([SPOT.plate[0], SPOT.plate[1] + 0.03, SPOT.plate[2]], SPOT.serve, clamp(serve, 0, 1), 0.5);
  }

  const showWaves = t("waves.show") * (1 - clamp(toMicro * 2, 0, 1));
  const depth = t("waves.depth");
  const guide = t("waveguide.flow");
  const cav = Math.max(t("cavity.waves"), t("final.labels"));
  const leak = t("waves.leak");
  const bounce = t("waves.bounce");
  const blocked = t("waves.blocked");
  const lightPass = t("light.pass");

  const waves = [];
  // cena 3: ondas chegando na marmita (demonstração)
  if (showWaves > 0.01 && toMicro < 0.5) {
    for (let i = 0; i < 4; i++) {
      const ph = (frame / 30 + i / 4) % 1;
      // arcos descendo sobre a marmita
      waves.push(<WaveArc key={`d${i}`} at={[SPOT.demo[0], SPOT.demo[1] + 0.75 - ph * 0.5, SPOT.demo[2]]} r={0.2 + 0.06 * ph} rotZ={Math.PI} opacity={showWaves * (0.3 + 0.7 * ph)} thick={0.014} />);
    }
  }
  // magnetron → guia → cavidade
  if (guide > 0.01) {
    for (let i = 0; i < 3; i++) {
      const ph = (frame / 20 + i / 3) % 1;
      const x = lerp(SPOT.magnetron[0], CAVITY_CENTER[0], ph);
      waves.push(<WaveArc key={`g${i}`} at={[x, MW.y + MW.h - 0.02, MW.z]} r={0.03} rotY={Math.PI / 2} rotZ={Math.PI / 2} opacity={clamp(guide, 0, 1) * 0.95} thick={0.008} />);
    }
  }
  if (cav > 0.01 || leak > 0.01) {
    for (let i = 0; i < 4; i++) {
      const ph = (frame / 26 + i / 4) % 1;
      // ondas que descem do teto da cavidade; com o vazamento elas crescem além da caixa
      const maxR = lerp(0.26, 0.9, clamp(leak, 0, 1));
      const r = 0.05 + ph * maxR;
      const op = Math.max(cav, leak) * (leak > 0.01 ? 1 - ph : 1 - ph * 0.7) * 0.85;
      waves.push(<WaveArc key={`c${i}`} at={[CAVITY_CENTER[0], MW.y + MW.h - 0.05, MW.z]} r={r} rotZ={Math.PI} opacity={op} thick={0.01} />);
    }
  }
  if (bounce > 0.01) {
    // ricochetes: arcos subindo de volta do fundo (refletidos)
    for (let i = 0; i < 3; i++) {
      const ph = (frame / 22 + i / 3 + 0.17) % 1;
      waves.push(<WaveArc key={`b${i}`} at={[CAVITY_CENTER[0] + (i - 1) * 0.12, MW.y + 0.06, MW.z]} r={0.04 + ph * 0.18} opacity={bounce * (1 - ph) * 0.8} thick={0.009} />);
    }
  }
  if (blocked > 0.01) {
    // onda grande bate na tela e volta
    const ph = (frame / 30) % 1;
    const z = MW.frontZ - 0.12 + Math.sin(ph * Math.PI) * 0.1;
    waves.push(<WaveArc key="blk" at={[CAVITY_CENTER[0], CAVITY_CENTER[1], z]} r={0.16} rotY={Math.PI / 2} rotZ={Math.PI / 2} opacity={clamp(blocked, 0, 1)} thick={0.016} />);
  }

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Kitchen />
      <Stove flame={flame} frame={frame} />
      <Person
        at={SPOT.waiter}
        rotY={serve > 0.5 ? -Math.PI / 2 + 0.6 : -Math.PI / 4}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={1.2 * clamp(serve, 0, 1) + (toPot > 0 && toPot < 1 ? 1.1 : toPot <= 0 ? 0.9 : 0)}
        smile={serve > 0.5}
      />
      <Marmita
        at={mAt}
        scale={mScale * (1 - clamp(t("molecules.pop") * (1 - t("molecules.out")), 0, 1))}
        cut={t("marmita.cut")}
        edge={t("marmita.edgeHeat")}
        core={t("marmita.coldCore")}
        absorb={t("marmita.absorb")}
        depth={depth * (1 - clamp(toMicro * 2, 0, 1))}
        even={t("hotspots.even")}
        steam={clamp(serve, 0, 1)}
        frame={frame}
      />
      <Molecules pop={t("molecules.pop")} shake={t("molecules.shake")} heat={t("molecules.heat")} out={t("molecules.out")} frame={frame} />

      <MicrowaveBody rise={rise} metal={t("walls.metal")} door={t("door.highlight") * (vis("door") ? 1 : 0)} spin={spin} magOn={magOn} />
      {vis("hotspots") ? <Hotspots show={t("hotspots.show")} even={t("hotspots.even")} spin={spin} /> : null}
      {waves}
      {/* luz atravessando a tela da porta */}
      {lightPass > 0.01 && vis("light")
        ? [-0.08, 0, 0.08].map((dx) => (
            <mesh key={dx} position={[CAVITY_CENTER[0] + dx, CAVITY_CENTER[1], MW.frontZ + 0.25 * clamp(lightPass, 0, 1)]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.5 * clamp(lightPass, 0, 1), 6]} />
              <meshStandardMaterial color="#ffe066" emissive="#ffd23f" emissiveIntensity={1.2} transparent opacity={0.85} />
            </mesh>
          ))
        : null}
      {vis("door") ? <Icon kind="eye" at={[CAVITY_CENTER[0] + 0.2, MW.y + 0.38, MW.frontZ + 0.06]} yaw={yawTo([CAVITY_CENTER[0], MW.y + 0.4, MW.frontZ])} k={t("door.eye") * 0.6 * (1 - t("mesh.zoom"))} /> : null}
      <Icon kind="ding" at={[MW.x + 0.3, MW.y + MW.h + 0.2, MW.frontZ]} yaw={yawTo([MW.x, MW.y + 0.7, MW.frontZ])} k={t("bell.ding") * (1 - clamp(serve * 1.5, 0, 1))} />
      {/* tomada + cabo quando o plugue acende */}
      {t("plug.pop") > 0.01 ? (
        <mesh position={SPOT.plug} scale={clamp(t("plug.pop"), 0, 1.2)}>
          <boxGeometry args={[0.09, 0.07, 0.06]} />
          <meshStandardMaterial color="#222" emissive="#ffd23f" emissiveIntensity={0.8} />
        </mesh>
      ) : null}
    </group>
  );
};
