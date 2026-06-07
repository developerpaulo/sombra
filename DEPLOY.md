# Guia rapido de entrega e hospedagem

Use este arquivo quando for levar o projeto para outro computador ou publicar na Vercel.

## 1. O que enviar

Envie estes arquivos e pastas:

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
- `.env.local`
- `.env`
- `.vercel`

## 2. Rodar em outro computador

Instale Node.js 20 LTS e rode:

```bash
npm ci
```

Copie o exemplo de ambiente:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha o `.env.local` e rode:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## 3. Banco Supabase

No Supabase, abra `SQL Editor`, cole o conteudo de:

```text
supabase/setup_no_functions.sql
```

Depois clique em `Run`.

Esse arquivo cria as tabelas, indices e politicas de seguranca.

Se o banco ja existia antes das melhorias do modo Manual Assistido, rode tambem:

Se aparecer erro de enum como `invalid input value for enum lead_status`, rode primeiro:

```text
supabase/patches/001_expand_lead_status_enum_if_needed.sql
```

Depois rode:

```text
supabase/patches/007_manual_assisted_mode.sql
```

## 4. Variaveis para Vercel

Na Vercel, abra:

```text
Project > Settings > Environment Variables
```

Obrigatorias:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
COMMUNICATION_MODE=manual
```

Opcionais:

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=v23.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
GOOGLE_PLACES_API_KEY=
```

Use `COMMUNICATION_MODE=manual` para o CRM funcionar sem WhatsApp Business API. Troque para `COMMUNICATION_MODE=api` apenas quando a Meta estiver configurada.

## 5. WhatsApp

WhatsApp normal:

- Ja funciona sem API.
- Use o botao `Abrir no WhatsApp`.
- O sistema abre a conversa com a mensagem pronta.
- Voce revisa e envia manualmente.
- Depois confirme `Marcar como enviado` no CRM.

WhatsApp Business API:

- Exige conta/app na Meta.
- Use para envio pelo sistema, webhook e inbox sincronizada.
- Configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

Webhook depois do deploy:

```text
https://sua-url.vercel.app/api/whatsapp/webhook
```

## 6. Google Places

Para captar leads por nicho e regiao:

- Ative `Places API (New)` no Google Cloud.
- Crie uma API key.
- Configure `GOOGLE_PLACES_API_KEY`.

## 7. Antes de publicar

Rode:

```bash
npm run typecheck
npm run build
```

Se o build falhar na Vercel, abra o log e copie as linhas acima de:

```text
Command "npm run build" exited with 1
```

## 8. Hospedagem fora da Vercel

O projeto tambem esta preparado para Docker, VPS, Render, Railway e outros hosts Node.

Leia:

```text
PORTABILITY.md
```

Resumo com Docker:

```bash
docker build -t crm-sites-leads .
docker run -p 3000:3000 --env-file .env.production crm-sites-leads
```
