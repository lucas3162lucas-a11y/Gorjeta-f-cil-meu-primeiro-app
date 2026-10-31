// Teste de fumaça do add-on Bedrock gerado: roda main.js com um @minecraft/server falso.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JOGOS } from "../app/src/main/assets/www/motor/jogos.js";
import { montarMistura } from "../app/src/main/assets/www/motor/gerador.js";

const WWW = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "src", "main", "assets", "www");

const FALSO = `
export const eventos = {};
const assina = (nome) => ({ subscribe: (f) => { eventos[nome] = f; } });
export const world = {
  jogadores: [],
  getAllPlayers() { return this.jogadores; },
  afterEvents: new Proxy({}, { get: (_, nome) => assina(nome) }),
};
export const intervalo = { f: null, ticks: 0 };
export const system = { runInterval(f, t) { intervalo.f = f; intervalo.ticks = t; return 1; } };
`;

function jogador() {
  const p = {
    id: "1", typeId: "minecraft:player", location: { x: 0.5, y: 64, z: 0.5 },
    isSprinting: false, isSneaking: false, isJumping: false,
    props: {}, efeitos: [], msgs: [], barra: "", titulo: null, spawn: null, empurrao: null,
    vida: { currentValue: 20, effectiveMax: 20, setCurrentValue(v) { this.currentValue = v; }, resetToMaxValue() { this.currentValue = 20; } },
    fogueira: false,
    getDynamicProperty(k) { return this.props[k]; },
    setDynamicProperty(k, v) { this.props[k] = v; },
    addEffect(nome, ticks, op) { this.efeitos.push([nome, ticks, op.amplifier]); },
    getViewDirection() { return { x: 0, y: -0.2, z: 1 }; },
    applyKnockback(x, z, h, v) { this.empurrao = [x, z, h, v]; },
    getComponent(n) { return n === "minecraft:health" ? this.vida : undefined; },
    setSpawnPoint(s) { this.spawn = s; },
    sendMessage(m) { this.msgs.push(m); },
    onScreenDisplay: { setActionBar: (t) => (p.barra = t), setTitle: (t, o) => (p.titulo = [t, o.subtitle]) },
  };
  p.dimension = {
    getBlock: ({ x, y, z }) => ({
      typeId: p.fogueira && x === 1 && y === 64 && z === 0 ? "minecraft:campfire" : "minecraft:air",
      location: { x, y, z },
      permutation: { getState: (s) => (s === "extinguished" ? false : undefined) },
    }),
  };
  return p;
}

for (const receitaId of ["souls", "sobrevivencia"]) {
  test(`Bedrock + ${receitaId}: mecânicas funcionam com a API falsa`, async () => {
    const j = JOGOS["minecraft-bedrock"];
    const tpl = Object.fromEntries(j.template.map((c) => [c, readFileSync(join(WWW, "conteudo/templates/minecraft-bedrock", c), "utf8")]));
    const receita = JSON.parse(readFileSync(join(WWW, `conteudo/receitas/${receitaId}.json`), "utf8"));
    const m = montarMistura({ jogoId: "minecraft-bedrock", nome: "T", template: tpl, receita });
    const dir = mkdtempSync(join(tmpdir(), "bedrock-"));
    writeFileSync(join(dir, "falso.mjs"), FALSO);
    writeFileSync(join(dir, "config.mjs"), m.arquivos["BP/scripts/config.js"]);
    writeFileSync(join(dir, "main.mjs"), m.arquivos["BP/scripts/main.js"].replace('"@minecraft/server"', '"./falso.mjs"').replace('"./config.js"', '"./config.mjs"'));

    const api = await import(pathToFileURL(join(dir, "falso.mjs")));
    await import(pathToFileURL(join(dir, "main.mjs")));
    const { CONFIG } = await import(pathToFileURL(join(dir, "config.mjs")));
    const p = jogador();
    api.world.jogadores.push(p);
    const tick = (n = 1) => { for (let i = 0; i < n; i++) api.intervalo.f(); };

    assert.equal(api.intervalo.ticks, 2);
    tick();
    assert.match(p.barra, /Estamina/);
    assert.match(p.barra, new RegExp(`Frascos §6${CONFIG.frasco.cargas}/${CONFIG.frasco.cargas}`));

    // Correr até zerar a estamina deixa lento e fraco.
    p.isSprinting = true;
    tick(Math.ceil(CONFIG.estamina.max / (CONFIG.estamina.corridaPorSegundo * 0.1)) + 2);
    assert.ok(p.efeitos.some(([n]) => n === "slowness"));
    p.isSprinting = false;
    tick(200);

    // Esquiva: agachar + pular.
    p.isSneaking = true; tick();
    p.isJumping = true; tick();
    assert.ok(p.empurrao, "não esquivou");
    assert.ok(Math.abs(p.empurrao[1] - 1) < 1e-9, "esquiva na direção errada");
    assert.ok(p.efeitos.some(([n, , a]) => n === "resistance" && a === 4));
    p.isJumping = false; p.isSneaking = false; tick();

    // Frasco.
    p.vida.currentValue = 4;
    api.eventos.itemUse({ source: p, itemStack: { typeId: "minecraft:glass_bottle" } });
    assert.equal(p.vida.currentValue, 4 + CONFIG.frasco.cura);
    assert.equal(p.props["mistura:cargas"], CONFIG.frasco.cargas - 1);

    // Bater gasta estamina.
    api.eventos.entityHitEntity({ damagingEntity: p });

    // Fogueira.
    p.fogueira = true; p.isSneaking = true; tick();
    assert.equal(p.vida.currentValue, 20);
    assert.equal(p.props["mistura:cargas"], CONFIG.frasco.cargas);
    assert.deepEqual([p.spawn.x, p.spawn.y, p.spawn.z], [1, 65, 0]);
    const msgs = p.msgs.length;
    tick(); // continuar agachado não repete a mensagem
    assert.equal(p.msgs.length, msgs);

    api.eventos.entityDie({ deadEntity: p });
    assert.equal(p.titulo[0], "§4" + CONFIG.morte.titulo);
  });
}
