-- Execute este patch para habilitar automacao segura, respostas e segmentacao.

alter table public.leads
add column if not exists auto_message_enabled boolean not null default false;

alter table public.leads
add column if not exists response_status text not null default 'sem_resposta';

alter table public.leads
add column if not exists last_inbound_message text;

alter table public.leads
add column if not exists last_inbound_at timestamptz;

create index if not exists leads_niche_idx
on public.leads(niche);

create index if not exists leads_response_status_idx
on public.leads(response_status);
