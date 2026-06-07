export type LeadStatus =
  | "Novo"
  | "Pesquisado"
  | "Analisado"
  | "Mensagem pronta"
  | "Aberto no WhatsApp"
  | "Enviado manualmente"
  | "Aguardando resposta"
  | "Respondeu"
  | "Interessado"
  | "Proposta enviada"
  | "Fechado"
  | "Sem interesse"
  | "Follow-up";

export type OpportunityLevel = "high" | "medium" | "low";

export type ProposalStatus = "Rascunho" | "Enviada" | "Aceita" | "Recusada";

export type ResponseStatus = "sem_resposta" | "respondeu" | "interessado" | "sem_interesse";

export type CommunicationMode = "manual" | "api";

export type WhatsAppMessageDirection = "inbound" | "outbound" | "system";

export type MessageEventType =
  | "prepared"
  | "opened_whatsapp"
  | "manual_sent"
  | "manual_response"
  | "api_sent"
  | "api_received"
  | "follow_up_scheduled"
  | "lead_interested"
  | "lead_not_interested";

export type WhatsAppMessage = {
  id: string;
  user_id: string | null;
  lead_id: string | null;
  phone: string;
  direction: WhatsAppMessageDirection;
  event_type: MessageEventType;
  communication_mode: CommunicationMode;
  body: string;
  provider_message_id: string | null;
  created_at: string;
};

export type MessageTemplate = {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  niche: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  current_site: string | null;
  notes: string | null;
  whatsapp_opt_in: boolean;
  auto_message_enabled: boolean;
  response_status: ResponseStatus;
  status: LeadStatus;
  opportunity: OpportunityLevel;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  generated_message: string | null;
  last_whatsapp_sent_at: string | null;
  last_inbound_message: string | null;
  last_inbound_at: string | null;
  external_source: string | null;
  external_id: string | null;
  source_url: string | null;
  opportunity_score: number;
  signal_no_site: boolean;
  signal_old_site: boolean;
  signal_slow_site: boolean;
  signal_not_responsive: boolean;
  signal_no_https: boolean;
  signal_only_instagram: boolean;
  signal_has_whatsapp: boolean;
  signal_good_presence: boolean;
  signal_weak_presence: boolean;
  signal_good_reviews: boolean;
  signal_competitive_region: boolean;
  signal_good_client: boolean;
  signal_high_closing_chance: boolean;
  created_at: string;
  updated_at: string;
};

export type Proposal = {
  id: string;
  user_id: string;
  lead_id: string;
  amount: number;
  service_offered: string;
  deadline: string | null;
  scope: string | null;
  benefits: string | null;
  conditions: string | null;
  status: ProposalStatus;
  notes: string | null;
  created_at: string;
  leads?: Pick<Lead, "company_name"> | null;
};

export type FollowUp = {
  id: string;
  user_id: string;
  lead_id: string;
  due_date: string;
  note: string | null;
  completed: boolean;
  created_at: string;
};

export type LeadFormData = {
  company_name: string;
  contact_name: string;
  niche: string;
  city: string;
  state?: string;
  whatsapp: string;
  email?: string;
  instagram: string;
  current_site: string;
  notes: string;
  whatsapp_opt_in: boolean;
  auto_message_enabled: boolean;
  status: LeadStatus;
  last_contact_date: string;
  next_follow_up_date: string;
  signal_no_site?: boolean;
  signal_old_site?: boolean;
  signal_slow_site?: boolean;
  signal_not_responsive?: boolean;
  signal_no_https?: boolean;
  signal_only_instagram?: boolean;
  signal_has_whatsapp?: boolean;
  signal_good_presence?: boolean;
  signal_weak_presence?: boolean;
  signal_good_reviews?: boolean;
  signal_competitive_region?: boolean;
  signal_good_client?: boolean;
  signal_high_closing_chance?: boolean;
};
