# 🛍️ Bot de Achadinhos (WhatsApp)

Ele faz tudo sozinho no seu WhatsApp:

- **Posta produtos no seu grupo de achadinhos**, alternando as lojas: **Shein → Mercado Livre → Shopee → Shein...**
- **Na Shein, mistura produtos com o SEU link de afiliado** com outros produtos (padrão: metade a metade; você muda em `porcentagemAfiliados`).
- **Manda a sua vitrine/link de afiliado da Shein** de tempos em tempos (padrão: a cada 6 posts).
- **Divulga o seu grupo**: dentro do grupo ("chama os amigos", a cada 10 posts) e, se você ativar, nos **grupos de divulgação** (padrão: a cada 6 horas).
- Só posta no horário que você escolher (padrão 8h às 22h), com intervalo um pouco variado para não parecer robô.
- Não repete o mesmo produto enquanto tiver outro da loja que ainda não saiu.

## 🛍️ Cadastrar produto da Shein em 2 toques

No **app da Shein**, abra o produto → **Compartilhar** → escolha o WhatsApp → **Conversar comigo** (o chat com você mesmo).
O bot pega o link, o nome e o preço da mensagem e cadastra como **seu afiliado ⭐**. Também funciona colando só o seu link de afiliado, ou mandando uma **foto do produto com o link na legenda** (a foto vai junto no post).
Se o nome ou o preço vier errado: `!editar shein 4 Nome certo | 59,90 | 119,90`.

> A Shein bloqueia busca automática de produtos (pede captcha), então não dá para o bot procurar sozinho na Shein.

## 🔎 Busca automática de ofertas (Shopee)

O bot busca sozinho os produtos mais vendidos e com desconto na **Shopee**, pela API oficial de afiliados, e os links **já saem com a sua comissão**. Quando as ofertas não postadas estão acabando, ele busca mais.

1. Entre em **affiliate.shopee.com.br** → menu **Open API** → peça acesso (a Shopee precisa aprovar).
2. Quando aprovar, copie o **App ID** e a **Senha (Secret)**.
3. Mande no "Conversar comigo": `!shopeechave APPID SENHA` — ele já testa e busca as primeiras ofertas.
4. Escolha o que buscar: `!palavras fone bluetooth, maquiagem, cozinha, organizador`.

| Loja | Como os produtos entram |
|---|---|
| Shopee | **Automático** (API oficial de afiliados) |
| Shein | Você manda os seus links de afiliado (`!addafiliado`). A Shein não tem API aberta para buscar produtos |
| Mercado Livre | Você manda os links (`!add ml`). O Mercado Livre não tem API de afiliados aberta e bloqueia buscas automáticas |

## Como ligar

```bash
npm install
npm run achadinhos
```

Dá para configurar tudo pelos comandos do WhatsApp (`!usargrupo`, `!vitrine`, `!addafiliado`...), sem editar arquivo. Na primeira vez ele também cria `achadinhos/config.json` e `achadinhos/produtos.json`. Pare o bot (Ctrl+C), edite os dois e ligue de novo.
No Termux: `nano achadinhos/config.json` (salvar: Ctrl+O, Enter, Ctrl+X).

**Conectar o WhatsApp:**
- Coloque o seu número em `numeroWhatsApp` (com 55 + DDD, ex.: `5511987654321`) → aparece um **código de 8 letras**. No WhatsApp: *Aparelhos conectados → Conectar aparelho → Conectar com número de telefone*.
- Ou deixe o número de exemplo → aparece um **QR Code** no terminal.

Use um número que esteja **dentro do grupo de achadinhos** (de preferência como admin).

Para ver como vão ficar os posts sem conectar nada: `npm run achadinhos:simular`

## config.json

