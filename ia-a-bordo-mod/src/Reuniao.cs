using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using UnityEngine;
using Random = UnityEngine.Random;

namespace IAaBordo;

// Reunião: cada boneco fala no chat do jogo (2 rodadas) e vota.
public static class Reuniao
{
    public static bool Ativa;
    private static int numero;
    private static int rodada;
    private static int pendentes;
    private static float proximaFala;
    private static float proximoVoto;
    private static float inicioVotacao = -1;
    private static string motivo = "";
    private static readonly List<string> Transcricao = new();
    private static readonly Queue<(byte id, string texto)> FilaFalas = new();
    private static readonly Dictionary<byte, byte> Votos = new();
    private static readonly HashSet<byte> JaVotou = new();

    // Tudo o que aparece no chat (bonecos e você) entra na conversa que as IAs leem.
    public static void Registrar(PlayerControl? quem, string texto)
    {
        if (!Ativa || quem == null) return;
        var limpo = texto.Split('\n')[0];
        Transcricao.Add($"{Cerebros.NomeDe(quem)}: {limpo}");
        if (Transcricao.Count > 40) Transcricao.RemoveAt(0);
    }

    public static void Atualizar()
    {
        var hud = MeetingHud.Instance;
        if (hud == null) return;
        if (!Ativa) Iniciar(hud);

        // falas, uma de cada vez
        if (FilaFalas.Count > 0 && Time.time >= proximaFala)
        {
            var (id, texto) = FilaFalas.Dequeue();
            var p = Cerebros.Jogador(id);
            if (Cerebros.Vivo(p))
            {
                try { DestroyableSingleton<HudManager>.Instance.Chat.AddChat(p, texto, false); }
                catch (Exception e) { IAaBordoPlugin.Registro.LogWarning("Não deu para mandar mensagem no chat: " + e.Message); }
            }
            proximaFala = Time.time + 2.5f + Mathf.Min(texto.Length, 160) * 0.03f;
        }

        if (rodada == 1 && pendentes == 0 && FilaFalas.Count == 0 && Time.time >= proximaFala)
        {
            rodada = 2;
            PedirFalas(2);
        }

        // votos (só na fase de votação)
        var votando = hud.state == MeetingHud.MeetingStates.NotVoted || hud.state == MeetingHud.MeetingStates.Voted;
        if (!votando) return;
        if (inicioVotacao < 0) inicioVotacao = Time.time;
        if (Time.time < proximoVoto) return;
        var rodadasProntas = rodada == 2 && pendentes == 0;
        foreach (var c in Cerebros.Todos.Values.OrderBy(_ => Random.value))
        {
            if (JaVotou.Contains(c.Id) || !Cerebros.Vivo(Cerebros.Jogador(c.Id))) continue;
            if (!Votos.ContainsKey(c.Id) && !rodadasProntas && Time.time - inicioVotacao < 25f) continue;
            var alvo = Votos.TryGetValue(c.Id, out var v) ? v : VotoPadrao(c);
            try { hud.CmdCastVote(c.Id, alvo); }
            catch (Exception e) { IAaBordoPlugin.Registro.LogWarning($"Voto de {c.Nome} falhou: {e.Message}"); }
            JaVotou.Add(c.Id);
            proximoVoto = Time.time + Random.Range(0.8f, 2.2f);
            break;
        }
    }

    private static void Iniciar(MeetingHud hud)
    {
        Ativa = true;
        numero++;
        rodada = 1;
        pendentes = 0;
        inicioVotacao = -1;
        proximaFala = Time.time + 2f;
        proximoVoto = 0;
        Transcricao.Clear();
        FilaFalas.Clear();
        Votos.Clear();
        JaVotou.Clear();
        var quem = Cerebros.Jogador(hud.reporterId);
        motivo = quem != null ? $"{Cerebros.NomeDe(quem)} chamou a reunião" : "reunião de emergência";
        foreach (var c in Cerebros.Todos.Values) { c.Lembrar($"reunião: {motivo}", true); c.Caminho = null; }
        PedirFalas(1);
    }

