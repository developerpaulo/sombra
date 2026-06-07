import type { LeadFormData, OpportunityLevel } from "@/types/database";

export function calculateOpportunityScore(lead: Pick<LeadFormData, "signal_no_site" | "signal_old_site" | "signal_slow_site" | "signal_not_responsive" | "signal_no_https" | "signal_only_instagram" | "signal_has_whatsapp" | "signal_good_presence" | "signal_weak_presence" | "signal_good_reviews" | "signal_competitive_region" | "signal_good_client" | "signal_high_closing_chance" | "current_site" | "instagram" | "whatsapp">) {
  let score = 20;

  if (lead.signal_no_site || !lead.current_site) score += 25;
  if (lead.signal_old_site) score += 20;
  if (lead.signal_slow_site) score += 10;
  if (lead.signal_not_responsive) score += 15;
  if (lead.signal_no_https) score += 8;
  if (lead.signal_only_instagram || (lead.instagram && !lead.current_site)) score += 15;
  if (lead.signal_has_whatsapp || lead.whatsapp) score += 10;
  if (lead.signal_weak_presence) score += 12;
  if (lead.signal_good_reviews) score += 10;
  if (lead.signal_competitive_region) score += 10;
  if (lead.signal_good_client) score += 15;
  if (lead.signal_high_closing_chance) score += 20;
  if (lead.signal_good_presence && lead.current_site) score -= 12;

  return Math.min(100, Math.max(0, score));
}

export function scoreToOpportunity(score: number): OpportunityLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
