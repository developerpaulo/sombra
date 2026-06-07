import type { LeadFormData, OpportunityLevel } from "@/types/database";
import { getLeadProblem } from "@/lib/lead-priority";

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function classifyLead(lead: Pick<LeadFormData, "current_site" | "instagram" | "notes">): OpportunityLevel {
  const site = normalizeText(lead.current_site);
  const notes = normalizeText(lead.notes);
  const hasNoSiteText = site.includes("sem site") || site.includes("nao tem");

  if (!site || hasNoSiteText) return "high";
  if (notes.includes("site antigo") || notes.includes("site ruim") || notes.includes("lento") || site.includes("antigo") || site.includes("ruim")) return "medium";
  if (notes.includes("site bom") || notes.includes("moderno") || site.includes("bom")) return "low";

  return "medium";
}

export function generateWhatsAppMessage(lead: Pick<LeadFormData, "company_name" | "niche" | "current_site" | "instagram" | "notes">) {
  const company = lead.company_name.trim();
  const niche = lead.niche.trim() || "negocios locais";
  const hasSite = Boolean(lead.current_site.trim());
  const hasInstagram = Boolean(lead.instagram.trim());
  const notes = normalizeText(lead.notes);

  let problem = "poderiam ganhar mais clientes com um site profissional simples, rapido e com botao direto para o WhatsApp";

  if (!hasSite && hasInstagram) {
    problem = "ja tem presenca no Instagram, mas poderiam converter melhor esses visitantes com um site simples e profissional";
  } else if (!hasSite) {
    problem = "ainda nao parecem ter um site para apresentar servicos, fotos e um botao direto para WhatsApp";
  } else if (notes.includes("antigo") || notes.includes("ruim") || notes.includes("lento")) {
    problem = "poderiam melhorar a primeira impressao com um site mais moderno, rapido e facil de acessar pelo celular";
  }

  return `Ola, tudo bem? Vi o perfil da ${company} e percebi que voces, como ${niche}, ${problem}. Eu desenvolvo sites para negocios como o seu. Posso te mostrar uma ideia?`;
}

export function renderMessageTemplate(
  template: string,
  lead: Pick<LeadFormData, "company_name" | "contact_name" | "niche" | "city" | "current_site" | "instagram" | "notes">
) {
  const fallbackMessage = generateWhatsAppMessage(lead);
  const problem = getLeadProblem(lead);
  const values: Record<string, string> = {
    empresa: lead.company_name.trim(),
    responsavel: lead.contact_name.trim(),
    nicho: lead.niche.trim() || "negocios locais",
    cidade: lead.city.trim(),
    site: lead.current_site.trim() || "sem site",
    instagram: lead.instagram.trim(),
    problema: problem,
    solucao: "um site profissional simples, rapido e com botao direto para o WhatsApp",
    beneficio: "atrair mais clientes e facilitar o primeiro contato",
    mensagem_padrao: fallbackMessage
  };

  return template.replace(/\[([a-z_]+)\]/gi, (_, key: string) => values[key.toLowerCase()] || "");
}
