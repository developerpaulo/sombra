import { generateOpportunityAnalysis } from "@/lib/opportunity-service";
import { renderSmartTemplate } from "@/lib/template-renderer";
import type { Lead, LeadFormData, MessageTemplate } from "@/types/database";

type MessageLead = Lead | (LeadFormData & { opportunity_score?: number | null });

const fallbackTemplates: Record<string, string> = {
  abordagem:
    "Ola {{nome}}, tudo bem? Vi que a {{empresa}} trabalha com {{nicho}} em {{cidade}}. Notei uma oportunidade de melhorar sua presenca online e facilitar o contato de clientes pelo WhatsApp. Posso te mostrar uma ideia simples?",
  followup:
    "Oi {{nome}}, tudo bem? Passando para saber se faz sentido eu te mostrar uma ideia rapida de {{servico}} para a {{empresa}}.",
  proposta:
    "Ola {{nome}}, preparei uma sugestao inicial para a {{empresa}} melhorar presenca online e receber mais contatos. Posso te mandar a proposta?",
  objecao:
    "Entendo. O Instagram ajuda bastante, mas um site profissional passa mais confianca, aparece no Google e organiza servicos, localizacao e WhatsApp em um so lugar.",
  reativacao:
    "Oi {{nome}}, tudo bem? Retomando nosso contato: ainda faz sentido avaliar uma presenca online melhor para a {{empresa}}?"
};

export function generateMessageFromTemplate({
  lead,
  template,
  service,
  type
}: {
  lead: MessageLead;
  template?: MessageTemplate;
  service: string;
  type: keyof typeof fallbackTemplates;
}) {
  const base = template?.content || fallbackTemplates[type] || fallbackTemplates.abordagem;
  const rendered = renderSmartTemplate(base, lead, service);
  const analysis = "id" in lead ? generateOpportunityAnalysis(lead as Lead) : null;

  return rendered
    .replaceAll("{{estado}}", lead.state || "")
    .replaceAll("{{site}}", lead.current_site || "")
    .replaceAll("{{instagram}}", lead.instagram || "")
    .replaceAll("{{score}}", String(("opportunity_score" in lead && lead.opportunity_score) || 0))
    .replaceAll("{{problema_principal}}", analysis?.mainProblem || "melhorar a presenca online");
}

