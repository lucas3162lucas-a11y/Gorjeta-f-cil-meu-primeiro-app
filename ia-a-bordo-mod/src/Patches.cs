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

// Mostra no canto da tela que o mod está ligado (junto do ping).
[HarmonyPatch(typeof(PingTracker), nameof(PingTracker.Update))]
public static class PingTrackerUpdatePatch
{
    public static void Postfix(PingTracker __instance)
    {
        try
        {
            if (__instance.text == null) return;
            var extra = !IAaBordoPlugin.Ativo.Value ? "IA a Bordo: desligado"
                : !Cerebros.NoTreino ? "IA a Bordo: entre no modo Treino"
                : Cerebros.Todos.Count == 0 ? "IA a Bordo: esperando os bonecos..."
                : $"IA a Bordo: {Cerebros.Todos.Count} bonecos · {IA.Status}";
            __instance.text.text += $"\n<size=70%><color=#3ee6c4>{extra}</color></size>";
        }
        catch { /* não atrapalha o ping */ }
    }
}

// No menu principal, mostra a versão do mod embaixo da versão do jogo.
[HarmonyPatch(typeof(VersionShower), nameof(VersionShower.Start))]
public static class VersionShowerStartPatch
{
    public static void Postfix(VersionShower __instance)
    {
        try { if (__instance.text != null) __instance.text.text += "\n<color=#3ee6c4>IA a Bordo 0.1.1</color>"; }
        catch { /* ignora */ }
    }
}
