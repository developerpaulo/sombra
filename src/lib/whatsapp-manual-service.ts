import { buildWhatsAppUrl, normalizeBrazilianPhone } from "@/lib/phone";

export function createManualWhatsAppLink(phone: string, message: string) {
  const normalized = normalizeBrazilianPhone(phone);
  if (!normalized.ok) {
    return { ok: false as const, error: normalized.error || "WhatsApp invalido." };
  }

  return {
    ok: true as const,
    phone: normalized.phone,
    url: buildWhatsAppUrl(normalized.phone, message) || ""
  };
}
