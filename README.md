# CRM para Venda de Sites

Sistema web em Next.js para captar, analisar e organizar leads de empresas que podem comprar desenvolvimento de sites.

## Funcionalidades

- Login com e-mail e senha usando Supabase Auth.
- Dashboard com total de leads, quantidade por status, taxa de conversao e follow-ups pendentes.
- Centro de Conversao com melhores oportunidades e proximas acoes.
- Agenda de Follow-up para retornos de hoje, atrasados e proximos dias.
- Cadastro manual de leads encontrados no Google, Instagram ou Maps.
- Classificacao automatica de oportunidade: alta, media ou baixa.
- Gerador de mensagem personalizada para WhatsApp, apenas para revisar e copiar.
- Envio pelo WhatsApp Business Platform/Cloud API quando o lead autorizou contato.
- Busca automatica de empresas por nicho e regiao usando Google Places API.
- Segmentacao automatica de leads por nicho.
- Webhook para marcar automaticamente quem respondeu no WhatsApp.
- Automacao de envio em lote para leads com autorizacao.
- Modelos de mensagem para escolher o texto do primeiro contato.
- Variaveis dinamicas nas mensagens, como empresa, nicho, problema, solucao e beneficio.
- Priorizacao automatica de leads com maior chance de resposta.
- Caixa de entrada `Conversas` para responder WhatsApp dentro do CRM quando a API oficial estiver configurada.
- Modo WhatsApp normal para abrir conversa com mensagem pronta e envio manual.
- Modo `Manual Assistido` completo, sem depender da API da Meta ou Google Places.
- Radar de Clientes com pesquisas prontas para Google, Maps, Instagram, Facebook e catalogos publicos.
- Historico manual: mensagem preparada, aberta no WhatsApp, enviada manualmente, resposta manual e follow-up.
- Importacao e exportacao CSV.
- Gerador de proposta comercial com escopo, beneficios, condicoes e texto copiavel.
- Follow-up com datas de proximo contato e atalhos de 2 ou 7 dias.
- Kanban com colunas por status e arrastar para atualizar.
- Registro de propostas enviadas.
- Estrutura preparada para deploy na Vercel.

## Tecnologias

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- Docker opcional para hospedagem em qualquer servidor

## Portabilidade

O projeto esta preparado para ser transferido para outra maquina ou hospedado em Vercel, VPS, Render, Railway ou Docker.

Leia tambem:

```text
PORTABILITY.md
DEPLOY.md
```

Versao recomendada:

```text
Node.js 20 LTS
npm 10+
```

## Como rodar localmente

1. Instale as dependencias:

```bash
npm ci
```

Se nao tiver `package-lock.json`, use `npm install`.

2. Copie o arquivo de exemplo de variaveis:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

3. Preencha o `.env.local` com os dados do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

4. Rode o projeto:

```bash
npm run dev
```

5. Acesse:

```text
http://localhost:3000
```

## Como configurar o Supabase

