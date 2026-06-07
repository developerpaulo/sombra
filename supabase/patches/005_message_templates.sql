-- Execute este patch para habilitar modelos de mensagem de primeiro contato.

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_templates_user_id_idx
on public.message_templates(user_id);

create unique index if not exists message_templates_one_default_idx
on public.message_templates(user_id)
where is_default = true;

alter table public.message_templates enable row level security;

drop policy if exists "Users can manage own message templates" on public.message_templates;
create policy "Users can manage own message templates"
on public.message_templates for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
