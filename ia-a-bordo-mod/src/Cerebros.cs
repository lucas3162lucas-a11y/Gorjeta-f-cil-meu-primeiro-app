using System;
using System.Collections.Generic;
using System.Linq;
using InnerNet;
using UnityEngine;
using Object = UnityEngine.Object;
using Random = UnityEngine.Random;

namespace IAaBordo;

public class Cerebro
{
    public byte Id;
    public string Nome = "";
    public bool Infiltrado;
    public string Personalidade = "";
    public readonly List<string> Memoria = new();
    public readonly List<string> Segredos = new();
    public readonly Dictionary<byte, string> UltimaSalaVista = new();
    public readonly HashSet<byte> CorposVistos = new();
    public readonly Dictionary<byte, int> Suspeita = new();

    public List<Vector2>? Caminho;
    public float Espera;
    public float KillCd;
    public byte? Alvo;
    public byte? ReportarCorpo;
    public byte? Testemunhou;
    public string UltimaSala = "";
    public string Pensamento = "";
    public float PensamentoAte;
    public bool ModoSnap;
    public Vector2 PosicaoAnterior;
    public float TempoSemSair;
    public float ProximaObservacao;
    public float RepathEm;

    public void Lembrar(string txt, bool forte = false)
    {
        var linha = $"[{Mathf.RoundToInt(Cerebros.Tempo)}s] {txt}";
        if (Memoria.Count > 0 && Memoria[^1].EndsWith(txt)) return;
        Memoria.Add(forte ? linha + " (!)" : linha);
        if (Memoria.Count > 40) Memoria.RemoveAt(0);
    }

    public void Pensar(string txt, float duracao = 6f)
    {
        Pensamento = txt;
        PensamentoAte = Time.time + duracao;
    }
}

public static class Cerebros
{
    public static readonly Dictionary<byte, Cerebro> Todos = new();
    public static float Tempo;
    private static readonly string[] Nomes = { "Ana", "Bruno", "Carla", "Davi", "Elisa", "Fábio", "Gabi", "Heitor", "Iara", "Júlio", "Kátia", "Léo", "Mila", "Nico" };
    private static readonly string[] Personalidades =
    {
        "desconfiada e direta", "brincalhão", "calado, fala pouco", "líder, organiza a votação", "nervoso, se defende demais",
        "analítica, cita lugares e horários", "dramática", "teimoso", "gentil, defende quem parece inocente", "sarcástica",
    };

    private const float Visao = 5f;
    private const float DistanciaMatar = 1.0f;
    private const float DistanciaReportar = 1.6f;

    public static bool NoTreino =>
        AmongUsClient.Instance != null && AmongUsClient.Instance.NetworkMode == NetworkModes.FreePlay;

    public static void Reiniciar()
    {
        Todos.Clear();
        Tempo = 0;
        Navegacao.Esquecer();
    }

    public static PlayerControl? Jogador(byte id)
    {
        foreach (var p in PlayerControl.AllPlayerControls)
            if (p != null && p.PlayerId == id) return p;
        return null;
    }

    public static string NomeDe(PlayerControl p) =>
        Todos.TryGetValue(p.PlayerId, out var c) ? c.Nome : p.Data != null ? p.Data.PlayerName : "alguém";

    public static bool Vivo(PlayerControl? p) => p != null && p.Data != null && !p.Data.IsDead && !p.Data.Disconnected;

    public static bool EhInfiltrado(PlayerControl p) => Todos.TryGetValue(p.PlayerId, out var c) && c.Infiltrado;

    public static string Sala(Vector2 pos)
    {
        var nave = ShipStatus.Instance;
        if (nave == null) return "um corredor";
        foreach (var sala in nave.AllRooms)
        {
            if (sala == null || sala.roomArea == null || !sala.roomArea.OverlapPoint(pos)) continue;
            try { return DestroyableSingleton<TranslationController>.Instance.GetString(sala.RoomId); }
            catch { return sala.RoomId.ToString(); }
        }
        return "um corredor";
    }

    public static bool Ve(PlayerControl obs, Vector2 alvo)
    {
        var a = obs.GetTruePosition();
        if (Vector2.Distance(a, alvo) > Visao) return false;
        return Physics2D.Linecast(a, alvo, Constants.ShipOnlyMask).collider == null;
    }

    public static bool Ve(PlayerControl obs, PlayerControl alvo) =>
        alvo != null && !alvo.inVent && Ve(obs, alvo.GetTruePosition());