| Campo | O que é |
|---|---|
| `grupoAchadinhos` | Nome do seu grupo de achadinhos, igualzinho ao WhatsApp (mande `!grupos` para ver) |
| `linkConviteGrupo` | Link de convite do grupo (Grupo → Convidar via link) |
| `intervaloMinutos` | De quanto em quanto tempo posta um produto |
| `horarioInicio` / `horarioFim` | Horário em que pode postar |
| `ordemLojas` | Ordem do revezamento das lojas |
| `shein.porcentagemAfiliados` | % dos posts da Shein que serão produtos com o SEU link de afiliado |
| `shein.linkVitrine` | Seu link de afiliado / vitrine da Shein |
| `shein.enviarVitrineACada` | A cada quantos posts manda a vitrine (0 = nunca) |
| `convidarNoGrupoACada` | A cada quantos posts manda "compartilhe o grupo" (0 = nunca) |
| `divulgacao.ativo` | `true` para divulgar o seu grupo em outros grupos |
| `divulgacao.grupos` | Nomes dos grupos onde divulgar |
| `divulgacao.intervaloHoras` | De quantas em quantas horas divulga |
| `donos` | Outros números que podem mandar comandos (ex.: `["5511988887777"]`) |

## produtos.json

Cada loja tem uma lista. Em cada produto: `titulo`, `preco`, `precoAntigo` (opcional, mostra o % OFF), `link`, `imagem` (link de uma foto, opcional), `cupom` (opcional).
Na Shein, coloque `"afiliado": true` nos produtos com o **seu link de afiliado**. Para pausar um produto sem apagar: `"ativo": false`.

Os produtos de exemplo (links com `SEU-LINK`) nunca são postados. Pode editar o arquivo com o bot ligado — ele relê antes de cada post.

## Comandos pelo WhatsApp

Mande no **"Conversar comigo"** (o chat com você mesmo) do número conectado:

| Comando | O que faz |
|---|---|
| `!ajuda` | Lista os comandos |
| `!status` | Situação do bot e quantos produtos tem |
| `!enviar` / `!enviar shein` / `!enviar ml` / `!enviar shopee` | Posta agora |
| `!divulgar` | Divulga o grupo agora |
| `!pausar` / `!voltar` | Para ou volta a postar |
| `!grupos` | Lista seus grupos numerados |
| `!usargrupo 2` | Escolhe o grupo nº 2 como grupo de achadinhos (e salva o link de convite) |
| `!vitrine https://...` | Salva seu link de afiliado/vitrine da Shein |
| `!convite https://chat.whatsapp.com/...` | Salva o link de convite do grupo |
| `!intervalo 30` | Posta a cada 30 minutos |
| `!lista shein` | Produtos cadastrados (⭐ = seu afiliado) |
| `!addafiliado link \| título \| preço \| preço antigo` | Cadastra produto da Shein com SEU link de afiliado |
| `!add shopee link \| título \| preço \| preço antigo \| cupom` | Cadastra produto (shein, ml ou shopee) |
| `!shopeechave APPID SENHA` | Liga a busca automática da Shopee |
| `!buscar shopee` / `!buscar shopee fone` | Busca ofertas na Shopee agora |
| `!palavras fone, maquiagem` | O que buscar na Shopee |
| `!foto shopee 2 https://link-da-foto` | Coloca foto no produto nº 2 |
| `!editar shein 4 título \| preço \| preço antigo` | Corrige um produto |
| `!remover ml 3` | Remove o produto nº 3 |

Exemplo: `!addafiliado https://onelink.shein.com/abc | Vestido floral | 59,90 | 119,90`

## ⚠️ Cuidados para não ser bloqueado
- Mandar mensagens repetidas em **grupos dos outros** é o que mais causa banimento. Só divulgue em grupos que **permitem** divulgação, e não diminua muito o `intervaloHoras`.
- Use um número secundário (chip só para o bot) se puder.
- Os links de afiliado você gera no painel de afiliados de cada loja (Shein, Shopee e Mercado Livre). O bot só posta os links que você cadastrar.
- Para deixar ligado direto: no Termux use `termux-wake-lock`; numa VPS, `pm2 start npm --name achadinhos -- run achadinhos`.
