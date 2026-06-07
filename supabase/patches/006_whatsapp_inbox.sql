-- Execute este patch para habilitar a caixa de entrada de conversas do WhatsApp.

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_user_id_created_at_idx
on public.whatsapp_messages(user_id, created_at desc);

create index if not exists whatsapp_messages_lead_id_created_at_idx
on public.whatsapp_messages(lead_id, created_at desc);

create index if not exists whatsapp_messages_phone_idx
on public.whatsapp_messages(phone);

alter table public.whatsapp_messages enable row level security;

drop policy if exists "Users can manage own whatsapp messages" on public.whatsapp_messages;
create policy "Users can manage own whatsapp messages"
on public.whatsapp_messages for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
