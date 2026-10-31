# Melty Droid

App Android para **misturar jogos** no celular, na mesma ideia do Melty do PC: você escolhe ou descreve uma
mistura, o app monta o mod, entrega pro jogo e abre o jogo. **Não precisa de root.**

> Projeto independente, sem ligação com o Melty oficial nem com os jogos suportados.

## Por que não precisa de root

No PC, o Melty e o [universal-modder](https://github.com/rehan-remade/universal-modder) mexem nos arquivos e
no código do jogo. No Android cada app fica trancado no seu canto, e para mexer à força em outro app você
precisaria de root (e quebraria as regras do jogo).

O Melty Droid usa as portas que os próprios jogos deixam abertas para mods:

| Jogo | Como a mistura entra | O que o app faz |
|---|---|---|
| **Minecraft** (Bedrock / Pocket Edition) | Add-on oficial com Script API | Gera um `.mcaddon` e abre com o Minecraft, que importa sozinho |
| **Luanti** (ex-Minetest, código aberto) | Mod Lua oficial | Gera o `.zip` do mod e salva em Downloads |

Por isso só entram jogos que aceitam mods oficialmente. Jogos fechados e com anticheat (Free Fire, PUBG etc.)
não dão, nem com root dá para fazer isso de forma segura.

## O que tem no app

- **Início**: os jogos suportados (mostra se estão instalados e abre o jogo) e as suas misturas.
- **Catálogo**: misturas prontas. Toque em *Adicionar* e depois em *Instalar*.
- **Criar**:
  - **Com IA**: descreva a mistura ("chuva de meteoros", "combate soulslike"...). A IA escreve o mod,
    o app confere o código e instala. Usa a API grátis da NVIDIA ([build.nvidia.com](https://build.nvidia.com))
    ou qualquer API no formato da OpenAI. A chave fica só no seu celular.
  - **Sem IA**: pegue uma receita pronta e ajuste os números (estamina, cargas do frasco, cura...).
- **Compartilhar**: exporta a mistura como `.mistura.json` para um amigo importar em *Ajustes → Importar*.
- **Catálogo online** (opcional): em Ajustes, coloque o endereço de um JSON com mais misturas.

### Misturas que já vêm no app

- **Minecraft Souls / Luanti Souls**: estamina para correr, bater e esquivar; esquiva (agachar + pular)
  com invulnerabilidade; frasco de cura com cargas (no Minecraft, use um frasco de vidro); descansar
  agachado perto de uma fogueira recarrega tudo e vira o ponto de renascimento.
- **Sobrevivência Dura**: a mesma ideia, mais difícil.

## Como pegar o APK

Cada vez que algo muda em `melty-droid/`, o GitHub Actions compila o app sozinho
(`.github/workflows/melty-droid-apk.yml`):

1. No GitHub do projeto, abra **Releases → Melty Droid (versão de teste)** e baixe `MeltyDroid.apk` no celular.
   (Também fica em **Actions → Melty Droid - gerar APK → Artifacts**.)
2. Abra o arquivo e permita "instalar apps desconhecidos" para o navegador ou gerenciador de arquivos.
3. Android 8 ou mais novo.

O APK de teste é assinado com a chave de debug. Para publicar na Play Store, crie uma chave sua e configure em
`app/build.gradle`.

### Compilar no PC

Com o Android SDK instalado (Android Studio já traz):

```bash
cd melty-droid
./gradlew assembleRelease     # APK em app/build/outputs/apk/release/
```

## Testar sem celular

A interface roda no navegador do PC (os botões que dependem do Android viram download):

```bash
cd melty-droid
npm run web        # abre em http://localhost:8080
npm test           # testa o motor: monta as misturas, confere e abre os pacotes
```

`TESTAR_LUA=1 npm test` (depois de `pip install lupa`) também roda o mod do Luanti numa API falsa.

## Como funciona por dentro

```
app/src/main/
  java/com/meltydroid/app/
    MainActivity.java   WebView com a interface
    Ponte.java          o que o JavaScript pede ao Android: ver jogos instalados, abrir jogo,
                        entregar o pacote ao jogo, salvar em Downloads, compartilhar, chamar a IA
  assets/www/
    index.html, app.js, estilo.css   telas
    nativo.js                        ponte com o Android (com alternativa para navegador)
    motor/
      jogos.js     os jogos suportados (pacote Android, template, como instalar, guia para a IA)
      gerador.js   monta, confere e empacota uma mistura
      ia.js        "Criar com IA"
      zip.js       gera .zip / .mcaddon sem bibliotecas
    conteudo/
      catalogo.json, receitas/, templates/   misturas prontas e modelos de mod de cada jogo
```

### Adicionar outro jogo

Funciona com qualquer jogo de Android que aceite mods sem root:

1. Crie `conteudo/templates/<id-do-jogo>/` com os arquivos do mod (use `__NOME__`, `__DESCRICAO__`...).
2. Adicione o jogo em `motor/jogos.js` (nome, pacote Android, arquivos do template, como instalar, guia da IA).
3. Coloque o pacote Android do jogo em `<queries>` no `AndroidManifest.xml`.
4. Rode `npm test`.

## Limites (para ser honesto)

- No Minecraft, depois de importar, você precisa ativar o pacote de comportamento no mundo.
- No Luanti, o Android não deixa outro app gravar na pasta do jogo, então você precisa extrair o `.zip` na pasta
  `mods` do Luanti com um gerenciador de arquivos.
- O código feito pela IA é conferido (sintaxe, arquivos, formato), mas pode não fazer exatamente o que você pediu.
  Se não ficar bom, descreva de outro jeito e gere de novo.
- Os testes automáticos rodam os mods numa API falsa do jogo, não no jogo de verdade. Ainda falta testar dentro do
  Minecraft e do Luanti num celular.