    // Chamado todo quadro (patch no HudManager.Update).
    public static void Atualizar()
    {
        IA.ProcessarFila();
        if (!IAaBordoPlugin.Ativo.Value) return;
        if (!NoTreino || ShipStatus.Instance == null || PlayerControl.LocalPlayer == null)
        {
            if (Todos.Count > 0) Reiniciar();
            return;
        }

        if (MeetingHud.Instance != null) { Reuniao.Atualizar(); MostrarPensamentos(); return; }
        if (Reuniao.Ativa) Reuniao.Encerrar();
        if (ExileController.Instance != null) return;

        var dt = Time.deltaTime;
        Tempo += dt;
        Navegacao.Preparar();
        PrepararCerebros();

        foreach (var c in Todos.Values.ToList())
        {
            var p = Jogador(c.Id);
            if (!Vivo(p)) continue;
            try
            {
                if (Time.time >= c.ProximaObservacao) { c.ProximaObservacao = Time.time + 0.3f; Observar(c, p!); }
                if (c.Infiltrado) AgirInfiltrado(c, p!, dt);
                else AgirTripulante(c, p!, dt);
            }
            catch (Exception e)
            {
                IAaBordoPlugin.Registro.LogError($"Erro na IA de {c.Nome}: {e.Message}");
                c.Espera = 2f;
            }
        }
        MostrarPensamentos();
    }

    private static void PrepararCerebros()
    {
        var bonecos = PlayerControl.AllPlayerControls.ToArray().Where(p => p != null && p.isDummy && p.Data != null).ToList();
        if (bonecos.Count == 0 || bonecos.All(b => Todos.ContainsKey(b.PlayerId))) return;

        var nomes = Nomes.OrderBy(_ => Random.value).ToList();
        var pers = Personalidades.OrderBy(_ => Random.value).ToList();
        var i = 0;
        foreach (var b in bonecos.Where(b => !Todos.ContainsKey(b.PlayerId)))
        {
            var c = new Cerebro
            {
                Id = b.PlayerId,
                Nome = nomes[i % nomes.Count],
                Personalidade = pers[i % pers.Count],
                KillCd = IAaBordoPlugin.TempoParaMatar.Value * 0.7f,
                PosicaoAnterior = b.GetTruePosition(),
            };
            i++;
            Todos[b.PlayerId] = c;
            try { b.SetName(c.Nome); } catch { /* nome fica o original */ }
        }

        var quantos = Math.Clamp(IAaBordoPlugin.Infiltrados.Value, 0, Math.Max(0, (Todos.Count - 1) / 2));
        if (Todos.Values.Count(c => c.Infiltrado) < quantos)
        {
            foreach (var c in Todos.Values.Where(c => !c.Infiltrado).OrderBy(_ => Random.value).Take(quantos - Todos.Values.Count(x => x.Infiltrado)))
            {
                c.Infiltrado = true;
                c.Pensar("Sou infiltrado. Ninguém pode saber.", 8f);
            }
        }
        IAaBordoPlugin.Registro.LogInfo($"IA a Bordo: {Todos.Count} bonecos com IA, {Todos.Values.Count(c => c.Infiltrado)} infiltrado(s).");
    }

    // ---------- o que cada um vê ----------
    private static void Observar(Cerebro c, PlayerControl eu)
    {
        var minhaSala = Sala(eu.GetTruePosition());
        if (minhaSala != c.UltimaSala) { c.UltimaSala = minhaSala; c.Lembrar($"fui para {minhaSala}"); }

        foreach (var o in PlayerControl.AllPlayerControls)
        {
            if (o == null || o == eu || !Vivo(o) || !Ve(eu, o)) continue;
            var sala = Sala(o.GetTruePosition());
            if (!c.UltimaSalaVista.TryGetValue(o.PlayerId, out var antes) || antes != sala)
            {
                c.UltimaSalaVista[o.PlayerId] = sala;
                c.Lembrar($"vi {NomeDe(o)} em {sala}");
            }
        }

        foreach (var corpo in Object.FindObjectsOfType<DeadBody>())
        {
            if (corpo == null || c.CorposVistos.Contains(corpo.ParentId) || !Ve(eu, corpo.TruePosition)) continue;
            c.CorposVistos.Add(corpo.ParentId);
            var morto = Jogador(corpo.ParentId);
            var nomeMorto = morto != null ? NomeDe(morto) : "alguém";
            var sala = Sala(corpo.TruePosition);
            c.Lembrar($"achei o corpo de {nomeMorto} em {sala}", true);
            foreach (var o in PlayerControl.AllPlayerControls)
                if (o != null && o != eu && Vivo(o) && Vector2.Distance(o.GetTruePosition(), corpo.TruePosition) < 3f && Ve(eu, o))
                    Suspeitar(c, o.PlayerId, 30);
            if (!c.Infiltrado || Random.value < 0.3f)
            {
                c.ReportarCorpo = corpo.ParentId;
                c.Caminho = null;
                c.Pensar(c.Infiltrado ? "Vou reportar esse corpo pra parecer inocente." : $"Um corpo! É {nomeMorto}. Vou reportar.");
            }
        }
    }

