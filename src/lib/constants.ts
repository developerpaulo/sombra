import type { LeadStatus, OpportunityLevel, ProposalStatus, ResponseStatus } from "@/types/database";

export const leadStatuses: LeadStatus[] = [
  "Novo",
  "Pesquisado",
  "Analisado",
  "Mensagem pronta",
  "Aberto no WhatsApp",
  "Enviado manualmente",
  "Aguardando resposta",
  "Respondeu",
  "Interessado",
  "Proposta enviada",
  "Fechado",
  "Sem interesse",
  "Follow-up"
];

export const proposalStatuses: ProposalStatus[] = [
  "Rascunho",
  "Enviada",
  "Aceita",
  "Recusada"
];

export const responseStatusLabels: Record<ResponseStatus, string> = {
  sem_resposta: "Sem resposta",
  respondeu: "Respondeu",
  interessado: "Interessado",
  sem_interesse: "Sem interesse"
};

export const opportunityLabels: Record<OpportunityLevel, string> = {
  high: "Alta oportunidade",
  medium: "Media oportunidade",
  low: "Baixa oportunidade"
};

export const statusColors: Record<LeadStatus, string> = {
  Novo: "bg-slate-100 text-slate-700",
  Pesquisado: "bg-blue-100 text-blue-700",
  Analisado: "bg-sky-100 text-sky-700",
  "Mensagem pronta": "bg-indigo-100 text-indigo-700",
  "Aberto no WhatsApp": "bg-cyan-100 text-cyan-700",
  "Enviado manualmente": "bg-teal-100 text-teal-700",
  "Aguardando resposta": "bg-amber-100 text-amber-700",
  Respondeu: "bg-amber-100 text-amber-700",
  Interessado: "bg-emerald-100 text-emerald-700",
  "Proposta enviada": "bg-violet-100 text-violet-700",
  Fechado: "bg-emerald-100 text-emerald-700",
  "Sem interesse": "bg-rose-100 text-rose-700",
  "Follow-up": "bg-orange-100 text-orange-700"
};
