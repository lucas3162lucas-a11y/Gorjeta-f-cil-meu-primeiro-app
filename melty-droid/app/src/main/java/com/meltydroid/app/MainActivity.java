package com.meltydroid.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Tela única: um WebView com a interface em assets/www, servida em https://appassets.androidplatform.net
 * (origem segura, então módulos JS e localStorage funcionam normalmente).
 */
public class MainActivity extends Activity {

    static final String ORIGEM = "https://appassets.androidplatform.net";
    private static final int PEDIDO_ARQUIVO = 41;

    private WebView web;
    private ValueCallback<Uri[]> retornoArquivo;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle salvo) {
        super.onCreate(salvo);

        final WebViewAssetLoader carregador = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        web.setBackgroundColor(0xFF14111C);
        WebSettings ajustes = web.getSettings();
        ajustes.setJavaScriptEnabled(true);
        ajustes.setDomStorageEnabled(true);
        ajustes.setAllowFileAccess(false);
        ajustes.setAllowContentAccess(false);

        web.addJavascriptInterface(new Ponte(this, web), "Nativo");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return carregador.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri url = req.getUrl();
                if (url.toString().startsWith(ORIGEM)) return false;
                // Links de fora abrem no navegador do celular.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (ActivityNotFoundException ignorado) {
                    // sem navegador: não faz nada
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> retorno, FileChooserParams params) {
                if (retornoArquivo != null) retornoArquivo.onReceiveValue(null);
                retornoArquivo = retorno;
                Intent escolher = new Intent(Intent.ACTION_GET_CONTENT);
                escolher.addCategory(Intent.CATEGORY_OPENABLE);
                escolher.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(escolher, "Escolha a mistura"), PEDIDO_ARQUIVO);
                } catch (ActivityNotFoundException e) {
                    retornoArquivo = null;
                    return false;
                }
                return true;
            }
        });

        setContentView(web);
        if (salvo != null) web.restoreState(salvo);
        else web.loadUrl(ORIGEM + "/assets/www/index.html");
    }

    @Override
    protected void onActivityResult(int pedido, int resultado, Intent dados) {
        super.onActivityResult(pedido, resultado, dados);
        if (pedido != PEDIDO_ARQUIVO || retornoArquivo == null) return;
        Uri[] uris = null;
        if (resultado == RESULT_OK && dados != null && dados.getData() != null) uris = new Uri[]{dados.getData()};
        retornoArquivo.onReceiveValue(uris);
        retornoArquivo = null;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.aoVoltarProApp && aoVoltarProApp()", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle estado) {
        super.onSaveInstanceState(estado);
        web.saveState(estado);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.voltar ? voltar() : false", valor -> {
            if (!"true".equals(valor)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