    private static void Suspeitar(Cerebro c, byte id, int quanto)
    {
        c.Suspeita.TryGetValue(id, out var v);
        c.Suspeita[id] = v + quanto;
    }

    // ---------- tripulante ----------
    private static void AgirTripulante(Cerebro c, PlayerControl eu, float dt)
    {
        if (c.ReportarCorpo is { } idCorpo)
        {
            var corpo = Object.FindObjectsOfType<DeadBody>().FirstOrDefault(d => d != null && d.ParentId == idCorpo);
            if (corpo == null) { c.ReportarCorpo = null; return; }
            if (Vector2.Distance(eu.GetTruePosition(), corpo.TruePosition) < DistanciaReportar)
            {
                Parar(eu);
                c.ReportarCorpo = null;
                var morto = Jogador(idCorpo);
                if (morto?.Data != null) eu.CmdReportDeadBody(morto.Data);
                return;
            }
            IrPara(c, eu, corpo.TruePosition, dt);
            return;
        }
        FazerTarefas(c, eu, dt, fingindo: false);
    }

    // ---------- infiltrado ----------
    private static void AgirInfiltrado(Cerebro c, PlayerControl eu, float dt)
    {
        c.KillCd -= dt;
        if (c.ReportarCorpo != null) { AgirTripulante(c, eu, dt); return; }

        if (c.KillCd <= 0)
        {
            var pos = eu.GetTruePosition();
            var alvo = PlayerControl.AllPlayerControls.ToArray()
                .Where(o => o != null && o != eu && Vivo(o) && !EhInfiltrado(o) && !o.inVent)
                .Where(o => IAaBordoPlugin.PodemMatarVoce.Value || o != PlayerControl.LocalPlayer)
                .Where(o => Ve(eu, o) && Vector2.Distance(pos, o.GetTruePosition()) < 6f)
                .OrderBy(o => Vector2.Distance(pos, o.GetTruePosition()))
                .FirstOrDefault(o => Sozinhos(eu, o));
            if (alvo != null)
            {
                if (c.Alvo != alvo.PlayerId) c.Pensar($"{NomeDe(alvo)} está sozinho... é minha chance.");
                c.Alvo = alvo.PlayerId;
                if (Vector2.Distance(pos, alvo.GetTruePosition()) < DistanciaMatar)
                {
                    Matar(c, eu, alvo);
                    return;
                }
                if (Time.time >= c.RepathEm) { c.RepathEm = Time.time + 0.5f; c.Caminho = null; }
                IrPara(c, eu, alvo.GetTruePosition(), dt);
                return;
            }
            c.Alvo = null;
        }
        FazerTarefas(c, eu, dt, fingindo: true);
    }

    // Ninguém (fora o próprio alvo e outros infiltrados) está vendo nem o assassino nem a vítima.
    private static bool Sozinhos(PlayerControl assassino, PlayerControl vitima)
    {
        foreach (var o in PlayerControl.AllPlayerControls)
        {
            if (o == null || o == assassino || o == vitima || !Vivo(o) || EhInfiltrado(o)) continue;
            if (Ve(o, assassino) || Ve(o, vitima)) return false;
        }
        return true;
    }

    private static void Matar(Cerebro c, PlayerControl eu, PlayerControl alvo)
    {
        var sala = Sala(alvo.GetTruePosition());
        var testemunhas = Todos.Values.Where(t => t.Id != c.Id && t.Id != alvo.PlayerId).Select(t => (t, p: Jogador(t.Id)))
            .Where(x => Vivo(x.p) && Ve(x.p!, eu)).ToList();
        Parar(eu);
        eu.MurderPlayer(alvo, MurderResultFlags.Succeeded);
        c.KillCd = IAaBordoPlugin.TempoParaMatar.Value;
        c.Alvo = null;
        c.Caminho = null;
        c.Segredos.Add($"[{Mathf.RoundToInt(Tempo)}s] matei {NomeDe(alvo)} em {sala}");
        c.Pensar("Feito. Agora saio andando como se nada tivesse acontecido.");
        c.Espera = 0.5f;
        foreach (var (t, _) in testemunhas)
        {
            t.Lembrar($"VI {c.Nome} MATAR {NomeDe(alvo)} em {sala}!", true);
            t.Testemunhou = c.Id;
            Suspeitar(t, c.Id, 100);
            if (!t.Infiltrado) { t.ReportarCorpo = alvo.PlayerId; t.Caminho = null; t.Pensar($"{c.Nome} matou {NomeDe(alvo)}! Vou reportar agora."); }
        }
        IAaBordoPlugin.Registro.LogInfo($"{c.Nome} (infiltrado) eliminou {NomeDe(alvo)} em {sala}.");
    }

