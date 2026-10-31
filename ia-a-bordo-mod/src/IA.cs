using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace IAaBordo;

// Conversa com uma API no formato da OpenAI (Ollama no Termux, NVIDIA, OpenRouter...).
// As chamadas rodam fora da thread do jogo; as respostas voltam pela fila e são aplicadas no Update.
public static class IA
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(120) };
    private static readonly ConcurrentQueue<Action> FilaPrincipal = new();
    private static int falhasSeguidas;
    public static string Status { get; private set; } = "IA: ainda não usada";
    private static DateTime pausaAte = DateTime.MinValue;

    public static bool Disponivel =>
        !string.IsNullOrWhiteSpace(IAaBordoPlugin.UrlIA.Value) && DateTime.UtcNow > pausaAte;

    // Pergunta e chama aoTerminar na thread do jogo com o JSON da resposta (ou null se falhar).
    public static void Perguntar(string prompt, Action<JsonElement?> aoTerminar)
    {
        var url = IAaBordoPlugin.UrlIA.Value;
        var modelo = IAaBordoPlugin.ModeloIA.Value;
        var chave = IAaBordoPlugin.ChaveIA.Value;
        Task.Run(async () =>
        {
            JsonElement? resultado = null;
            try
            {
                var corpo = JsonSerializer.Serialize(new
                {
                    model = modelo,
                    messages = new[] { new { role = "user", content = prompt } },
                    temperature = 0.8,
                    max_tokens = 400,
                });
                using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = new StringContent(corpo, Encoding.UTF8, "application/json") };
                if (!string.IsNullOrWhiteSpace(chave)) req.Headers.TryAddWithoutValidation("Authorization", "Bearer " + chave);
                using var resp = await Http.SendAsync(req).ConfigureAwait(false);
                var texto = await resp.Content.ReadAsStringAsync().ConfigureAwait(false);
                if (!resp.IsSuccessStatusCode) throw new Exception($"HTTP {(int)resp.StatusCode}: {Cortar(texto, 160)}");
                using var doc = JsonDocument.Parse(texto);
                var conteudo = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
                resultado = ExtrairJson(conteudo);
                falhasSeguidas = 0;
                Status = "IA: conectada";
            }
            catch (Exception e)
            {
                Status = "IA: sem conexão (falas prontas)";
                if (++falhasSeguidas >= 3)
                {
                    pausaAte = DateTime.UtcNow.AddSeconds(60);
                    falhasSeguidas = 0;
                    FilaPrincipal.Enqueue(() => IAaBordoPlugin.Registro.LogWarning($"A IA falhou 3 vezes ({e.Message}). Usando falas prontas por 1 minuto."));
                }
            }
            var r = resultado;
            FilaPrincipal.Enqueue(() => aoTerminar(r));
        });
    }

    public static void ProcessarFila()
    {
        var n = 0;
        while (n++ < 20 && FilaPrincipal.TryDequeue(out var acao))
        {
            try { acao(); }
            catch (Exception e) { IAaBordoPlugin.Registro.LogError("Erro ao aplicar resposta da IA: " + e); }
        }
    }

    private static JsonElement? ExtrairJson(string texto)
    {
        texto = Regex.Replace(texto, "<think>[\\s\\S]*?</think>", "", RegexOptions.IgnoreCase);
        var ini = texto.IndexOf('{');
        var fim = texto.LastIndexOf('}');
        if (ini < 0 || fim <= ini) return null;
        try
        {
            using var doc = JsonDocument.Parse(texto.Substring(ini, fim - ini + 1));
            return doc.RootElement.Clone();
        }
        catch
        {
            return null;
        }
    }

    public static string Texto(JsonElement? json, string campo)
    {
        if (json is not { ValueKind: JsonValueKind.Object } j) return "";
        return j.TryGetProperty(campo, out var v) && v.ValueKind == JsonValueKind.String ? (v.GetString() ?? "").Trim() : "";
    }

    public static string Cortar(string s, int max) => s.Length <= max ? s : s.Substring(0, max);
}
