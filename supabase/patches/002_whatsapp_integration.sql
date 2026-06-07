-- Execute este patch para habilitar os campos da integracao oficial com WhatsApp.

alter table public.leads
add column if not exists whatsapp_opt_in boolean not null default false;

alter table public.leads
add column if not exists last_whatsapp_sent_at timestamptz;
