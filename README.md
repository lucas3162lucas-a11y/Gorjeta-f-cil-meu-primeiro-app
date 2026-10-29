# ZapVendas IA — Atendente de IA para WhatsApp (para vender por assinatura)

Sistema pronto para você **vender** uma IA que atende e vende no WhatsApp dos seus clientes.

- Site de vendas com os 3 planos (só mensal, sem anual)
- Cadastro e login dos clientes
- Painel do cliente: conecta o WhatsApp lendo um QR Code e "treina" a IA com as informações do negócio
- IA grátis da **NVIDIA** (build.nvidia.com)
- Cobrança mensal pela **Cakto**: liberou o pagamento → funciona. **Parou de pagar → o robô para de responder sozinho.**
- Painel de administrador para você ver clientes, faturamento e liberar/bloquear na mão

## Planos

| | **Simple** | **Plus** ⭐ recomendado | **Pro** |
|---|---|---|---|
| Preço | **R$ 15,25/mês** | **R$ 29,90/mês** | **R$ 47,90/mês** |
| Respostas da IA por mês | 300 | 1.500 | 5.000 |
| Modelo de IA (NVIDIA) | Nemotron 3.5 Lightning | Nemotron 3 Super | Nemotron 3 Ultra |
| Memória da conversa | 6 mensagens | 12 mensagens | 30 mensagens |
| Informações do negócio / FAQ | ✓ | ✓ | ✓ |
| Catálogo de produtos e preços | — | ✓ | ✓ |
| Horário de atendimento | — | ✓ | ✓ |
| IA pausa quando você responde pelo celular | — | ✓ | ✓ |
| Cliente pede "atendente" → aviso no seu WhatsApp | — | — | ✓ |
| Histórico de conversas no painel | — | — | ✓ |

Para mudar preços, limites ou o que cada plano tem: edite `src/plans.js`.

## Como a assinatura funciona

1. O cliente cria a conta no seu site escolhendo um plano e vai para o checkout da Cakto.
2. A Cakto avisa o sistema (webhook) quando o pagamento é aprovado → o plano fica ativo por **30 dias**.
3. Todo mês a Cakto cobra de novo e avisa (`subscription_renewed`) → mais 30 dias.
4. Se o cliente **não pagar**, o vencimento chega, passam os dias de tolerância (`GRACE_DAYS`, padrão 2) e **o robô para de responder e o WhatsApp é desligado**. O painel mostra "Assinatura vencida — renove".
5. Se ele **cancelar**, funciona até o fim do mês que já pagou e depois para.
6. **Reembolso ou chargeback** → bloqueia na hora.
7. Quando ele pagar de novo, volta a funcionar (é só conectar o WhatsApp no painel).

## Passo a passo para colocar no ar

### 1. Chave grátis da NVIDIA
1. Entre em https://build.nvidia.com e crie uma conta.
2. Abra qualquer modelo e clique em **Get API Key**. A chave começa com `nvapi-`.

> A API grátis da NVIDIA tem limite de uso (requisições por minuto). Para muitos clientes, pode ser preciso um plano pago da NVIDIA ou mais de uma chave. Se a NVIDIA desativar algum modelo, o sistema usa automaticamente o modelo reserva (`NVIDIA_MODEL_FALLBACK`), e você pode trocar os modelos no `.env`.

### 2. Produtos na Cakto
1. No painel da Cakto, crie **3 produtos do tipo assinatura, recorrência mensal**:
   - Simple — R$ 15,25
   - Plus — R$ 29,90
   - Pro — R$ 47,90
2. Copie o link de checkout de cada um (ex.: `https://pay.cakto.com.br/abc123`).
3. Em **Apps → Webhooks**, crie um webhook:
   - URL: `https://SEU-DOMINIO/webhook/cakto`
   - Eventos: `purchase_approved`, `subscription_created`, `subscription_renewed`, `subscription_renewal_refused`, `subscription_late`, `subscription_late_recovered`, `subscription_canceled`, `subscription_paused`, `subscription_resumed`, `refund`, `chargeback`
   - Copie o **secret** do webhook.

O sistema identifica quem pagou pelo código `callback` que vai no link de checkout (ou, se não vier, pelo e-mail). Por isso, oriente o cliente a pagar pelo botão do painel e com o mesmo e-mail da conta.

### 3. Servidor
Precisa de um servidor ligado 24h com disco permanente (o WhatsApp de cada cliente fica salvo na pasta `data/`). Opções: VPS (Hostinger, Contabo, DigitalOcean, Oracle Cloud grátis), Railway ou Render com volume persistente. Precisa de **Node.js 22.5 ou mais novo** e **HTTPS** (o webhook da Cakto exige).

```bash
git clone <este repositório>
cd Gorjeta-f-cil-meu-primeiro-app
npm install
cp .env.example .env    # depois edite o .env com suas chaves
npm start
```

Para deixar rodando sempre numa VPS: `npm i -g pm2 && pm2 start npm --name zapvendas -- start && pm2 save`.

#### Rodar no celular Android (Termux) — bom para testar

Instale o Termux pelo **F-Droid** ou pelo GitHub do Termux (a versão da Play Store é antiga). Baixe o `zapvendas-ia.zip` para a pasta Downloads e rode:

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs git unzip nano
termux-setup-storage          # aceite a permissão de arquivos
cd ~ && unzip ~/storage/downloads/zapvendas-ia.zip -d zapvendas && cd zapvendas
cp .env.example .env && nano .env   # preencha e salve: Ctrl+O, Enter, Ctrl+X
npm install
termux-wake-lock              # impede o Android de desligar o Termux
npm start
```

Abra `http://localhost:3000` no navegador do celular. Para conectar o WhatsApp do próprio celular, use **"Gerar código"** no painel (em vez do QR Code) e digite o código em WhatsApp → Aparelhos conectados → Conectar aparelho → **Conectar com número de telefone**.

