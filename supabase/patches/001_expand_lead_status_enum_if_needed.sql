-- Use este patch somente se seu banco antigo tiver a coluna leads.status como enum lead_status.
-- Sintoma comum:
-- ERROR: invalid input value for enum lead_status: "Pesquisado"

alter type public.lead_status add value if not exists 'Pesquisado';
alter type public.lead_status add value if not exists 'Aberto no WhatsApp';
alter type public.lead_status add value if not exists 'Enviado manualmente';
alter type public.lead_status add value if not exists 'Aguardando resposta';
alter type public.lead_status add value if not exists 'Interessado';
alter type public.lead_status add value if not exists 'Sem interesse';
alter type public.lead_status add value if not exists 'Follow-up';
