# Guia de portabilidade

Este projeto foi preparado para rodar em outra maquina ou em hospedagens diferentes sem depender do computador atual.

## Requisitos

- Node.js 20 LTS ou superior.
- npm 10 ou superior.
- Projeto Supabase configurado.
- Variaveis de ambiente preenchidas.

Se usar `nvm`, rode:

```bash
nvm use
```

## Arquivos que devem ir junto

Envie ou versiona estes itens:

- `src`
- `public`
- `supabase`
- `package.json`
- `package-lock.json`
- `.env.example`
- `.env.production.example`
- `.nvmrc`
- `.npmrc`
- `Dockerfile`
- `.dockerignore`
- `README.md`
- `DEPLOY.md`
- `PORTABILITY.md`
- `next.config.mjs`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`
- `.eslintrc.json`
- `.gitignore`

Nao envie:

- `node_modules`
- `.next`
- `.env`
- `.env.local`
- `.env.production`
- `.vercel`

## Rodar em outra maquina

1. Instale Node.js 20 LTS.
2. Copie o projeto.
3. Instale as dependencias:

```bash
npm ci
```

Se nao tiver `package-lock.json`, use:

```bash
npm install
```

4. Crie o arquivo local de ambiente:

```bash
cp .env.example .env.local
```

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

5. Preencha o `.env.local`.
6. Rode:

```bash
npm run dev
```

7. Acesse:

```text
http://localhost:3000
```

## Build de producao

Antes de hospedar, valide:

```bash
npm run typecheck
npm run build
```

Para rodar o build localmente:

```bash
npm run start
```

## Variaveis obrigatorias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COMMUNICATION_MODE=manual
```

`COMMUNICATION_MODE=manual` faz o CRM funcionar sem API do WhatsApp.

## Variaveis opcionais

Use somente quando for ativar integrações oficiais:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v23.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
GOOGLE_PLACES_API_KEY=
```

Nunca coloque chaves secretas com prefixo `NEXT_PUBLIC`.

## Banco novo no Supabase

Para um banco novo, rode apenas:

```text
supabase/setup_no_functions.sql
```

Esse arquivo cria as tabelas, indices e politicas de seguranca.

## Banco antigo no Supabase

Se o banco ja existia antes das melhorias, rode os patches em ordem.

Se aparecer erro de enum como:

```text
invalid input value for enum lead_status: "Pesquisado"
```

rode primeiro:

```text
supabase/patches/001_expand_lead_status_enum_if_needed.sql
```

Depois rode:

```text
supabase/patches/002_whatsapp_integration.sql
supabase/patches/003_google_places_capture.sql
supabase/patches/004_autonomy_fields.sql
supabase/patches/005_message_templates.sql
supabase/patches/006_whatsapp_inbox.sql
supabase/patches/007_manual_assisted_mode.sql
```

## Hospedar na Vercel

1. Suba o projeto para GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis em `Settings > Environment Variables`.
4. Use:

```text
Build Command: npm run build
Install Command: npm ci
Output: .next
```

5. Faça deploy.

## Hospedar com Docker

O projeto ja tem `Dockerfile` e `next.config.mjs` com `output: "standalone"`.

Build:

```bash
docker build -t crm-sites-leads .
```

Rodar:

```bash
docker run -p 3000:3000 --env-file .env.production crm-sites-leads
```

## Hospedar em VPS ou servidor Node

1. Copie o projeto para o servidor.
2. Rode:

```bash
npm ci
npm run build
npm run start
```

3. Configure as variaveis de ambiente no servidor.
4. Use um proxy como Nginx ou Caddy apontando para a porta `3000`.

## Checklist final

- Supabase configurado.
- SQL executado.
- Usuario criado em `Authentication > Users`.
- `.env.local` ou variaveis da hospedagem preenchidas.
- `COMMUNICATION_MODE=manual` se nao usar API da Meta.
- `npm run typecheck` sem erros.
- `npm run build` sem erros.
- Login testado.
- Dashboard, Captar, Conversas, Leads, Kanban e Propostas abrindo.
