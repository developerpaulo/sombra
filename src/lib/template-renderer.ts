import { generateWhatsAppMessage } from "@/lib/lead-ai";
import type { Lead, LeadFormData } from "@/types/database";

export const smartTemplateVariables = ["{{nome}}", "{{empresa}}", "{{nicho}}", "{{cidade}}", "{{telefone}}", "{{servico}}"];

type TemplateLead = Pick<Lead | LeadFormData, "company_name" | "contact_name" | "niche" | "city" | "whatsapp" | "current_site" | "instagram" | "notes">;

export function renderSmartTemplate(template: string, lead: TemplateLead, service = "sites profissionais para negocios locais") {
  const fallback = generateWhatsAppMessage({
    company_name: lead.company_name,
    niche: lead.niche || "",
    current_site: lead.current_site || "",
    instagram: lead.instagram || "",
    notes: lead.notes || ""
  });

  const values: Record<string, string> = {
    "{{nome}}": lead.contact_name || lead.company_name,
    "{{empresa}}": lead.company_name,
    "{{nicho}}": lead.niche || "negocio local",
    "{{cidade}}": lead.city || "sua regiao",
    "{{telefone}}": lead.whatsapp || "",
    "{{servico}}": service
  };

  const rendered = Object.entries(values).reduce((content, [key, value]) => content.replaceAll(key, value), template || fallback);

  return rendered.trim();
}

