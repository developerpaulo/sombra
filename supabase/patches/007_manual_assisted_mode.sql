-- Execute este patch em bancos existentes para habilitar o modo Manual Assistido.

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

update public.leads set status = 'Pesquisado' where status = 'Analisado';
update public.leads set status = 'Aguardando resposta' where status = 'Contato feito';
update public.leads set status = 'Sem interesse' where status = 'Perdido';

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

alter table public.whatsapp_messages add column if not exists event_type text not null default 'api_sent';
alter table public.whatsapp_messages add column if not exists communication_mode text not null default 'manual';

alter table public.proposals add column if not exists deadline text;
alter table public.proposals add column if not exists scope text;
alter table public.proposals add column if not exists benefits text;
alter table public.proposals add column if not exists conditions text;

alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_direction_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_direction_check check (direction in ('inbound', 'outbound', 'system'));

alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_event_type_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_event_type_check check (
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
);

alter table public.whatsapp_messages drop constraint if exists whatsapp_messages_communication_mode_check;
alter table public.whatsapp_messages add constraint whatsapp_messages_communication_mode_check check (communication_mode in ('manual', 'api'));