    public static void Encerrar()
    {
        Ativa = false;
        FilaFalas.Clear();
        foreach (var c in Cerebros.Todos.Values)
        {
            c.Caminho = null;
            c.ReportarCorpo = null;
            c.Testemunhou = null;
            c.KillCd = Mathf.Max(c.KillCd, 15f);
            c.Espera = Random.Range(0.5f, 2f);
        }
    }

    private static void PedirFalas(int r)
    {
        var num = numero;
        var vivos = Cerebros.Todos.Values.Where(c => Cerebros.Vivo(Cerebros.Jogador(c.Id))).OrderBy(_ => Random.value).ToList();
        foreach (var c in vivos)
        {
            pendentes++;
            if (IA.Disponivel)
            {
                IA.Perguntar(Prompt(c, r), json =>
                {
                    if (num != numero) return;
                    pendentes--;
                    Aplicar(c, r, IA.Texto(json, "fala"), IA.Texto(json, "pensamento"), IA.Texto(json, "voto"));
                });
            }
            else
            {
                pendentes--;
                Aplicar(c, r, "", "", "");
            }
        }
    }

    private static void Aplicar(Cerebro c, int r, string fala, string pensamento, string voto)
    {
        if (string.IsNullOrWhiteSpace(fala)) (fala, pensamento) = FalaPadrao(c, r);
        if (!string.IsNullOrWhiteSpace(pensamento)) c.Pensar(pensamento, 15f);
        fala = IA.Cortar(fala.Replace("\n", " ").Trim().Trim('"'), 140);
        if (IAaBordoPlugin.MostrarPensamentos.Value && !string.IsNullOrWhiteSpace(pensamento))
            fala += $"\n<size=70%><i><color=#7a7a7a>(pensando: {IA.Cortar(pensamento, 120)})</color></i></size>";
        if (fala.Length > 0) FilaFalas.Enqueue((c.Id, fala));
        if (r == 2) Votos[c.Id] = InterpretarVoto(voto, c) ?? VotoPadrao(c);
    }

    // ---------- texto para a IA ----------
    private static string Prompt(Cerebro c, int r)
    {
        var vivos = string.Join(", ", PlayerControl.AllPlayerControls.ToArray().Where(Cerebros.Vivo).Select(Cerebros.NomeDe));
        var mortos = string.Join(", ", PlayerControl.AllPlayerControls.ToArray().Where(p => p != null && !Cerebros.Vivo(p)).Select(Cerebros.NomeDe));
        var parceiros = string.Join(", ", Cerebros.Todos.Values.Where(x => x.Infiltrado && x.Id != c.Id).Select(x => x.Nome));
        var papel = c.Infiltrado
            ? $"INFILTRADO (impostor){(parceiros.Length > 0 ? $". Parceiro(s): {parceiros}" : "")}. Minta com naturalidade, invente álibis coerentes com as salas, jogue a suspeita em inocentes sem exagerar. Nunca admita."
            : "TRIPULANTE. Descubra quem são os impostores usando o que você viu de verdade. Impostores mentem. Sem prova, pular o voto é aceitável.";
        var sb = new StringBuilder();
        sb.AppendLine($"Você é {c.Nome}, jogando Among Us numa partida de treino com outras IAs (e talvez um humano).");
        sb.AppendLine($"Seu papel secreto: {papel}");
        sb.AppendLine($"Sua personalidade: {c.Personalidade}.");
        sb.AppendLine($"Agora: {motivo}. Vivos: {vivos}. Mortos: {(mortos.Length > 0 ? mortos : "ninguém")}.");
        sb.AppendLine("Sua memória (o que você viu de verdade):");
        foreach (var m in c.Memoria.TakeLast(18)) sb.AppendLine("- " + m);
        if (c.Infiltrado && c.Segredos.Count > 0)
        {
            sb.AppendLine("O que você fez de verdade (SEGREDO):");
            foreach (var s in c.Segredos.TakeLast(5)) sb.AppendLine("- " + s);
        }
        sb.AppendLine("Conversa até agora:");
        if (Transcricao.Count == 0) sb.AppendLine("(ninguém falou ainda)");
        foreach (var t in Transcricao.TakeLast(20)) sb.AppendLine(t);
        sb.AppendLine(r == 1
            ? "Responda só com JSON: {\"pensamento\":\"seu raciocínio secreto em 1 frase\",\"fala\":\"sua mensagem no chat, até 120 caracteres, português do Brasil, informal\"}"
            : "Última rodada antes de votar. Responda só com JSON: {\"pensamento\":\"seu raciocínio secreto em 1 frase\",\"fala\":\"mensagem curta no chat\",\"voto\":\"nome exato de um jogador vivo, ou pular\"}");
        return sb.ToString();
    }

