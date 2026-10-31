// Melty Droid: adaptador Minecraft Bedrock (Script API oficial, @minecraft/server 1.11.0).
// Os números vêm de ./config.js, gerado pelo `mistura novo` a partir de uma receita.
//
// Controles (funciona no toque do celular):
//   correr ............. gasta estamina; sem estamina você fica lento e fraco
//   bater .............. gasta estamina
//   agachar + pular .... esquiva para onde você olha (invulnerável por um instante)
//   usar frasco de vidro  bebe uma carga do frasco de cura
//   agachar perto de uma fogueira acesa: descansa (recarrega frascos, cura tudo, vira ponto de renascimento)

import { world, system } from "@minecraft/server";
import { CONFIG } from "./config.js";

const TICKS = 2; // o laço roda a cada 2 ticks (0,1 s)
const DT = TICKS / 20;
const PROP_CARGAS = "mistura:cargas";

const E = CONFIG.estamina;
const estados = new Map();

function estado(player) {
  let s = estados.get(player.id);
  if (!s) {
    const salvo = player.getDynamicProperty(PROP_CARGAS);
    s = {
      estamina: E.max,
      parado: 0,
      cargas: typeof salvo === "number" ? salvo : CONFIG.frasco.cargas,
      pulando: false,
      naFogueira: false,
    };
    estados.set(player.id, s);
  }
  return s;
}

function salvarCargas(player, s) {
  player.setDynamicProperty(PROP_CARGAS, s.cargas);
}

function cansar(player) {
  player.addEffect("slowness", 30, { amplifier: 1, showParticles: false });
  player.addEffect("weakness", 30, { amplifier: 0, showParticles: false });
}

function gastar(player, s, quanto) {
  s.estamina = Math.max(0, s.estamina - quanto);
  s.parado = 0;
  if (s.estamina === 0) cansar(player);
}

function barra(valor, max) {
  const cheio = Math.round((valor / max) * 10);
  return "§a" + "|".repeat(cheio) + "§8" + "|".repeat(10 - cheio);
}

function esquivar(player, s) {
  if (s.estamina < CONFIG.esquiva.custo) return;
  gastar(player, s, CONFIG.esquiva.custo);
  const olhar = player.getViewDirection();
  const tam = Math.hypot(olhar.x, olhar.z) || 1;
  player.applyKnockback(olhar.x / tam, olhar.z / tam, CONFIG.esquiva.forca, CONFIG.esquiva.altura);
  const ticks = Math.max(1, Math.round(CONFIG.esquiva.invulneravelSegundos * 20));
  player.addEffect("resistance", ticks, { amplifier: 4, showParticles: false }); // nível V = 100% de redução
}

function fogueiraPerto(player) {
  const r = CONFIG.fogueira.raio;
  const base = player.location;
  const bx = Math.floor(base.x);
  const by = Math.floor(base.y);
  const bz = Math.floor(base.z);
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        let bloco;
        try {
          bloco = player.dimension.getBlock({ x: bx + dx, y: by + dy, z: bz + dz });
        } catch {
          continue; // fora do mundo carregado
        }
        if (!bloco || !CONFIG.fogueira.blocos.includes(bloco.typeId)) continue;
        if (bloco.permutation.getState("extinguished") === true) continue;
        return bloco;
      }
    }
  }
  return undefined;
}

function descansar(player, s, fogueira) {
  s.cargas = CONFIG.frasco.cargas;
  salvarCargas(player, s);
  s.estamina = E.max;
  player.getComponent("minecraft:health")?.resetToMaxValue();
  const l = fogueira.location;
  player.setSpawnPoint({ dimension: player.dimension, x: l.x, y: l.y + 1, z: l.z });
  player.sendMessage("§6Você descansou na fogueira. Frascos recarregados e renascimento marcado aqui.");
}

function beberFrasco(player) {
  const s = estado(player);
  if (s.cargas <= 0) {
    player.sendMessage("§7O frasco está vazio. Descanse numa fogueira.");
    return;
  }
  const vida = player.getComponent("minecraft:health");
  if (!vida) return;
  s.cargas -= 1;
  salvarCargas(player, s);
  vida.setCurrentValue(Math.min(vida.effectiveMax, vida.currentValue + CONFIG.frasco.cura));
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const s = estado(player);

    if (player.isSprinting) {
      gastar(player, s, E.corridaPorSegundo * DT);
    } else {
      s.parado += DT;
      if (s.parado >= E.atrasoRegenSegundos) {
        s.estamina = Math.min(E.max, s.estamina + E.regenPorSegundo * DT);
      }
    }

    const pulando = player.isJumping;
    if (pulando && !s.pulando && player.isSneaking) esquivar(player, s);
    s.pulando = pulando;

    const fogueira = player.isSneaking ? fogueiraPerto(player) : undefined;
    if (fogueira && !s.naFogueira) descansar(player, s, fogueira);
    s.naFogueira = Boolean(fogueira);

    player.onScreenDisplay.setActionBar(
      `Estamina ${barra(s.estamina, E.max)}§r   Frascos §6${s.cargas}/${CONFIG.frasco.cargas}`
    );
  }
}, TICKS);

world.afterEvents.entityHitEntity.subscribe((ev) => {
  const atacante = ev.damagingEntity;
  if (atacante?.typeId !== "minecraft:player") return;
  gastar(atacante, estado(atacante), E.ataque);
});

world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack?.typeId === CONFIG.frasco.item) beberFrasco(ev.source);
});

world.afterEvents.entityDie.subscribe((ev) => {
  const morto = ev.deadEntity;
  if (morto?.typeId !== "minecraft:player") return;
  morto.onScreenDisplay.setTitle(`§4${CONFIG.morte.titulo}`, {
    subtitle: CONFIG.morte.subtitulo,
    fadeInDuration: 10,
    stayDuration: 60,
    fadeOutDuration: 20,
  });
});

world.afterEvents.playerSpawn.subscribe((ev) => {
  const s = estado(ev.player);
  s.estamina = E.max;
  s.parado = 0;
});

world.afterEvents.playerLeave.subscribe((ev) => {
  estados.delete(ev.playerId);
});
