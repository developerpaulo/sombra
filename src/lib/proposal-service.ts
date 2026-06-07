import type { Lead } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

export type ProposalDraft = {
  service: string;
  amount: number;
  deadline: string;
  scope: string;
  benefits: string;
  conditions: string;
};

export function generateProposalText(lead: Pick<Lead, "company_name" | "niche" | "city">, draft: ProposalDraft) {
  return [
    `Proposta comercial para ${lead.company_name}`,
    "",
    `Servico: ${draft.service}`,
    `Valor: ${formatCurrency(draft.amount || 0)}`,
    `Prazo: ${draft.deadline}`,
    "",
    "Escopo:",
    draft.scope,
    "",
    "Beneficios:",
    draft.benefits,
    "",
    "Condicoes:",
    draft.conditions,
    "",
    `Objetivo: criar uma presenca digital profissional para ${lead.niche || "o negocio"} em ${lead.city || "sua regiao"}, com foco em gerar contatos pelo WhatsApp e passar mais confianca.`
  ].join("\n");
}

