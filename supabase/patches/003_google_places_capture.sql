-- Execute este patch para habilitar importacao de leads por API externa.

alter table public.leads
add column if not exists external_source text;

alter table public.leads
add column if not exists external_id text;

alter table public.leads
add column if not exists source_url text;

create index if not exists leads_external_source_id_idx
on public.leads(external_source, external_id);

drop index if exists public.leads_user_external_unique_idx;

create unique index if not exists leads_user_external_unique_idx
on public.leads(user_id, external_source, external_id);
