# IA a Bordo (mod do Among Us)

Mod feito com a [Mira API](https://github.com/All-Of-Us-Mods/MiraAPI). No **modo treino (Freeplay)**, os bonecos
fantoche ganham um cérebro:

- andam pela nave indo de tarefa em tarefa;
- um ou mais são **infiltrados secretos** que matam quando ninguém está olhando;
- quem acha um corpo, ou vê alguém matar, **reporta**;
- na reunião, cada um **fala no chat do jogo** (2 rodadas) e **vota**;
- o **pensamento** de cada um aparece embaixo do nome (e no chat da reunião, em cinza).

O mod só funciona no modo treino, que é offline. Em partidas com outras pessoas ele não faz nada.

## O cérebro (IA)

Por padrão o mod tenta usar o **Ollama rodando no Termux** do mesmo celular (`http://127.0.0.1:11434`), com o modelo
`qwen2.5:1.5b`. Se não achar, os bonecos usam falas prontas (eles continuam andando, matando, reportando e votando).

```bash
pkg install ollama
ollama serve > ~/ollama.log 2>&1 &
ollama pull qwen2.5:1.5b
```

Deixe o Termux aberto e abra o jogo.

## Instalar

**Arquivo do mod:** `dist/IAaBordo.dll`
(link direto: https://github.com/lucas3162lucas-a11y/Gorjeta-f-cil-meu-primeiro-app/raw/ccr-1452043c-4pabqu/ia-a-bordo-mod/dist/IAaBordo.dll)

Ele precisa da **Mira API** e do **Reactor** instalados junto.

- **Celular (Starlight):** instale a Mira API pelo Starlight. Para adicionar este arquivo, procure no Starlight uma opção
  de mod local/importar arquivo. Se não existir, pergunte no Discord da All Of Us como testar um mod próprio.
- **PC:** Among Us com BepInEx 6 (IL2CPP) + Reactor + Mira API. Coloque `IAaBordo.dll` em `BepInEx/plugins/`.

Depois: **Jogar → Treino (Freeplay)**, escolha um mapa e espere os bonecos começarem a andar.

## Configurar

O arquivo de configuração é criado em `BepInEx/config/lucas.iaabordo.cfg` na primeira vez que o jogo abre:

| Opção | Padrão | O que faz |
|---|---|---|
| `Ativo` | true | liga/desliga as IAs |
| `Infiltrados` | 1 | quantos bonecos são infiltrados (0 a 3) |
| `PodemMatarVoce` | true | os infiltrados também podem matar você |
| `MostrarPensamentos` | true | mostra os pensamentos (revela quem é infiltrado) |
| `TempoParaMatar` | 35 | segundos entre um assassinato e outro |
| `Url` / `Modelo` / `Chave` | Ollama local | qualquer API no formato da OpenAI |

## Compilar

```bash
dotnet build -c Release     # .NET 6 ou mais novo; baixa Mira API, Reactor, BepInEx e as referências do jogo
```

Feito para o Among Us **2026.9.29** (referências `AmongUs.GameLibs.Steam`). Se o jogo atualizar, pode precisar recompilar.

## Status

Primeira versão. Compila, mas **ainda não foi testada dentro do jogo**. Se algo não funcionar, o log do BepInEx
(`BepInEx/LogOutput.log`) mostra mensagens começando com "IA a Bordo".
