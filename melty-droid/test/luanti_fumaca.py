"""Teste de fumaça do mod Luanti gerado: roda init.lua com uma API `minetest` falsa (precisa de `pip install lupa`).
Uso: python3 test/luanti_fumaca.py <arquivo config.lua> <arquivo init.lua>
"""
import sys
from lupa import LuaRuntime

config_path, init_path = sys.argv[1], sys.argv[2]
lua = LuaRuntime(unpack_returned_tuples=True)

stub = r"""
local cfg_path = ...
local cb = { step = {}, join = {}, die = {}, respawn = {}, leave = {} }
local chats = {}
local after_q = {}
function table.copy(t) local r = {} for k, v in pairs(t) do r[k] = v end return r end
local function novo_jogador(nome)
  local p = { _hp = 10, _pos = {x=0,y=0,z=0}, _vel = {x=0,y=0,z=0}, _meta = {}, _ctrl = {}, _phys = {}, _armor = {fleshy=100}, _huds = {} }
  function p:get_player_name() return nome end
  function p:get_meta()
    local m = {}
    function m:get_string(k) return p._meta[k] or "" end
    function m:set_string(k, v) p._meta[k] = v end
    function m:get_int(k) return tonumber(p._meta[k]) or 0 end
    function m:set_int(k, v) p._meta[k] = tostring(v) end
    return m
  end
  function p:get_player_control() return p._ctrl end
  function p:get_pos() return p._pos end
  function p:set_pos(v) p._pos = v end
  function p:get_look_dir() return {x=1,y=0,z=0} end
  function p:add_velocity(v) p._vel = v end
  function p:get_hp() return p._hp end
  function p:set_hp(v) p._hp = v end
  function p:get_properties() return { hp_max = 20 } end
  function p:set_physics_override(o) p._phys = o end
  function p:get_armor_groups() return table.copy(p._armor) end
  function p:set_armor_groups(g) p._armor = g end
  function p:hud_add(d) table.insert(p._huds, d.text) return #p._huds end
  function p:hud_change(id, campo, valor) p._huds[id] = valor end
  return p
end
local jogador = novo_jogador("teste")
local fogueira_perto = false
minetest = {
  get_current_modname = function() return "teste" end,
  get_modpath = function() return "." end,
  register_globalstep = function(f) table.insert(cb.step, f) end,
  register_on_joinplayer = function(f) table.insert(cb.join, f) end,
  register_on_leaveplayer = function(f) table.insert(cb.leave, f) end,
  register_on_dieplayer = function(f) table.insert(cb.die, f) end,
  register_on_respawnplayer = function(f) table.insert(cb.respawn, f) end,
  get_connected_players = function() return { jogador } end,
  get_player_by_name = function(n) if n == "teste" then return jogador end end,
  chat_send_player = function(_, msg) table.insert(chats, msg) end,
  after = function(t, f) table.insert(after_q, f) end,
  find_node_near = function(pos, r, nomes) if fogueira_perto then return {x=3,y=0,z=3} end end,
  pos_to_string = function(p) return p.x .. "," .. p.y .. "," .. p.z end,
  string_to_pos = function(s) local x, y, z = s:match("([^,]+),([^,]+),([^,]+)") return {x=tonumber(x), y=tonumber(y), z=tonumber(z)} end,
}
local real_dofile = dofile
dofile = function(p) return real_dofile(cfg_path) end
return { cb = cb, chats = chats, jogador = jogador, after_q = after_q, set_fogueira = function(v) fogueira_perto = v end }
"""
ctx = lua.execute(stub, config_path)
with open(init_path, encoding="utf-8") as f:
    lua.execute(f.read())

cb, p = ctx.cb, ctx.jogador
def passo(ctrl, n=1, dt=0.1):
    p._ctrl = lua.table_from(ctrl)
    for _ in range(n):
        for f in cb.step.values():
            f(dt)

for f in cb.join.values():
    f(p)
assert len(list(p._huds.values())) == 1, "HUD não criado"

passo({"aux1": True, "up": True}, 10)
assert p._phys.speed == 1.5, f"correndo deveria acelerar, veio {p._phys.speed}"
hud = p._huds[1]
assert "Estamina" in hud and "Frascos" in hud, hud

passo({}, 30)          # parado: recupera
passo({"sneak": True})
passo({"sneak": True, "jump": True})
assert p._vel.x > 0 and p._vel.y > 0, "esquiva não empurrou"
assert p._armor.immortal == 1, "esquiva não deu invulnerabilidade"
for f in ctx.after_q.values():
    f()
assert p._armor.immortal is None, "invulnerabilidade não acabou"

p._hp = 5
passo({"sneak": True})
passo({"sneak": True, "aux1": True})
cura = lua.execute(open(config_path, encoding="utf-8").read()).frasco.cura
assert p._hp == 5 + cura, f"frasco deveria curar {cura}, vida = {p._hp}"

ctx.set_fogueira(True)
passo({})
passo({"sneak": True})
assert p._hp == 20, "fogueira não curou"
assert p._meta["mistura_spawn"] == "3,1,3", p._meta["mistura_spawn"]

for f in cb.die.values():
    f(p)
for f in cb.respawn.values():
    assert f(p) is True
assert p._pos.x == 3 and p._pos.y == 1

print("Luanti OK:", hud, "|", list(ctx.chats.values())[-1])
