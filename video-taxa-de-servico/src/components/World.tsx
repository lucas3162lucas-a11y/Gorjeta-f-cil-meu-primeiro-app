import { useCurrentFrame } from "remotion";
import { isVisible, track } from "../data/scenes";
import { PALETTE } from "../theme";
import { clamp, lerp, pulse, type Vec3 } from "../utils/animation";
import { SLICES, SPOT, STAFF_POCKET } from "../utils/layout";
import { cameraPoseAt } from "./CameraController";
import { arc, CoinLoop, CoinStream } from "./Coins";
import { Person } from "./Person";
import { Bill, Handshake, LawIcon, NoticeBoard, Payslip, Question, Register, RulesBoard, Spotlight, SplitDisc, TipBox, TipJar, TipStack, Vault } from "./Props";
import { Restaurant } from "./Restaurant";

// O cenário persistente: o MESMO restaurante do começo ao fim. Cada objeto lê seu estado das
// trilhas (track) no frame GLOBAL, então nada "pula" entre cortes — só a câmera se move.

const up = (p: Vec3, dy: number): Vec3 => [p[0], p[1] + dy, p[2]];
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (id: string, fb = 0) => track(id, frame, fb);
  const vis = (id: string) => isVisible(id, frame);
  const pose = cameraPoseAt(frame);
  const yawTo = (p: Vec3) => Math.atan2(pose.position[0] - p[0], pose.position[2] - p[2]);

  const reveal = t("restaurant.reveal");
  const dim = t("kitchen.dim");
  const highlight = t("kitchen.highlight");

  // ------------------------------------------------ nota na mesa (cena 1–2)
  const place = t("tipNote.place");
  const noteFrom: Vec3 = [SPOT.customer[0] + 0.45, 1.05, SPOT.customer[2] + 0.1];
  const noteTo: Vec3 = [SPOT.table[0] + 0.25, 0.8, SPOT.table[2] + 0.2];
  const notePos = arc(noteFrom, noteTo, place, 0.15);
  const arrow = t("tipArrow.draw");
  const waiterHand: Vec3 = [SPOT.waiter[0] - 0.15, 1.05, SPOT.waiter[2] - 0.1];

  // ------------------------------------------------ conta
  const atTable = t("bill.atTable");
  const billPos = lerp3(SPOT.billCounter, SPOT.billTable, atTable);
  const off = t("bill.serviceOff");

  // ------------------------------------------------ caixa e gorjeta
  const split = t("register.split");
  const jarFill = t("tipJar.fill");
  const jarDrop = t("tipJar.drop") * (1 - clamp(split * 1.3, 0, 1));
  const tipFill = clamp(t("coins.sort") + t("coins.loop"), 0, 1) * (1 - clamp(t("tipStack.drop") * 0.7, 0, 0.7));

  // ------------------------------------------------ rateio
  const form = t("splitDisc.form");
  const retain = t("splitDisc.retain");
  const pocket = t("staff.pocket");
  const glowHall = t("staff.glowHall");
  const glowKitchen = t("staff.glowKitchen");
  const loop = t("coins.loop");

  // ------------------------------------------------ personagens
  const wave = t("waiter.wave");
  // o garçom sai de quadro enquanto a câmera fica no balcão (cenas 3–6) e volta na cena 7
  const walk = t("waiter.walk");
  const waiterAt = lerp3(SPOT.waiter, [-2.95, 0, 0.3], walk);
  const step = walk > 0.02 && walk < 0.98 ? Math.abs(Math.sin(frame / 3)) * 0.05 : 0;
  const cookWork = Math.sin(frame / 7) * 0.35;
  const dishWork = Math.sin(frame / 6 + 1) * 0.3;
  const ownerIn = t("owner.enter");
  const reach = t("owner.reach");
  const bounce = (k: number) => Math.sin(clamp(k, 0, 1) * Math.PI) * 0.12;

  const discTop: Vec3 = up(SPOT.disc, 0.12);
  const tipTop: Vec3 = [SPOT.tipBox[0], SPOT.tipBox[1] + 0.4, SPOT.tipBox[2]];
  const drawerPos: Vec3 = [SPOT.register[0], SPOT.register[1] + 0.12, SPOT.register[2] + 0.35];
  const jarTop: Vec3 = [SPOT.jar[0], SPOT.jar[1] + 0.5, SPOT.jar[2]];

  return (
    <group position={[0, (clamp(reveal, 0, 1.2) - 1) * 2.2, 0]}>
      <Restaurant />

      {/* cozinha "apagada" quando ninguém recebe; luz quente quando ganha destaque */}
      {dim > 0.01 ? (
        <mesh position={[2.25, 1.3, -0.1]}>
          <boxGeometry args={[2.68, 2.62, 3.36]} />
          <meshBasicMaterial color="#1d1410" transparent opacity={dim} depthWrite={false} />
        </mesh>
      ) : null}
      {highlight > 0.01 ? <pointLight position={[2.2, 2.2, 0.6]} intensity={2.2 * highlight} distance={5} color="#ffd9a0" /> : null}

      {/* personagens */}
      <Person at={SPOT.customer} shirt="#5b8bd6" pants="#3c3f58" seated armR={1.25 * (place > 0 && place < 1 ? 1 : 0) + 0.5 * clamp(t("customer.lookUp"), 0, 1)} headTilt={0.25 * t("customer.lookUp")} />
      <Person
        at={waiterAt}
        rotY={-2.2 + Math.sin(Math.PI * walk) * 1.2}
        shirt="#ffffff"
        pants="#1f2430"
        apron="#1f2430"
        skin={PALETTE.skin2}
        armR={wave * (2.3 + 0.35 * Math.sin(frame / 3.5))}
        lift={bounce(pocket) + step}
        glow={Math.max(glowHall, 0.6 * t("spot.waiter") * (1 - form))}
      />
      <Person at={SPOT.cook} rotY={1.0} shirt="#fafafa" pants="#3a3a3a" apron="#e9ecef" hat="chef" skin={PALETTE.skin3} armR={0.9 + cookWork} armL={0.7 - cookWork} lift={bounce(pocket)} glow={Math.max(glowKitchen, 0.6 * t("spot.cook") * (1 - form))} />
      <Person at={SPOT.dishwasher} rotY={0} shirt="#2a9d8f" pants="#264653" apron="#a8dadc" hat="cap" armR={0.9 + dishWork} armL={0.9 - dishWork} lift={bounce(pocket)} glow={Math.max(glowKitchen, 0.6 * t("spot.dishwasher") * (1 - form))} />
      {vis("owner") ? (
        <Person at={SPOT.owner} rotY={-Math.PI / 2} shirt="#3a3f4b" pants="#22252c" apron="#6b2737" lift={(clamp(ownerIn, 0, 1.1) - 1) * 1.1} armR={1.3 * reach} armL={0.2 * reach} />
      ) : null}

      {/* nota na mesa e seta "só o garçom" */}
      {vis("tipNote") && place > 0 ? (
        <mesh position={notePos} rotation={[0, 0.4 + place, 0]} castShadow>
          <boxGeometry args={[0.24, 0.012, 0.12]} />
          <meshStandardMaterial color={PALETTE.cash} roughness={0.9} />
        </mesh>
      ) : null}
      {vis("tipArrow") && arrow > 0.01
        ? Array.from({ length: 9 }).map((_, i) => {
            const k = i / 8;
            if (k > arrow) return null;
            return (
              <mesh key={i} position={arc(up(noteTo, 0.05), waiterHand, k, 0.35)}>
                <sphereGeometry args={[i === 8 ? 0.06 : 0.035, 8, 6]} />
                <meshBasicMaterial color={PALETTE.negative} toneMapped={false} />
              </mesh>
            );
          })
        : null}

      {/* caixa, pote e gaveta da gorjeta */}
      <Register at={SPOT.register} drawer={t("register.drawer")} mix={t("register.mix") * (1 - clamp(t("coins.sort") * 1.5, 0, 1))} split={split} />
      {vis("tipJar") ? <TipJar at={SPOT.jar} drop={jarDrop} fill={jarFill} /> : null}
      <TipBox at={SPOT.tipBox} scale={split} fill={tipFill} glow={pulse(frame, 30) * loop} />

      {/* conta */}
      {vis("bill") ? (
        <Bill
          at={billPos}
          yaw={yawTo(billPos)}
          s={{
            print: t("bill.print"),
            serviceLine: t("bill.serviceLine"),
            percent: t("percentDial.value", 10),
            glow: t("bill.serviceGlow") * (1 - clamp(t("bill.atTable") * 2, 0, 1)),
            toggle: t("bill.toggle"),
            off,
            stamp: t("law.stamp"),
          }}
        />
      ) : null}
      {vis("noticeBoard") ? <NoticeBoard at={SPOT.notice} reveal={t("noticeBoard.reveal")} /> : null}
      {vis("lawIcon") ? <LawIcon at={up(SPOT.register, 0.75)} pop={t("lawIcon.pop")} frame={frame} /> : null}

      {/* rateio */}
      {vis("spotlight")
        ? SLICES.filter((s) => s.id !== "retained").map((s) => <Spotlight key={s.id} at={SPOT[s.id as "waiter" | "cook" | "dishwasher"]} k={t(`spot.${s.id}`) * (1 - form)} color={s.color} />)
        : null}
      {vis("spotlight")
        ? (["waiter", "cook", "dishwasher"] as const).map((id) => {
            const p: Vec3 = [SPOT[id][0], 2.05 + 0.04 * Math.sin(frame / 8 + id.length), SPOT[id][2]];
            return <Question key={id} at={p} yaw={yawTo(p)} k={t("questionMarks") * (1 - form)} />;
          })
        : null}
      {vis("tipStack") ? <TipStack at={SPOT.disc} drop={t("tipStack.drop")} form={form} wobble={t("questionMarks") * Math.sin(frame / 3)} /> : null}
      {vis("splitDisc") ? <SplitDisc at={SPOT.disc} form={form} slices={t("splitDisc.slices")} retain={retain} vault={SPOT.vault} pulse={pulse(frame, 36) * Math.max(loop, 0.3)} /> : null}
      {vis("rulesBoard") ? <RulesBoard at={up(SPOT.disc, 1.65)} yaw={yawTo(up(SPOT.disc, 1.65))} drop={t("rulesBoard.drop")} /> : null}
      {vis("handshake") ? <Handshake at={[SPOT.disc[0] - 0.35, 1.0, SPOT.disc[2] + 0.35]} yaw={yawTo(up(SPOT.disc, 1.0))} pop={t("handshake.pop") * 1.7} /> : null}
      {vis("chargeVault") ? <Vault at={SPOT.vault} pop={t("chargeVault.pop")} lock={t("chargeVault.lock")} /> : null}
      {vis("payslip") ? (
        <Payslip at={SPOT.payslip} yaw={yawTo(SPOT.payslip)} rise={t("payslip.rise")} tipLine={t("payslip.tipLine")} inss={t("chargeTags.inss")} fgts={t("chargeTags.fgts")} />
      ) : null}

      {/* dinheiro em movimento */}
      {vis("coins") ? (
        <>
          {[SPOT.table, SPOT.table2, SPOT.table3].map((tb, i) => (
            <CoinStream key={`flow${i}`} from={up(tb, 0.85)} to={jarTop} p={t("coins.flow")} count={4} height={0.9} seed={`flow${i}`} />
          ))}
          <CoinStream from={jarTop} to={drawerPos} p={t("register.mix")} count={6} height={0.35} seed="mix" spread={0.05} />
          {[SPOT.table2, SPOT.table3].map((tb, i) => (
            <CoinStream key={`cash${i}`} from={up(tb, 0.85)} to={drawerPos} p={t("register.mix")} count={3} height={0.8} seed={`cash${i}`} kind="cash" />
          ))}
          <CoinStream from={tipTop} to={discTop} p={t("tipStack.drop")} count={5} height={0.6} seed="stack" spread={0.04} />
          <CoinStream from={drawerPos} to={tipTop} p={t("coins.sort")} count={6} height={0.35} seed="sort" spread={0.06} />
          {(["waiter", "cook", "dishwasher"] as const).map((id, i) => (
            <CoinStream key={id} from={discTop} to={STAFF_POCKET[id]} p={t("coins.toStaff")} count={[5, 4, 3][i]} height={id === "waiter" ? 0.7 : 1.9} seed={`staff${id}`} spread={0.15} />
          ))}
          <CoinStream from={up(SPOT.payslip, -0.6)} to={[SPOT.payslip[0] + 0.1, 0.05, SPOT.payslip[2] + 0.15]} p={t("coins.leak")} count={5} height={0.15} seed="leak" spread={0.08} />
          {/* fluxo completo da cena final */}
          <CoinLoop from={up(SPOT.table, 0.85)} to={tipTop} frame={frame} period={38} count={3} height={0.9} seed="l1" intensity={loop} />
          <CoinLoop from={tipTop} to={discTop} frame={frame + 11} period={34} count={3} height={0.7} seed="l2" intensity={loop} />
          {(["waiter", "cook", "dishwasher"] as const).map((id, i) => (
            <CoinLoop key={`l${id}`} from={discTop} to={STAFF_POCKET[id]} frame={frame + 7 * i} period={40} count={2} height={id === "waiter" ? 0.7 : 1.9} seed={`l3${id}`} intensity={loop} />
          ))}
          <CoinLoop from={discTop} to={up(SPOT.vault, 0.62)} frame={frame + 19} period={60} count={1} height={0.5} seed="l4" intensity={loop} />
        </>
      ) : null}
    </group>
  );
};
