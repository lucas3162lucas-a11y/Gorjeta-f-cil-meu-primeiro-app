package com.meltydroid.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Funções do Android que a interface (JavaScript) usa, via window.Nativo.
 * Nada aqui precisa de root: só intents normais, FileProvider e MediaStore.
 */
public class Ponte {

    private static final int LIMITE_RESPOSTA = 4 * 1024 * 1024;

    private final Activity atividade;
    private final WebView web;
    private final ExecutorService rede = Executors.newFixedThreadPool(2);

    Ponte(Activity atividade, WebView web) {
        this.atividade = atividade;
        this.web = web;
    }

    // ---------- jogos ----------

    /** Recebe "pacote1,pacote2" e devolve {"pacote1":true,...}. Os pacotes precisam estar em <queries>. */
    @JavascriptInterface
    public String jogosInstalados(String pacotesCsv) {
        JSONObject saida = new JSONObject();
        PackageManager pm = atividade.getPackageManager();
        for (String p : pacotesCsv.split(",")) {
            String pacote = p.trim();
            if (pacote.isEmpty()) continue;
            boolean tem;
            try {
                pm.getPackageInfo(pacote, 0);
                tem = true;
            } catch (PackageManager.NameNotFoundException e) {
                tem = false;
            }
            try {
                saida.put(pacote, tem);
            } catch (Exception ignorado) {
                // put com chave String nunca falha
            }
        }
        return saida.toString();
    }

    @JavascriptInterface
    public boolean abrirJogo(String pacote) {
        Intent abrir = atividade.getPackageManager().getLaunchIntentForPackage(pacote);
        if (abrir == null) return false;
        abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        atividade.startActivity(abrir);
        return true;
    }

    @JavascriptInterface
    public void abrirLoja(String pacote) {
        try {
            atividade.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pacote)));
        } catch (ActivityNotFoundException e) {
            abrirLink("https://play.google.com/store/apps/details?id=" + pacote);
        }
    }

    @JavascriptInterface
    public void abrirLink(String url) {
        if (!url.startsWith("https://")) return;
        try {
            atividade.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException ignorado) {
            // sem navegador
        }
    }

    // ---------- arquivos ----------

    private Uri gravarExportado(String nome, String base64) throws Exception {
        File pasta = new File(atividade.getCacheDir(), "exportados");
        if (!pasta.exists() && !pasta.mkdirs()) throw new Exception("não deu para criar a pasta temporária");
        File arquivo = new File(pasta, new File(nome).getName()); // getName() evita "../"
        try (OutputStream out = new FileOutputStream(arquivo)) {
            out.write(Base64.decode(base64, Base64.DEFAULT));
        }
        return FileProvider.getUriForFile(atividade, atividade.getPackageName() + ".arquivos", arquivo);
    }

    /**
     * Abre o pacote com o jogo (ex.: .mcaddon no Minecraft, que importa sozinho).
     * Se o jogo não aceitar o intent direto, mostra o "Abrir com" do Android.
     */
    @JavascriptInterface
    public String abrirComJogo(String nome, String base64, String mime, String pacote) {
        Uri uri;
        try {
            uri = gravarExportado(nome, base64);
        } catch (Exception e) {
            return "Erro ao preparar o arquivo: " + e.getMessage();
        }
        Intent ver = new Intent(Intent.ACTION_VIEW);
        ver.setDataAndType(uri, mime);
        ver.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        ver.setPackage(pacote);
        try {
            atividade.startActivity(ver);
            return "ok";
        } catch (ActivityNotFoundException semFiltro) {
            ver.setPackage(null);
            ver.setDataAndType(uri, "*/*");
            try {
                atividade.startActivity(Intent.createChooser(ver, "Abrir com o jogo")
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return "ok";
            } catch (ActivityNotFoundException e) {
                return "Nenhum app abriu o arquivo. O jogo está instalado?";
            }
        }
    }

    /** Salva em Downloads (Android 10+ sem permissão nenhuma). */
    @JavascriptInterface
    public String salvarDownloads(String nome, String base64, String mime) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            // Android 8/9 precisaria de permissão de armazenamento: usa o compartilhar (ex.: salvar no Drive/Arquivos).
            return compartilhar(nome, base64, mime);
        }
        try {
            ContentResolver cr = atividade.getContentResolver();
            ContentValues valores = new ContentValues();
            valores.put(MediaStore.Downloads.DISPLAY_NAME, new File(nome).getName());
            valores.put(MediaStore.Downloads.MIME_TYPE, mime);
            Uri destino = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, valores);
            if (destino == null) return "Não deu para criar o arquivo em Downloads.";
            try (OutputStream out = cr.openOutputStream(destino)) {
                if (out == null) return "Não deu para escrever em Downloads.";
                out.write(Base64.decode(base64, Base64.DEFAULT));
            }
            return "ok";
        } catch (Exception e) {
            return "Erro ao salvar: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String compartilhar(String nome, String base64, String mime) {
        try {
            Uri uri = gravarExportado(nome, base64);
            Intent enviar = new Intent(Intent.ACTION_SEND);
            enviar.setType(mime);
            enviar.putExtra(Intent.EXTRA_STREAM, uri);
            enviar.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            atividade.startActivity(Intent.createChooser(enviar, "Enviar mistura")
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return "ok";
        } catch (Exception e) {
            return "Erro ao compartilhar: " + e.getMessage();
        }
    }

    // ---------- rede (para a IA e o catálogo online, sem bloqueio de CORS) ----------

    @JavascriptInterface
    public void http(final String id, final String url, final String metodo, final String headersJson, final String corpo) {
        rede.execute(() -> {
            int status = 0;
            String resposta;
            HttpURLConnection con = null;
            try {
                if (!url.startsWith("https://")) throw new Exception("só endereços https são permitidos");
                con = (HttpURLConnection) new URL(url).openConnection();
                con.setConnectTimeout(20000);
                con.setReadTimeout(180000);
                con.setRequestMethod("POST".equals(metodo) ? "POST" : "GET");
                JSONObject headers = new JSONObject(headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                for (Iterator<String> it = headers.keys(); it.hasNext(); ) {
                    String k = it.next();
                    con.setRequestProperty(k, headers.getString(k));
                }
                if ("POST".equals(metodo)) {
                    con.setDoOutput(true);
                    try (OutputStream out = con.getOutputStream()) {
                        out.write(corpo.getBytes(StandardCharsets.UTF_8));
                    }
                }
                status = con.getResponseCode();
                InputStream in = status >= 400 ? con.getErrorStream() : con.getInputStream();
                resposta = ler(in);
            } catch (Exception e) {
                resposta = String.valueOf(e.getMessage());
            } finally {
                if (con != null) con.disconnect();
            }
            final String js = "window.__nativoResposta(" + JSONObject.quote(id) + "," + status + ","
                    + JSONObject.quote(resposta) + ")";
            web.post(() -> web.evaluateJavascript(js, null));
        });
    }

    private static String ler(InputStream in) throws Exception {
        if (in == null) return "";
        try (InputStream entrada = in; ByteArrayOutputStream buf = new ByteArrayOutputStream()) {
            byte[] bloco = new byte[16384];
            int n;
            while ((n = entrada.read(bloco)) != -1) {
                buf.write(bloco, 0, n);
                if (buf.size() > LIMITE_RESPOSTA) throw new Exception("resposta grande demais");
            }
            return buf.toString("UTF-8");
        }
    }
}
