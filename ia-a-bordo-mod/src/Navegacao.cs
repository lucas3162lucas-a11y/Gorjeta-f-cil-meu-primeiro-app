using System;
using System.Collections.Generic;
using UnityEngine;

namespace IAaBordo;

// O Among Us não tem "mapa de caminhos" para os bonecos. Então, quando a nave carrega,
// a gente testa a física numa grade de pontos (parede ou chão livre) e usa busca em largura.
public static class Navegacao
{
    private const float Passo = 0.25f;
    private const float RaioBoneco = 0.2f;

    private static bool[,]? livre;
    private static Vector2 origem;
    private static int largura, altura;
    private static int mapaPreparado = -1;

    public static bool Pronta => livre != null;

    public static void Preparar()
    {
        var nave = ShipStatus.Instance;
        if (nave == null) return;
        var idNave = nave.GetInstanceID();
        if (idNave == mapaPreparado && livre != null) return;
        mapaPreparado = idNave;

        var limites = new Bounds(Vector3.zero, Vector3.zero);
        var primeiro = true;
        foreach (var sala in nave.AllRooms)
        {
            if (sala == null || sala.roomArea == null) continue;
            var b = sala.roomArea.bounds;
            if (primeiro) { limites = b; primeiro = false; }
            else limites.Encapsulate(b);
        }
        if (primeiro) limites = new Bounds(Vector3.zero, new Vector3(70f, 45f, 0f));
        limites.Expand(3f);

        origem = limites.min;
        largura = Math.Clamp(Mathf.CeilToInt(limites.size.x / Passo), 10, 600);
        altura = Math.Clamp(Mathf.CeilToInt(limites.size.y / Passo), 10, 600);
        livre = new bool[largura, altura];
        var mascara = Constants.ShipAndObjectsMask;
        var livres = 0;
        for (var x = 0; x < largura; x++)
        for (var y = 0; y < altura; y++)
        {
            var ok = Physics2D.OverlapCircle(Celula(x, y), RaioBoneco, mascara) == null;
            livre[x, y] = ok;
            if (ok) livres++;
        }
        IAaBordoPlugin.Registro.LogInfo($"Navegação pronta: grade {largura}x{altura}, {livres} pontos livres.");
    }

    public static void Esquecer()
    {
        livre = null;
        mapaPreparado = -1;
    }

    private static Vector2 Celula(int x, int y) => origem + new Vector2((x + 0.5f) * Passo, (y + 0.5f) * Passo);

    private static (int x, int y) Indice(Vector2 p) =>
        (Math.Clamp(Mathf.FloorToInt((p.x - origem.x) / Passo), 0, largura - 1),
         Math.Clamp(Mathf.FloorToInt((p.y - origem.y) / Passo), 0, altura - 1));

    private static bool Livre(int x, int y) => livre != null && x >= 0 && y >= 0 && x < largura && y < altura && livre[x, y];

    private static (int x, int y)? LivreMaisProximo(Vector2 p, int raio = 6)
    {
        var (cx, cy) = Indice(p);
        if (Livre(cx, cy)) return (cx, cy);
        for (var r = 1; r <= raio; r++)
        for (var dx = -r; dx <= r; dx++)
        for (var dy = -r; dy <= r; dy++)
        {
            if (Math.Abs(dx) != r && Math.Abs(dy) != r) continue;
            if (Livre(cx + dx, cy + dy)) return (cx + dx, cy + dy);
        }
        return null;
    }

    public static List<Vector2>? Caminho(Vector2 de, Vector2 para)
    {
        if (livre == null) return null;
        var ini = LivreMaisProximo(de);
        var fim = LivreMaisProximo(para);
        if (ini == null || fim == null) return null;

        var veio = new int[largura * altura];
        Array.Fill(veio, -1);
        var fila = new Queue<int>();
        var s = ini.Value.x + ini.Value.y * largura;
        var alvo = fim.Value.x + fim.Value.y * largura;
        veio[s] = s;
        fila.Enqueue(s);
        var dirs = new (int dx, int dy)[] { (1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1) };
        while (fila.Count > 0)
        {
            var c = fila.Dequeue();
            if (c == alvo) break;
            int cx = c % largura, cy = c / largura;
            foreach (var (dx, dy) in dirs)
            {
                int nx = cx + dx, ny = cy + dy;
                if (!Livre(nx, ny)) continue;
                if (dx != 0 && dy != 0 && (!Livre(cx + dx, cy) || !Livre(cx, cy + dy))) continue; // não corta quina
                var k = nx + ny * largura;
                if (veio[k] != -1) continue;
                veio[k] = c;
                fila.Enqueue(k);
            }
        }
        if (veio[alvo] == -1) return null;

        var pontos = new List<Vector2>();
        for (var c = alvo; c != s; c = veio[c]) pontos.Add(Celula(c % largura, c / largura));
        pontos.Reverse();

        // Simplifica: pula pontos quando dá para ir reto.
        var liso = new List<Vector2>();
        var atual = de;
        var i = 0;
        while (i < pontos.Count)
        {
            var j = pontos.Count - 1;
            while (j > i && !LinhaLivre(atual, pontos[j])) j--;
            liso.Add(pontos[j]);
            atual = pontos[j];
            i = j + 1;
        }
        return liso;
    }

    private static bool LinhaLivre(Vector2 a, Vector2 b)
    {
        var d = Vector2.Distance(a, b);
        var n = Mathf.CeilToInt(d / (Passo * 0.5f));
        for (var k = 1; k <= n; k++)
        {
            var p = Vector2.Lerp(a, b, k / (float)n);
            var (x, y) = Indice(p);
            if (!Livre(x, y)) return false;
        }
        return true;
    }
}
