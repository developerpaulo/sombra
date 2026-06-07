-- Setup sem funcoes e sem dollar quotes ($$).
-- Use este arquivo se o SQL Editor do Supabase estiver inserindo blocos no meio das funcoes.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  niche text,
  city text,
  state text,
  whatsapp text,
  email text,
  instagram text,
  current_site text,
  notes text,
  whatsapp_opt_in boolean not null default false,
  auto_message_enabled boolean not null default false,
  response_status text not null default 'sem_resposta' check (response_status in ('sem_resposta', 'respondeu', 'interessado', 'sem_interesse')),
  status text not null default 'Novo' check (
    status in (
      'Novo',
      'Pesquisado',
      'Analisado',
      'Mensagem pronta',
      'Aberto no WhatsApp',
      'Enviado manualmente',
      'Aguardando resposta',
      'Respondeu',
      'Interessado',
      'Proposta enviada',
      'Fechado',
      'Sem interesse',
      'Follow-up'
    )
  ),
  opportunity text not null default 'medium' check (opportunity in ('high', 'medium', 'low')),
  last_contact_date date,
  next_follow_up_date date,
  generated_message text,
  last_whatsapp_sent_at timestamptz,
  last_inbound_message text,
  last_inbound_at timestamptz,
  external_source text,
  external_id text,
  source_url text,
  opportunity_score integer not null default 50,
  signal_no_site boolean not null default false,
  signal_old_site boolean not null default false,
  signal_slow_site boolean not null default false,
  signal_not_responsive boolean not null default false,
  signal_no_https boolean not null default false,
  signal_only_instagram boolean not null default false,
  signal_has_whatsapp boolean not null default false,
  signal_good_presence boolean not null default false,
  signal_weak_presence boolean not null default false,
  signal_good_reviews boolean not null default false,
  signal_competitive_region boolean not null default false,
  signal_good_client boolean not null default false,
  signal_high_closing_chance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists whatsapp_opt_in boolean not null default false;
alter table public.leads add column if not exists auto_message_enabled boolean not null default false;
alter table public.leads add column if not exists response_status text not null default 'sem_resposta';
alter table public.leads add column if not exists last_whatsapp_sent_at timestamptz;
alter table public.leads add column if not exists last_inbound_message text;
alter table public.leads add column if not exists last_inbound_at timestamptz;
alter table public.leads add column if not exists external_source text;
alter table public.leads add column if not exists external_id text;
alter table public.leads add column if not exists source_url text;
alter table public.leads add column if not exists state text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists opportunity_score integer not null default 50;
alter table public.leads add column if not exists signal_no_site boolean not null default false;
alter table public.leads add column if not exists signal_old_site boolean not null default false;
alter table public.leads add column if not exists signal_slow_site boolean not null default false;
alter table public.leads add column if not exists signal_not_responsive boolean not null default false;
alter table public.leads add column if not exists signal_no_https boolean not null default false;
alter table public.leads add column if not exists signal_only_instagram boolean not null default false;
alter table public.leads add column if not exists signal_has_whatsapp boolean not null default false;
alter table public.leads add column if not exists signal_good_presence boolean not null default false;
alter table public.leads add column if not exists signal_weak_presence boolean not null default false;
alter table public.leads add column if not exists signal_good_reviews boolean not null default false;
alter table public.leads add column if not exists signal_competitive_region boolean not null default false;
alter table public.leads add column if not exists signal_good_client boolean not null default false;
alter table public.leads add column if not exists signal_high_closing_chance boolean not null default false;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (
  status in (
    'Novo',
    'Pesquisado',
    'Analisado',
    'Mensagem pronta',
    'Aberto no WhatsApp',
    'Enviado manualmente',
    'Aguardando resposta',
    'Respondeu',
    'Interessado',
    'Proposta enviada',
    'Fechado',
    'Sem interesse',
    'Follow-up'
  )
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  amount numeric(12, 2) not null,
  service_offered text not null,
  deadline text,
  scope text,
  benefits text,
  conditions text,
  status text not null default 'Enviada' check (status in ('Rascunho', 'Enviada', 'Aceita', 'Recusada')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.proposals add column if not exists deadline text;
alter table public.proposals add column if not exists scope text;
alter table public.proposals add column if not exists benefits text;
alter table public.proposals add column if not exists conditions text;

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  due_date date not null,
  note text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  phone text not null,
  direction text not null check (direction in ('inbound', 'outbound', 'system')),
  event_type text not null default 'api_sent' check (
    event_type in (
      'prepared',
      'opened_whatsapp',
      'manual_sent',
      'manual_response',
      'api_sent',
      'api_received',
      'follow_up_scheduled',
      'lead_interested',
      'lead_not_interested'
    )
  ),
  communication_mode text not null default 'manual' check (communication_mode in ('manual', 'api')),
  body text not null,
  provider_message_id text,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_messages add column if not exists event_type text not null default 'api_sent';
alter table public.whatsapp_messages add column if not exists communication_mode text not null default 'manual';
alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_direction_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_direction_check check (direction in ('inbound', 'outbound', 'system'));

insert into public.users (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
on conflict (id) do nothing;

delete from public.follow_ups a
using public.follow_ups b
where a.ctid < b.ctid
  and a.lead_id = b.lead_id
  and a.due_date = b.due_date;

create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_niche_idx on public.leads(niche);
create index if not exists leads_response_status_idx on public.leads(response_status);
create index if not exists leads_next_follow_up_date_idx on public.leads(next_follow_up_date);
create index if not exists leads_external_source_id_idx on public.leads(external_source, external_id);
create index if not exists proposals_user_id_idx on public.proposals(user_id);
create index if not exists follow_ups_user_id_due_date_idx on public.follow_ups(user_id, due_date);
create index if not exists message_templates_user_id_idx on public.message_templates(user_id);
create index if not exists whatsapp_messages_user_id_created_at_idx on public.whatsapp_messages(user_id, created_at desc);
create index if not exists whatsapp_messages_lead_id_created_at_idx on public.whatsapp_messages(lead_id, created_at desc);
create index if not exists whatsapp_messages_phone_idx on public.whatsapp_messages(phone);
create unique index if not exists follow_ups_lead_due_date_unique_idx on public.follow_ups(lead_id, due_date);
create unique index if not exists message_templates_one_default_idx
on public.message_templates(user_id)
where is_default = true;
create unique index if not exists leads_user_external_unique_idx
on public.leads(user_id, external_source, external_id);

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.proposals enable row level security;
alter table public.follow_ups enable row level security;
alter table public.message_templates enable row level security;
alter table public.whatsapp_messages enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can manage own leads" on public.leads;
create policy "Users can manage own leads"
on public.leads for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own proposals" on public.proposals;
create policy "Users can manage own proposals"
on public.proposals for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own follow ups" on public.follow_ups;
create policy "Users can manage own follow ups"
on public.follow_ups for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own message templates" on public.message_templates;
create policy "Users can manage own message templates"
on public.message_templates for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own whatsapp messages" on public.whatsapp_messages;
create policy "Users can manage own whatsapp messages"
on public.whatsapp_messages for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