### 4. Configure o `.env`
Veja todos os campos em `.env.example`. Os principais:
- `PUBLIC_URL` — endereço do seu site (com https)
- `NVIDIA_API_KEY` — sua chave da NVIDIA
- `CAKTO_CHECKOUT_SIMPLE`, `CAKTO_CHECKOUT_PLUS`, `CAKTO_CHECKOUT_PRO` — links dos 3 produtos
- `CAKTO_WEBHOOK_SECRET` — secret do webhook
- `ADMIN_EMAIL` — seu e-mail (crie uma conta no site com ele para acessar `/admin`)
- `SESSION_SECRET` — um texto grande e aleatório

### 5. Teste
1. Acesse o site, crie uma conta e assine um plano (ou, em `/admin`, clique em **Liberar** na sua própria conta).
2. No painel, preencha as informações do negócio e clique em **Conectar WhatsApp**.
3. Leia o QR Code com o celular (WhatsApp → Aparelhos conectados), ou use **Gerar código** se estiver no próprio celular.
4. Mande uma mensagem de outro número e veja a IA responder.

## 🎬 Produção automática de vídeos para o TikTok

Um comando escolhe o assunto, escreve o roteiro, narra, edita e espera a sua aprovação para postar no TikTok.

- **Nicho:** curiosidades de animais e da natureza, nos 4 formatos que mais viralizaram na pesquisa (veja `docs/modelagem-viral.md`).
- **Roteiro:** IA da NVIDIA (usa a mesma `NVIDIA_API_KEY`), ou um roteiro pronto da pasta `roteiros/`.
- **Narração:** edge-tts, vozes grátis em português.
- **Edição:** ffmpeg, vídeo vertical 1080x1920 com legendas grandes sincronizadas, selo "VOCÊ SABIA?" e barra de progresso. O fundo vem do Pexels (vídeos grátis) se você tiver a chave, ou é um degradê animado.
- **Aprovação:** o vídeo nunca é postado sem você dizer "s".

### Instalar (Termux ou PC)
```bash
pkg install -y python ffmpeg ttf-dejavu     # Termux  (no PC: instale Python 3 e ffmpeg)
pip install edge-tts
```

### Usar
```bash
npm run acao                                              # 🎬 ação! faz um vídeo novo
npm run acao -- --roteiro roteiros/01-lagarta-lonomia.json  # usa um roteiro pronto
npm run acao -- --sim                                     # aprova sozinho e já posta
npm run postar                                            # posta o último vídeo que ficou esperando
```
No fim, ele mostra o caminho do vídeo (no Termux, abre o vídeo sozinho) e pergunta:
`Aprovar e postar no TikTok? [s] postar  [n] descartar  [Enter] decidir depois`.
Tudo fica salvo em `data/videos/<data-hora>/` (vídeo, roteiro e status).

### Conectar o TikTok (uma vez só)
1. Em https://developers.tiktok.com, crie um app e adicione os produtos **Login Kit** e **Content Posting API**, com as permissões `video.upload` e `video.publish`.
2. Cadastre um **Redirect URI** (pode ser qualquer página sua com https, ex.: `https://seu-dominio.com.br/tiktok/retorno`).
3. Preencha `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` e `TIKTOK_REDIRECT_URI` no `.env`.
4. Rode `npm run tiktok:login`, abra o link, autorize e cole o endereço para onde o navegador te levou.

**Modos de postagem (`TIKTOK_MODO`):**
- `rascunho` (padrão, recomendado): o vídeo vai para a caixa de entrada do seu app do TikTok, e você publica com um toque. Dá para colocar um som em alta antes.
- `publicar`: vai direto para o perfil. **Enquanto o TikTok não aprovar (auditar) o seu app, ele só deixa postar como privado** (`SELF_ONLY`). Depois da auditoria, troque `TIKTOK_PRIVACIDADE` para `PUBLIC_TO_EVERYONE`.

Os vídeos são marcados como feitos com IA (`is_aigc`), como o TikTok exige. Confira os fatos de cada roteiro antes de aprovar.

## Páginas
- `/` — site de vendas com os planos
- `/entrar` — login e cadastro
- `/painel` — painel do cliente
- `/admin` — seu painel (clientes, faturamento mensal, liberar/bloquear)

## Avisos importantes
- A conexão com o WhatsApp é feita pelo QR Code (igual ao WhatsApp Web, biblioteca Baileys), **não é a API oficial da Meta**. Funciona com WhatsApp comum e Business, mas o WhatsApp pode bloquear números que mandam spam. A IA só **responde** quem mandou mensagem, o que reduz esse risco. Deixe isso claro nos termos de uso para seus clientes.
- A IA só responde conversas individuais (não responde grupos nem status).
- Faça backup da pasta `data/` (banco de dados e sessões do WhatsApp).

## Estrutura
```
src/
  server.js        site, login, painel e API
  plans.js         os 3 planos (preço, limites, recursos)
  subscription.js  regras de assinatura (ativo, vencido, cancelado, bloqueado)
  cakto.js         webhook da Cakto (pagamentos)
  whatsapp.js      conexão com WhatsApp e atendimento
  ai.js            IA da NVIDIA
  db.js            banco de dados (SQLite, arquivo em data/)
public/            páginas do site
src/videos/        produção de vídeos (acao, roteiro, narração, edição, TikTok)
roteiros/          roteiros prontos (modelados de vídeos virais)
docs/              pesquisa de vídeos virais do nicho
```