1. Crie um projeto em [Supabase](https://supabase.com).
2. Abra `Project Settings > API`.
3. Copie:
   - `Project URL` para `NEXT_PUBLIC_SUPABASE_URL`.
   - `anon public` para `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Va em `Authentication > Providers` e deixe `Email` habilitado.
5. Crie usuarios em `Authentication > Users`.

Este sistema permite login apenas de usuarios cadastrados. Ele nao possui tela publica de cadastro.

## Como criar as tabelas

1. No Supabase, abra `SQL Editor`.
2. Cole o conteudo de `supabase/setup_no_functions.sql`.
3. Clique em `Run`.

O SQL cria:

- `users`
- `leads`
- `proposals`
- `follow_ups`
- `message_templates`
- `whatsapp_messages`

Tambem cria indices e politicas de seguranca com Row Level Security.

Importante: use `supabase/setup_no_functions.sql` como SQL principal. Ele nao usa funcoes nem `$$`, entao evita o erro de `unterminated dollar-quoted string` no SQL Editor do Supabase.

Os arquivos em `supabase/patches` servem apenas para bancos que ja estavam criados antes de novas funcionalidades. Em uma instalacao nova, rode apenas `supabase/setup_no_functions.sql`.

Se o banco ja existe e voce nao quer rodar o setup completo de novo, rode os patches em ordem:

```text
supabase/patches/001_expand_lead_status_enum_if_needed.sql
supabase/patches/002_whatsapp_integration.sql
supabase/patches/003_google_places_capture.sql
supabase/patches/004_autonomy_fields.sql
supabase/patches/005_message_templates.sql
supabase/patches/006_whatsapp_inbox.sql
supabase/patches/007_manual_assisted_mode.sql
```

O patch `001_expand_lead_status_enum_if_needed.sql` so e necessario se aparecer erro de enum `lead_status`, como `invalid input value for enum lead_status`.

## Variaveis de ambiente

Variaveis usadas no navegador:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Variaveis usadas somente no servidor:

```env
SUPABASE_SERVICE_ROLE_KEY=
COMMUNICATION_MODE=manual
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v23.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
GOOGLE_PLACES_API_KEY=
```

Nao coloque `service_role`, token secreto do Supabase, token da Meta ou chave do Google em variaveis `NEXT_PUBLIC`.

## Como conectar o WhatsApp Business

O envio automatico pelo sistema deve usar a API oficial da Meta. Nao use automacao por navegador, QR Code ou extensoes, porque isso pode bloquear o numero.

1. Crie ou acesse um app em [Meta for Developers](https://developers.facebook.com/).
2. Adicione o produto `WhatsApp`.
3. Em `WhatsApp > API Setup`, copie:
   - `Phone number ID` para `WHATSAPP_PHONE_NUMBER_ID`.
   - um token permanente de acesso para `WHATSAPP_ACCESS_TOKEN`.
4. No `.env.local`, preencha:

```env
WHATSAPP_ACCESS_TOKEN=seu-token-da-meta
WHATSAPP_PHONE_NUMBER_ID=id-do-numero
WHATSAPP_API_VERSION=v23.0
```

5. No Supabase, execute o patch:

```text
supabase/patches/002_whatsapp_integration.sql
```

6. Reinicie o projeto local depois de alterar o `.env.local`.

Para organizar respostas automaticamente:

1. Configure o webhook no app da Meta apontando para:

```text
https://sua-url.vercel.app/api/whatsapp/webhook
```

2. Use o mesmo valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN` na Meta e na Vercel.
3. Configure `SUPABASE_SERVICE_ROLE_KEY` na Vercel para que o webhook consiga atualizar os leads com seguranca no servidor.
4. Quando uma mensagem chegar de um numero que existe em algum lead, o sistema marca esse lead como `Respondeu`.

Regras importantes:

- O lead precisa ter autorizado contato por WhatsApp.
- Para automacao, o lead tambem precisa estar marcado com `Permitir automacao de envio`.
- A automacao prioriza leads sem site, com Instagram, com WhatsApp, com nicho definido, oportunidade alta e follow-up pendente.
- Mensagens iniciadas pela empresa fora da janela de atendimento podem exigir templates aprovados pela Meta.
- O sistema guarda o token apenas no servidor e nunca no frontend.

## Como usar WhatsApp normal

O WhatsApp normal nao precisa de API. O modo recomendado sem dependencias externas e:

```env
COMMUNICATION_MODE=manual
```

No CRM, use o botao `Abrir no WhatsApp` em `Conversas`.

Esse modo:

- Abre WhatsApp Web ou o app com o numero do lead.
- Preenche a mensagem personalizada automaticamente.
- Deixa voce revisar e clicar em enviar manualmente.
- Registra no historico quando a mensagem foi preparada, aberta e confirmada como enviada.

Limites desse modo:

- Nao envia mensagens sozinho.
- Nao espelha conversas dentro do CRM.
- Nao identifica respostas automaticamente.

Voce pode adicionar a resposta manualmente na tela `Conversas`.

Para envio automatico, webhook e inbox sincronizada, use WhatsApp Business API oficial.

## Como ativar busca automatica de leads

A area `Captar leads` tem um formulario para informar nicho e regiao, por exemplo:

```text
Nicho: restaurante
Regiao: Campinas SP
```

O sistema usa a API oficial `Places API (New)` do Google. Segundo a documentacao oficial, o endpoint Text Search usa `POST https://places.googleapis.com/v1/places:searchText` e exige uma `FieldMask` para escolher quais campos retornam.

Para configurar:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie ou escolha um projeto.
3. Ative `Places API (New)`.
4. Crie uma API key.
5. Coloque no `.env.local`:

```env
GOOGLE_PLACES_API_KEY=sua-chave-do-google-cloud
```

6. No Supabase, execute:

```text
supabase/patches/003_google_places_capture.sql
```

7. Reinicie o servidor local.

Observacoes:

- A API do Google pode gerar custos conforme uso e campos solicitados.
- O sistema importa no maximo 20 resultados por busca.
- Leads duplicados sao evitados pelo `place_id` retornado pelo Google.
- Nao use scraping do Google Maps; use a API oficial.

## Como publicar na Vercel

1. Suba o projeto para um repositorio Git.
2. Entre na [Vercel](https://vercel.com).
3. Clique em `Add New > Project`.
4. Importe o repositorio.
5. Em `Environment Variables`, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_API_VERSION`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `GOOGLE_PLACES_API_KEY`
6. Clique em `Deploy`.

Depois do deploy, configure no Supabase:

1. Abra `Authentication > URL Configuration`.
2. Em `Site URL`, coloque a URL da Vercel.
3. Em `Redirect URLs`, adicione a URL da Vercel tambem.

### Se o build falhar na Vercel

Se aparecer apenas `Command "npm run build" exited with 1`, abra o deploy na Vercel e veja as linhas de erro acima dessa mensagem. Normalmente o problema e um destes:

- As variaveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nao foram cadastradas em `Settings > Environment Variables`.
- O projeto ainda nao foi enviado para o GitHub depois das ultimas alteracoes.
- O banco do Supabase ainda nao recebeu o SQL de `supabase/setup_no_functions.sql`.

Depois de corrigir, clique em `Redeploy`.

Para um passo a passo mais direto de entrega, transferencia para outro computador e hospedagem, veja `DEPLOY.md`.

## Onde ficam as partes principais

- `src/app/login/page.tsx`: tela de login.
- `src/app/(app)/page.tsx`: dashboard.
- `src/app/(app)/captar/page.tsx`: area de captacao manual.
- `src/app/(app)/conversao/page.tsx`: centro de conversao.
- `src/app/(app)/follow-ups/page.tsx`: agenda de follow-up.
- `src/app/(app)/leads/page.tsx`: cadastro e lista de leads.
- `src/app/(app)/conversas/page.tsx`: caixa de entrada do WhatsApp.
- `src/app/(app)/mensagens/page.tsx`: modelos de mensagem de primeiro contato.
- `src/app/(app)/kanban/page.tsx`: Kanban.
- `src/app/(app)/nichos/page.tsx`: segmentacao por nicho.
- `src/app/(app)/automacao/page.tsx`: automacao de envio.
- `src/app/(app)/propostas/page.tsx`: propostas.
- `src/lib/lead-ai.ts`: classificacao automatica e gerador de mensagem.
- `src/lib/opportunity-service.ts`: analise estrategica e temperatura do lead.
- `src/lib/proposal-service.ts`: geracao de texto de proposta.
- `src/lib/phone.ts`: normalizacao de telefone brasileiro e link wa.me.
- `src/lib/supabase`: clientes Supabase para browser e servidor.
- `supabase/setup_no_functions.sql`: banco de dados e seguranca.

## Observacao sobre mensagens

Sem configurar WhatsApp Business, o sistema apenas gera um texto personalizado para o usuario revisar e copiar. Com a API oficial configurada, ele permite envio manual por botao apenas para leads marcados com autorizacao de contato.

Variaveis disponiveis nos modelos de mensagem:

```text
[empresa]
[responsavel]
[nicho]
[cidade]
[site]
[instagram]
[problema]
[solucao]
[beneficio]
[mensagem_padrao]
```
