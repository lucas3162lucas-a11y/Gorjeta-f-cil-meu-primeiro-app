// Jogos "anfitriões" suportados pelo app. Cada um usa só o canal OFICIAL de mods do jogo,
// por isso nada precisa de root: o app gera o pacote e o próprio jogo importa.
//
// Para adicionar um jogo novo:
//   1. crie conteudo/templates/<id>/ com os arquivos do mod (use __NOME__, __DESCRICAO__ etc.);
//   2. adicione um item aqui;
//   3. adicione o pacote Android do jogo em <queries> no AndroidManifest.xml.

import { paraLua } from "./lua.js";

const uuid = () => globalThis.crypto.randomUUID();

export const JOGOS = {
  "minecraft-bedrock": {
    nome: "Minecraft",
    subtitulo: "Bedrock / Pocket Edition",
    pacoteAndroid: "com.mojang.minecraftpe",
    canal: "Add-on oficial (Script API)",
    cor: "#5b8f2f",
    template: ["BP/manifest.json", "BP/scripts/main.js"],
    arquivoPrincipal: "BP/scripts/main.js",
    arquivoConfig: "BP/scripts/config.js",
    marcadores: (m) => ({
      __NOME__: m.nome,
      __DESCRICAO__: m.descricao,
      __UUID_HEADER__: uuid(),
      __UUID_SCRIPT__: uuid(),
    }),
    gerarConfig: (receita) => {
      const cfg = structuredClone(receita.mecanicas);
      cfg.frasco.item = "minecraft:glass_bottle";
      cfg.fogueira.blocos = ["minecraft:campfire", "minecraft:soul_campfire"];
      return (
        `// Gerado pelo Melty Droid a partir da receita "${receita.id}".\n` +
        "export const CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n"
      );
    },
    // Só a pasta BP vai pro pacote; dentro do .mcaddon ela ganha um nome único.
    pacote: {
      extensao: ".mcaddon",
      mime: "application/octet-stream",
      incluir: (caminho) => caminho.startsWith("BP/"),
      caminhoNoZip: (caminho, m) => `${m.modname}_BP/${caminho.slice(3)}`,
    },
    // Abrir o .mcaddon com o Minecraft faz ele importar sozinho.
    instalacao: "abrir",
    passos: [
      "O Minecraft abre e importa o pacote sozinho.",
      "Crie ou edite um mundo → Pacotes de comportamento → ative a mistura.",
      "Entre no mundo e jogue.",
    ],
    guiaIA: `Você escreve o arquivo scripts/main.js de um add-on de comportamento do Minecraft Bedrock 1.21+.
Regras:
- Use apenas a Script API estável: import { world, system } from "@minecraft/server"; (versão 1.11.0). Não use @minecraft/server-ui nem APIs beta.
- Não dependa de arquivos de recurso, texturas, entidades ou itens customizados: use itens, blocos, efeitos e mobs que já existem no jogo (ids "minecraft:...").
- APIs úteis: system.runInterval(fn, ticks); world.getAllPlayers(); player.onScreenDisplay.setActionBar(texto); player.onScreenDisplay.setTitle(titulo, {subtitle, fadeInDuration, stayDuration, fadeOutDuration}); player.sendMessage(texto); player.addEffect("speed", ticks, {amplifier, showParticles}); player.getComponent("minecraft:health") (currentValue, effectiveMax, setCurrentValue, resetToMaxValue); player.isSprinting / isSneaking / isJumping / isOnGround; player.getViewDirection(); player.applyKnockback(dirX, dirZ, forcaHorizontal, forcaVertical); player.location; player.dimension.getBlock({x,y,z}); player.dimension.spawnEntity("minecraft:zombie", {x,y,z}); player.dimension.createExplosion(local, raio); player.setDynamicProperty(chave, valor) / getDynamicProperty(chave); player.runCommand("comando").
- Eventos úteis: world.afterEvents.entityHitEntity, entityHurt, entityDie, itemUse, playerSpawn, playerLeave, playerBreakBlock, playerPlaceBlock.
- Tudo precisa funcionar no celular (controles de toque): prefira agachar, pular, correr e usar itens como gatilhos.
- Textos para o jogador em português do Brasil.`,
  },

  luanti: {
    nome: "Luanti",
    subtitulo: "ex-Minetest, código aberto",
    pacoteAndroid: "net.minetest.minetest",
    canal: "Mod Lua oficial",
    cor: "#3d6fb6",
    template: ["mod.conf", "init.lua"],
    arquivoPrincipal: "init.lua",
    arquivoConfig: "config.lua",
    marcadores: (m) => ({
      __NOME__: m.nome,
      __DESCRICAO__: m.descricao,
      __MODNAME__: m.modname,
    }),
    gerarConfig: (receita) => {
      const cfg = structuredClone(receita.mecanicas);
      cfg.fogueira.blocos = ["fire:permanent_flame", "default:furnace_active", "group:campfire"];
      return `-- Gerado pelo Melty Droid a partir da receita "${receita.id}".\nreturn ${paraLua(cfg)}\n`;
    },
    pacote: {
      extensao: ".zip",
      mime: "application/zip",
      incluir: () => true,
      caminhoNoZip: (caminho, m) => `${m.modname}/${caminho}`,
    },
    // O Luanti não importa arquivos sozinho: o app salva o .zip em Downloads.
    instalacao: "salvar",
    passos: [
      "O app salva o .zip na pasta Downloads.",
      "Extraia o .zip dentro da pasta mods do Luanti (Luanti → Sobre → Abrir diretório de dados).",
      "No Luanti: Iniciar jogo → escolha o mundo → Selecionar mods → ative a mistura.",
    ],
    guiaIA: `Você escreve o arquivo init.lua de um mod do Luanti (ex-Minetest) 5.4+ que roda com o Minetest Game.
Regras:
- Use só a API Lua oficial (tabela minetest / core). Não use bibliotecas externas nem outros mods além de "default".
- Não use texturas novas: para itens/blocos novos, reaproveite texturas que existem no Minetest Game (ex.: "default_stone.png") com modificadores como "^[colorize:#ff0000:120".
- APIs úteis: minetest.register_globalstep(function(dtime)); minetest.get_connected_players(); player:get_player_control() (up, down, left, right, jump, aux1, sneak, dig, place); player:get_pos(); player:set_pos(pos); player:get_look_dir(); player:add_velocity(v); player:set_physics_override({speed, jump, gravity}); player:get_hp() / set_hp(); player:hud_add / hud_change; player:get_meta(); minetest.add_entity; minetest.add_item; minetest.set_node(pos, {name=...}); minetest.find_node_near(pos, raio, nomes); minetest.after(segundos, fn); minetest.chat_send_player(nome, texto); minetest.register_on_joinplayer / on_dieplayer / on_respawnplayer / on_punchplayer; minetest.register_craftitem; minetest.register_node.
- Tudo precisa funcionar no celular: os botões de toque são pular, agachar, "Especial" (aux1), cavar e colocar.
- Textos para o jogador em português do Brasil.`,
  },
};

export function jogo(id) {
  const j = JOGOS[id];
  if (!j) throw new Error(`Jogo não suportado: ${id}`);
  return j;
}
