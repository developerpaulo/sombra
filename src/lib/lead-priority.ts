import type { Lead, LeadFormData } from "@/types/database";
import { todayISO } from "@/lib/utils";

type LeadPriorityInput = Pick<
  Lead,
  | "current_site"
  | "instagram"
  | "whatsapp"
  | "niche"
  | "notes"
  | "opportunity"
  | "status"
  | "response_status"
  | "last_whatsapp_sent_at"
  | "next_follow_up_date"
>;

function normalize(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasOldSiteSignal(value?: string | null) {
  const text = normalize(value);
  return text.includes("site antigo") || text.includes("site ruim") || text.includes("lento") || text.includes("desatualizado");
}

export function getLeadProblem(lead: Pick<LeadFormData, "current_site" | "instagram" | "notes">) {
  const hasSite = Boolean(lead.current_site.trim());
  const hasInstagram = Boolean(lead.instagram.trim());
  const notes = normalize(lead.notes);

  if (!hasSite && hasInstagram) return "tem Instagram, mas ainda nao tem um site para converter melhor os visitantes";
  if (!hasSite) return "ainda nao parece ter um site para apresentar servicos e receber contatos";
  if (hasOldSiteSignal(notes) || hasOldSiteSignal(lead.current_site)) return "parece ter um site que pode estar antigo, lento ou pouco claro";
  return "pode ganhar mais clientes com uma presenca online mais objetiva";
}

export function calculateLeadPriority(lead: LeadPriorityInput) {
  let score = 0;
  const reasons: string[] = [];

  if (lead.opportunity === "high") {
    score += 35;
    reasons.push("alta oportunidade");
  } else if (lead.opportunity === "medium") {
    score += 18;
    reasons.push("oportunidade media");
  }

  if (!lead.current_site) {
    score += 25;
    reasons.push("sem site");
  }

  if (lead.instagram && !lead.current_site) {
    score += 15;
    reasons.push("tem Instagram e nao tem site");
  }

  if (hasOldSiteSignal(lead.notes) || hasOldSiteSignal(lead.current_site)) {
    score += 12;
    reasons.push("sinal de site antigo ou ruim");
  }

  if (lead.whatsapp) {
    score += 10;
    reasons.push("tem WhatsApp");
  }

  if (lead.niche) {
    score += 5;
    reasons.push("nicho definido");
  }

  if (lead.status === "Novo" || lead.status === "Pesquisado" || lead.status === "Mensagem pronta") {
    score += 8;
    reasons.push("ainda nao abordado");
  }

  if (lead.next_follow_up_date && lead.next_follow_up_date <= todayISO()) {
    score += 8;
    reasons.push("follow-up pendente");
  }

  if (lead.last_whatsapp_sent_at || (lead.response_status || "sem_resposta") !== "sem_resposta") {
    score -= 20;
  }

  if (lead.status === "Sem interesse" || lead.status === "Fechado") {
    score = 0;
  }

  const normalizedScore = Math.max(0, Math.min(100, score));

  return {
    score: normalizedScore,
    label: normalizedScore >= 70 ? "Prioridade alta" : normalizedScore >= 40 ? "Prioridade media" : "Prioridade baixa",
    reasons
  };
}
