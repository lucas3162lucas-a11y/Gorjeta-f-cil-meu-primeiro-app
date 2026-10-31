-- Melty Droid: adaptador Luanti (ex-Minetest), API Lua oficial de mods.
-- Os números vêm de config.lua, gerado pelo `mistura novo` a partir de uma receita.
--
-- Controles (no Android, "Especial" é o botão aux1):
--   Especial + andar pra frente ... corre (gasta estamina); sem estamina você fica lento
--   bater/cavar ................... gasta estamina
--   agachar + pular ............... esquiva para onde você olha (invulnerável por um instante)
--   agachar + Especial ............ bebe uma carga do frasco de cura
--   agachar perto de um bloco de fogueira: descansa (recarrega, cura, vira ponto de renascimento)

local modname = minetest.get_current_modname()
local C = dofile(minetest.get_modpath(modname) .. "/config.lua")
local E = C.estamina

local VEL_ESQUIVA = 6   -- m/s por ponto de "forca" da receita
local ALT_ESQUIVA = 12  -- m/s por ponto de "altura" da receita

local estados = {}

local function estado(player)
  local nome = player:get_player_name()
  local s = estados[nome]
  if not s then
    local meta = player:get_meta()
    local cargas = C.frasco.cargas
    if meta:get_string("mistura_cargas") ~= "" then
      cargas = meta:get_int("mistura_cargas")
    end
    s = { estamina = E.max, parado = 0, cargas = cargas, ctrl = {}, cansado = false, naFogueira = false }
    estados[nome] = s
  end
  return s
end

local function salvar_cargas(player, s)
  player:get_meta():set_int("mistura_cargas", s.cargas)
end

local function gastar(s, quanto)
  s.estamina = math.max(0, s.estamina - quanto)
  s.parado = 0
end

local function barra(valor, max)
  local cheio = math.floor(valor / max * 10 + 0.5)
  return string.rep("|", cheio) .. string.rep(".", 10 - cheio)
end

local function texto_hud(s)
  return "Estamina " .. barra(s.estamina, E.max) .. "   Frascos " .. s.cargas .. "/" .. C.frasco.cargas
end

local function esquivar(player, s)
  if s.estamina < C.esquiva.custo then return end
  gastar(s, C.esquiva.custo)
  local olhar = player:get_look_dir()
  local tam = math.sqrt(olhar.x * olhar.x + olhar.z * olhar.z)
  if tam == 0 then tam = 1 end
  player:add_velocity({
    x = olhar.x / tam * C.esquiva.forca * VEL_ESQUIVA,
    y = C.esquiva.altura * ALT_ESQUIVA,
    z = olhar.z / tam * C.esquiva.forca * VEL_ESQUIVA,
  })
  local antes = player:get_armor_groups()
  local imortal = table.copy(antes)
  imortal.immortal = 1
  player:set_armor_groups(imortal)
  local nome = player:get_player_name()
  minetest.after(C.esquiva.invulneravelSegundos, function()
    local p = minetest.get_player_by_name(nome)
    if p then p:set_armor_groups(antes) end
  end)
end

local function beber(player, s)
  if s.cargas <= 0 then
    minetest.chat_send_player(player:get_player_name(), "O frasco está vazio. Descanse numa fogueira.")
    return
  end
  s.cargas = s.cargas - 1
  salvar_cargas(player, s)
  local max = player:get_properties().hp_max or 20
  player:set_hp(math.min(max, player:get_hp() + C.frasco.cura))
end

local function descansar(player, s, pos)
  s.cargas = C.frasco.cargas
  salvar_cargas(player, s)
  s.estamina = E.max
  player:set_hp(player:get_properties().hp_max or 20)
  player:get_meta():set_string("mistura_spawn", minetest.pos_to_string({ x = pos.x, y = pos.y + 1, z = pos.z }))
  minetest.chat_send_player(player:get_player_name(),
    "Você descansou na fogueira. Frascos recarregados e renascimento marcado aqui.")
end

minetest.register_on_joinplayer(function(player)
  local s = estado(player)
  s.hud = player:hud_add({
    type = "text",
    hud_elem_type = "text", -- nome antigo do campo (Luanti < 5.9)
    position = { x = 0.5, y = 0.88 },
    text = texto_hud(s),
    number = 0xFFD27F,
    alignment = { x = 0, y = 0 },
  })
end)

minetest.register_on_leaveplayer(function(player)
  estados[player:get_player_name()] = nil
end)

minetest.register_globalstep(function(dtime)
  for _, player in ipairs(minetest.get_connected_players()) do
    local s = estado(player)
    local c = player:get_player_control()
    local antes = s.ctrl
    local bater = c.dig or c.LMB

    local correndo = c.aux1 and c.up and not c.sneak
    if correndo and s.estamina > 0 then
      gastar(s, E.corridaPorSegundo * dtime)
    else
      s.parado = s.parado + dtime
      if s.parado >= E.atrasoRegenSegundos then
        s.estamina = math.min(E.max, s.estamina + E.regenPorSegundo * dtime)
      end
    end

    if bater and not (antes.dig or antes.LMB) then gastar(s, E.ataque) end
    if c.sneak and c.jump and not antes.jump then esquivar(player, s) end
    if c.sneak and c.aux1 and not antes.aux1 then beber(player, s) end

    local cansado = s.estamina <= 0
    local velocidade = 1
    if cansado then velocidade = 0.6 elseif correndo then velocidade = 1.5 end
    player:set_physics_override({ speed = velocidade })

    local fogueira = nil
    if c.sneak then
      fogueira = minetest.find_node_near(player:get_pos(), C.fogueira.raio, C.fogueira.blocos, true)
    end
    if fogueira and not s.naFogueira then descansar(player, s, fogueira) end
    s.naFogueira = fogueira ~= nil

    if s.hud then player:hud_change(s.hud, "text", texto_hud(s)) end
    s.ctrl = { dig = c.dig, LMB = c.LMB, jump = c.jump, aux1 = c.aux1 }
  end
end)

minetest.register_on_dieplayer(function(player)
  minetest.chat_send_player(player:get_player_name(), C.morte.titulo .. " - " .. C.morte.subtitulo)
end)

minetest.register_on_respawnplayer(function(player)
  local s = estado(player)
  s.estamina = E.max
  local salvo = player:get_meta():get_string("mistura_spawn")
  if salvo ~= "" then
    local pos = minetest.string_to_pos(salvo)
    if pos then
      player:set_pos(pos)
      return true
    end
  end
  return false
end)
