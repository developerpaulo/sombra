import type { Lead } from "@/types/database";

export type Temperature = "Frio" | "Morno" | "Quente";

export function getTemperature(score?: number | null): Temperature {
  const value = score ?? 0;
  if (value >= 70) return "Quente";
  if (value >= 40) return "Morno";
  return "Frio";
}

export function temperatureClasses(score?: number | null) {
  const temperature = getTemperature(score);
  if (temperature === "Quente") return "bg-rose-100 text-rose-700";
  if (temperature === "Morno") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

export function temperatureIcon(score?: number | null) {
  const temperature = getTemperature(score);
  if (temperature === "Quente") return "🔥";
  if (temperature === "Morno") return "🟡";
  return "🔵";
}

export function getOpportunityReasons(lead: Lead) {
  const reasons = [];
  if (lead.signal_no_site || !lead.current_site) reasons.push("Nao possui site profissional");
  if (lead.signal_old_site) reasons.push("Site parece antigo");
  if (lead.signal_slow_site) reasons.push("Site parece lento");
  if (lead.signal_not_responsive) reasons.push("Site pode nao funcionar bem no celular");
  if (lead.signal_no_https) reasons.push("Site sem HTTPS ou baixa confianca");
  if (lead.signal_only_instagram || (lead.instagram && !lead.current_site)) reasons.push("Depende muito do Instagram");
  if (lead.signal_has_whatsapp || lead.whatsapp) reasons.push("Tem WhatsApp visivel para conversao");
  if (lead.signal_weak_presence) reasons.push("Presenca digital fraca");
  if (lead.signal_good_reviews) reasons.push("Boa avaliacao online pode acelerar decisao");
  if (lead.signal_competitive_region) reasons.push("Regiao competitiva exige presenca melhor");
  if (lead.signal_good_client) reasons.push("Parece bom perfil de cliente");
  if (lead.signal_high_closing_chance) reasons.push("Alta chance de fechamento");
  return reasons;
}

export function generateOpportunityAnalysis(lead: Lead) {
  const reasons = getOpportunityReasons(lead);
  const score = lead.opportunity_score ?? 0;
  const temperature = getTemperature(score);
  const chance = Math.min(96, Math.max(18, score + (lead.whatsapp ? 5 : 0) + (lead.niche ? 4 : 0)));
  const mainProblem = reasons[0] || "O lead precisa de uma presenca digital mais clara e confiavel";
  const approach =
    temperature === "Quente"
      ? "Abordar com uma proposta direta sobre captacao de clientes locais, Google e WhatsApp."
      : temperature === "Morno"
        ? "Abordar de forma consultiva, mostrando uma melhoria simples e de baixo risco."
        : "Comecar com uma conversa leve para validar interesse antes de falar de proposta.";

  return {
    reasons,
    score,
    temperature,
    chance,
    mainProblem,
    approach,
    summary: `${lead.company_name} esta como ${temperature.toLowerCase()} (${score}/100). ${mainProblem}.`
  };
}