    // ---------- tarefas (de verdade ou fingindo) ----------
    private static void FazerTarefas(Cerebro c, PlayerControl eu, float dt, bool fingindo)
    {
        if (c.Espera > 0) { c.Espera -= dt; Parar(eu); return; }
        if (c.Caminho == null || c.Caminho.Count == 0)
        {
            var consoles = ShipStatus.Instance.AllConsoles;
            if (consoles == null || consoles.Count == 0) return;
            var alvo = consoles[Random.Range(0, consoles.Count)];
            if (alvo == null) return;
            var destino = (Vector2)alvo.transform.position;
            c.Caminho = Navegacao.Caminho(eu.GetTruePosition(), destino);
            if (c.Caminho == null) { c.Espera = 1f; return; }
            var sala = Sala(destino);
            if (Random.value < 0.6f)
                c.Pensar(fingindo
                    ? Escolher($"Vou fingir uma tarefa em {sala}.", "Preciso parecer ocupado.", $"Quem será que está sozinho em {sala}?")
                    : Escolher($"Vou fazer uma tarefa em {sala}.", $"Próxima parada: {sala}.", "Tarefa, tarefa, tarefa..."));
        }
        if (Andar(c, eu, dt))
        {
            c.Espera = Random.Range(3f, 7f);
            c.Lembrar(fingindo ? $"fingi uma tarefa em {Sala(eu.GetTruePosition())}" : $"fiz uma tarefa em {Sala(eu.GetTruePosition())}");
        }
    }

    // ---------- movimento ----------
    private static void IrPara(Cerebro c, PlayerControl eu, Vector2 destino, float dt)
    {
        if (c.Caminho == null || c.Caminho.Count == 0)
        {
            c.Caminho = Navegacao.Caminho(eu.GetTruePosition(), destino);
            if (c.Caminho == null) { Parar(eu); return; }
        }
        Andar(c, eu, dt);
    }

    // Retorna true quando chegou ao fim do caminho.
    private static bool Andar(Cerebro c, PlayerControl eu, float dt)
    {
        if (c.Caminho == null || c.Caminho.Count == 0) { Parar(eu); return true; }
        var pos = eu.GetTruePosition();
        var alvo = c.Caminho[0];
        var dir = alvo - pos;
        if (dir.magnitude < 0.2f)
        {
            c.Caminho.RemoveAt(0);
            if (c.Caminho.Count == 0) { Parar(eu); return true; }
            return false;
        }
        var n = dir.normalized;
        if (c.ModoSnap)
        {
            var passo = Mathf.Min(dir.magnitude, eu.MyPhysics.TrueSpeed * dt);
            eu.NetTransform.SnapTo((Vector2)eu.transform.position + n * passo);
        }
        else
        {
            eu.MyPhysics.SetNormalizedVelocity(n);
        }

        // Se a física do jogo não deixar o boneco andar, troca para movimento direto.
        if (Vector2.Distance(pos, c.PosicaoAnterior) < 0.02f) c.TempoSemSair += dt;
        else c.TempoSemSair = 0;
        c.PosicaoAnterior = pos;
        if (c.TempoSemSair > 1.2f)
        {
            c.TempoSemSair = 0;
            if (!c.ModoSnap)
            {
                c.ModoSnap = true;
                IAaBordoPlugin.Registro.LogInfo($"{c.Nome}: física parada, usando movimento direto.");
            }
            else c.Caminho = null; // preso de verdade: recalcula
        }
        return false;
    }

    private static void Parar(PlayerControl eu)
    {
        try { eu.MyPhysics.SetNormalizedVelocity(Vector2.zero); } catch { /* ignora */ }
    }

    // ---------- pensamentos embaixo do nome ----------
    private static void MostrarPensamentos()
    {
        foreach (var c in Todos.Values)
        {
            var p = Jogador(c.Id);
            if (p == null || p.cosmetics == null || p.cosmetics.nameText == null) continue;
            var mostrar = IAaBordoPlugin.MostrarPensamentos.Value && Time.time < c.PensamentoAte && Vivo(p) && MeetingHud.Instance == null;
            var cor = c.Infiltrado && IAaBordoPlugin.MostrarPensamentos.Value ? "#ff8a96" : "#ffffff";
            var texto = mostrar ? $"<color={cor}>{c.Nome}</color>\n<size=55%><i>{c.Pensamento}</i></size>" : c.Nome;
            if (p.cosmetics.nameText.text != texto) p.cosmetics.nameText.text = texto;
        }
    }

    public static string Escolher(params string[] opcoes) => opcoes[Random.Range(0, opcoes.Length)];
}
