// Testes do motor do app (rodam no Node 20+): node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { JOGOS } from "../app/src/main/assets/www/motor/jogos.js";
import { montarMistura, checarMistura, empacotarMistura, erroDeSintaxeJs, slug } from "../app/src/main/assets/www/motor/gerador.js";
import { lerResposta } from "../app/src/main/assets/www/motor/ia.js";
import { crc32 } from "../app/src/main/assets/www/motor/zip.js";

const WWW = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "src", "main", "assets", "www");
const receita = (id) => JSON.parse(readFileSync(join(WWW, "conteudo", "receitas", `${id}.json`), "utf8"));
const template = (jogoId) =>
  Object.fromEntries(JOGOS[jogoId].template.map((c) => [c, readFileSync(join(WWW, "conteudo", "templates", jogoId, c), "utf8")]));

const SAIDA = mkdtempSync(join(tmpdir(), "mistura-teste-"));

test("crc32 bate com o valor conhecido", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("slug tira acentos e símbolos", () => {
  assert.equal(slug("Minecraft Souls: Edição Ação!"), "minecraft_souls_edicao_acao");
  assert.equal(slug("***"), "mistura");
});

test("catálogo só usa jogos e receitas que existem", () => {
  const cat = JSON.parse(readFileSync(join(WWW, "conteudo", "catalogo.json"), "utf8"));
  for (const m of cat.misturas) {
    assert.ok(JOGOS[m.jogo], m.id);
    receita(m.receita);
  }
});

for (const jogoId of Object.keys(JOGOS)) {
  for (const r of ["souls", "sobrevivencia"]) {
    test(`${jogoId} + ${r}: monta, confere e empacota`, () => {
      const m = montarMistura({ jogoId, nome: `Teste "${r}" ção`, descricao: "linha 1\nlinha 2", template: template(jogoId), receita: receita(r) });
      const { erros } = checarMistura(m);
      assert.deepEqual(erros, []);
      const p = empacotarMistura(m);
      assert.ok(p.nomeArquivo.endsWith(JOGOS[jogoId].pacote.extensao));
      const arq = join(SAIDA, p.nomeArquivo);
      writeFileSync(arq, p.bytes);
      // O zip precisa abrir num leitor de verdade.
      const lista = execFileSync("python3", ["-I", "-c",
        "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print('\\n'.join(z.namelist()))", arq]).toString().trim().split("\n");
      if (jogoId === "minecraft-bedrock") {
        assert.deepEqual(lista.sort(), [`${m.meta.modname}_BP/manifest.json`, `${m.meta.modname}_BP/scripts/config.js`, `${m.meta.modname}_BP/scripts/main.js`].sort());
        const mf = JSON.parse(m.arquivos["BP/manifest.json"]);
        assert.equal(mf.header.name, m.meta.nome);
        // main.js + config.js precisam ser módulos JS válidos
        const pasta = mkdtempSync(join(SAIDA, "bp-"));
        writeFileSync(join(pasta, "config.mjs"), m.arquivos["BP/scripts/config.js"]);
        execFileSync(process.execPath, ["--check", join(pasta, "config.mjs")]);
        writeFileSync(join(pasta, "main.mjs"), m.arquivos["BP/scripts/main.js"]);
        execFileSync(process.execPath, ["--check", join(pasta, "main.mjs")]);
      } else {
        assert.deepEqual(lista.sort(), ["config.lua", "init.lua", "mod.conf"].map((f) => `${m.meta.modname}/${f}`).sort());
        assert.match(m.arquivos["mod.conf"], new RegExp(`^name = ${m.meta.modname}$`, "m"));
        assert.doesNotMatch(m.arquivos["mod.conf"], /linha 1\n/);
        writeFileSync(join(SAIDA, `${m.meta.modname}.config.lua`), m.arquivos["config.lua"]);
        writeFileSync(join(SAIDA, `${m.meta.modname}.init.lua`), m.arquivos["init.lua"]);
        // Com TESTAR_LUA=1 (precisa de `pip install lupa`) roda o mod numa API Luanti falsa.
        if (process.env.TESTAR_LUA) {
          const fumaca = join(dirname(fileURLToPath(import.meta.url)), "luanti_fumaca.py");
          execFileSync("python3", ["-I", fumaca, join(SAIDA, `${m.meta.modname}.config.lua`), join(SAIDA, `${m.meta.modname}.init.lua`)]);
        }
      }
    });
  }
}

test("UUIDs mudam a cada mistura nova", () => {
  const a = montarMistura({ jogoId: "minecraft-bedrock", nome: "A", template: template("minecraft-bedrock"), receita: receita("souls") });
  const b = montarMistura({ jogoId: "minecraft-bedrock", nome: "A", template: template("minecraft-bedrock"), receita: receita("souls") });
  assert.notEqual(JSON.parse(a.arquivos["BP/manifest.json"]).header.uuid, JSON.parse(b.arquivos["BP/manifest.json"]).header.uuid);
});

test("checagem pega arquivo de jogo, marcador e JS quebrado", () => {
  const m = montarMistura({ jogoId: "minecraft-bedrock", nome: "X", template: template("minecraft-bedrock"), codigoIA: "import { world } from \"@minecraft/server\";\nworld.x(;\n" });
  m.arquivos["BP/lib/coisa.so"] = "x";
  m.arquivos["BP/texto.txt"] = "__NOME__";
  const { erros } = checarMistura(m);
  assert.ok(erros.some((e) => e.includes(".so")));
  assert.ok(erros.some((e) => e.includes("__NOME__")));
  assert.ok(erros.some((e) => e.includes("sintaxe")));
  assert.throws(() => empacotarMistura(m));
});

test("receita inválida é recusada", () => {
  const r = receita("souls");
  r.mecanicas.frasco.cura = -1;
  assert.throws(() => montarMistura({ jogoId: "luanti", nome: "X", template: template("luanti"), receita: r }), /cura/);
});

test("código da IA substitui o principal e não exige config", () => {
  const codigo = 'import { world, system } from "@minecraft/server";\nsystem.runInterval(() => { for (const p of world.getAllPlayers()) p.onScreenDisplay.setActionBar("oi"); }, 20);\n';
  const m = montarMistura({ jogoId: "minecraft-bedrock", nome: "IA", template: template("minecraft-bedrock"), codigoIA: codigo });
  assert.equal(m.arquivos["BP/scripts/main.js"], codigo);
  assert.deepEqual(checarMistura(m).erros, []);
  assert.equal(erroDeSintaxeJs(codigo), null);
});

test("lerResposta extrai nome, descrição e o maior bloco de código", () => {
  const r = lerResposta("<think>pensando</think>NOME: Chuva\nDESCRICAO: Meteoros caem.\n```js\nconsole.log(1)\n```\ntexto\n```\nx\n```");
  assert.equal(r.nome, "Chuva");
  assert.equal(r.descricao, "Meteoros caem.");
  assert.equal(r.codigo, "console.log(1)\n");
  assert.throws(() => lerResposta("sem código"));
});

test.after(() => console.log("arquivos de teste em", SAIDA));
