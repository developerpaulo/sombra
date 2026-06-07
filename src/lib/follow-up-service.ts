import { todayISO } from "@/lib/utils";
import type { Lead } from "@/types/database";

export function followUpBucket(lead: Lead) {
  if (!lead.next_follow_up_date) return "sem_data";
  const today = todayISO();
  if (lead.next_follow_up_date < today) return "atrasado";
  if (lead.next_follow_up_date === today) return "hoje";

  const limit = new Date();
  limit.setDate(limit.getDate() + 7);
  const limitIso = limit.toISOString().slice(0, 10);
  if (lead.next_follow_up_date <= limitIso) return "proximos_7";
  return "futuro";
}