    // ---------- falas e votos sem IA ----------
    private static (string fala, string pensamento) FalaPadrao(Cerebro c, int r)
    {
        var sala = string.IsNullOrEmpty(c.UltimaSala) ? "fazendo tarefa" : c.UltimaSala;
        if (c.Infiltrado)
        {
            var bode = Bode(c);
            return r == 1
                ? (Cerebros.Escolher($"Eu tava em {sala}, não vi nada.", bode != null ? $"Achei {Cerebros.NomeDe(bode)} meio estranho hoje." : "Não fui eu, gente."), bode != null ? $"Vou jogar a culpa em {Cerebros.NomeDe(bode)}." : "Fico quieto.")
                : (bode != null ? $"Voto no {Cerebros.NomeDe(bode)}." : "Vou pular.", "Que votem em outro.");
        }
        if (c.Testemunhou is { } t && Cerebros.Jogador(t) is { } assassino && Cerebros.Vivo(assassino))
            return r == 1 ? ($"EU VI! Foi {Cerebros.NomeDe(assassino)}!", $"Eu vi {Cerebros.NomeDe(assassino)} matar.") : ($"Votem no {Cerebros.NomeDe(assassino)}.", "Tenho certeza.");
        var suspeito = MaisSuspeito(c);
        return r == 1
            ? (suspeito != null ? $"Vi {Cerebros.NomeDe(suspeito)} perto do corpo." : $"Eu tava em {sala}.", suspeito != null ? $"Desconfio de {Cerebros.NomeDe(suspeito)}." : "Não tenho prova de nada.")
            : (suspeito != null ? $"Acho que é {Cerebros.NomeDe(suspeito)}." : "Sem prova, pulo.", "");
    }

    private static byte VotoPadrao(Cerebro c)
    {
        if (c.Infiltrado) return Bode(c) is { } b && Random.value < 0.7f ? b.PlayerId : PlayerVoteArea.SkippedVote;
        if (c.Testemunhou is { } t && Cerebros.Vivo(Cerebros.Jogador(t))) return t;
        return MaisSuspeito(c)?.PlayerId ?? PlayerVoteArea.SkippedVote;
    }

    private static PlayerControl? MaisSuspeito(Cerebro c)
    {
        var melhor = c.Suspeita.Where(kv => kv.Value >= 50 && kv.Key != c.Id && Cerebros.Vivo(Cerebros.Jogador(kv.Key)))
            .OrderByDescending(kv => kv.Value).Select(kv => (byte?)kv.Key).FirstOrDefault();
        return melhor is { } id ? Cerebros.Jogador(id) : null;
    }

    private static PlayerControl? Bode(Cerebro c) =>
        PlayerControl.AllPlayerControls.ToArray().Where(p => Cerebros.Vivo(p) && p.PlayerId != c.Id && !Cerebros.EhInfiltrado(p)).OrderBy(_ => Random.value).FirstOrDefault();

    private static byte? InterpretarVoto(string voto, Cerebro c)
    {
        var v = SemAcento(voto);
        if (v.Length == 0) return null;
        if (v.StartsWith("pul") || v == "skip" || v.Contains("ninguem")) return PlayerVoteArea.SkippedVote;
        foreach (var p in PlayerControl.AllPlayerControls)
            if (Cerebros.Vivo(p) && p.PlayerId != c.Id && SemAcento(Cerebros.NomeDe(p)) == v) return p.PlayerId;
        return null;
    }

    private static string SemAcento(string s)
    {
        var norm = s.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var ch in norm)
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark && char.IsLetterOrDigit(ch)) sb.Append(ch);
        return sb.ToString();
    }
}
