import { buildWhatsAppUrl, onlyDigits } from "@/lib/phone";

export { onlyDigits };

export function buildWhatsAppClickToChatUrl(phone: string, message: string) {
  return buildWhatsAppUrl(phone, message) || "";
}
