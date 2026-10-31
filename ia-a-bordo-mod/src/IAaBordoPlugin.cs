using BepInEx;
using BepInEx.Configuration;
using BepInEx.Logging;
using BepInEx.Unity.IL2CPP;
using HarmonyLib;
using MiraAPI;
using MiraAPI.PluginLoading;
using Reactor;

namespace IAaBordo;

// IA a Bordo: no MODO TREINO (freeplay, offline), os bonecos fantoche ganham um cérebro.
// Eles andam pela nave fazendo tarefas, um ou mais são infiltrados secretos que matam quando ninguém está vendo,
// quem acha corpo reporta, e nas reuniões eles conversam no chat e votam.
// O mod não faz nada em partidas online ou locais com outras pessoas.
// (Sem [BepInProcess]: no celular o processo do jogo não se chama "Among Us.exe".)
[BepInAutoPlugin("lucas.iaabordo", "IA a Bordo")]
[BepInDependency(ReactorPlugin.Id)]
[BepInDependency(MiraApiPlugin.Id)]
public partial class IAaBordoPlugin : BasePlugin, IMiraPlugin
{
    public static ManualLogSource Registro { get; private set; } = null!;

    public static ConfigEntry<bool> Ativo { get; private set; } = null!;
    public static ConfigEntry<int> Infiltrados { get; private set; } = null!;
    public static ConfigEntry<bool> PodemMatarVoce { get; private set; } = null!;
    public static ConfigEntry<bool> MostrarPensamentos { get; private set; } = null!;
    public static ConfigEntry<float> TempoParaMatar { get; private set; } = null!;
    public static ConfigEntry<string> UrlIA { get; private set; } = null!;
    public static ConfigEntry<string> ModeloIA { get; private set; } = null!;
    public static ConfigEntry<string> ChaveIA { get; private set; } = null!;

    public Harmony Harmony { get; } = new(Id);

    public string OptionsTitleText => "IA a Bordo";

    public ConfigFile GetConfigFile() => Config;

    public override void Load()
    {
        Registro = Log;
        Ativo = Config.Bind("Geral", "Ativo", true, "Liga as IAs nos bonecos do modo treino.");
        Infiltrados = Config.Bind("Geral", "Infiltrados", 1, "Quantos bonecos são infiltrados secretos (0 a 3).");
        PodemMatarVoce = Config.Bind("Geral", "PodemMatarVoce", true, "Os infiltrados também podem matar você.");
        MostrarPensamentos = Config.Bind("Geral", "MostrarPensamentos", true, "Mostra o que cada IA está pensando embaixo do nome (revela os segredos).");
        TempoParaMatar = Config.Bind("Geral", "TempoParaMatar", 35f, "Segundos entre um assassinato e outro do mesmo infiltrado.");
        UrlIA = Config.Bind("IA", "Url", "http://127.0.0.1:11434/v1/chat/completions",
            "Endereço de uma API no formato da OpenAI. Padrão: Ollama rodando no Termux. Deixe vazio para usar só as falas prontas.");
        ModeloIA = Config.Bind("IA", "Modelo", "qwen2.5:1.5b", "Nome do modelo.");
        ChaveIA = Config.Bind("IA", "Chave", "", "Chave da API (o Ollama não precisa).");

        Harmony.PatchAll();
        Log.LogInfo("IA a Bordo carregado. Entre no modo treino (Freeplay) para ver as IAs jogando.");
    }
}
