using System;
using HarmonyLib;

namespace IAaBordo;

[HarmonyPatch(typeof(HudManager), nameof(HudManager.Update))]
public static class HudManagerUpdatePatch
{
    public static void Postfix()
    {
        try { Cerebros.Atualizar(); }
        catch (Exception e) { IAaBordoPlugin.Registro.LogError("IA a Bordo: " + e); }
    }
}

// Nova nave carregada (entrou no modo treino de novo): começa do zero.
[HarmonyPatch(typeof(ShipStatus), nameof(ShipStatus.Start))]
public static class ShipStatusStartPatch
{
    public static void Postfix() => Cerebros.Reiniciar();
}

// Os bonecos do treino votam sozinhos e aleatoriamente. Com a IA ligada, quem vota é a IA.
[HarmonyPatch(typeof(DummyBehaviour), nameof(DummyBehaviour.Update))]
public static class DummyBehaviourUpdatePatch
{
    public static bool Prefix(DummyBehaviour __instance)
    {
        if (!IAaBordoPlugin.Ativo.Value || !Cerebros.NoTreino) return true;
        var p = __instance.myPlayer;
        return p == null || !Cerebros.Todos.ContainsKey(p.PlayerId);
    }
}

// Guarda tudo que aparece no chat durante a reunião (inclusive o que você digitar).
[HarmonyPatch(typeof(ChatController), nameof(ChatController.AddChat))]
public static class ChatAddChatPatch
{
    public static void Postfix(PlayerControl sourcePlayer, string chatText)
    {
        try { Reuniao.Registrar(sourcePlayer, chatText); }
        catch { /* não atrapalha o chat */ }
    }
}
