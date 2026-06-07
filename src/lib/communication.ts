import { buildWhatsAppUrl, normalizeBrazilianPhone } from "@/lib/phone";
import { isWhatsAppConfigured, sendWhatsAppTextMessage } from "@/lib/whatsapp";
import type { CommunicationMode } from "@/types/database";

export type CommunicationProviderResult = {
  ok: boolean;
  mode: CommunicationMode;
  whatsappUrl?: string;
  providerMessageId?: string | null;
  error?: string;
};

export function getCommunicationMode(): CommunicationMode {
  return process.env.COMMUNICATION_MODE === "api" ? "api" : "manual";
}

export async function sendMessageProvider({ phone, message }: { phone: string; message: string }): Promise<CommunicationProviderResult> {
  const mode = getCommunicationMode();
  const normalized = normalizeBrazilianPhone(phone);

  if (!normalized.ok) {
    return { ok: false, mode, error: normalized.error };
  }

  if (mode === "api" && isWhatsAppConfigured()) {
    const sent = await sendWhatsAppTextMessage({ to: normalized.phone, message });
    return {
      ok: sent.ok,
      mode: "api",
      providerMessageId: sent.data?.messages?.[0]?.id || null,
      error: sent.ok ? undefined : typeof sent.data.error === "string" ? sent.data.error : sent.data.error?.message
    };
  }

  const whatsappUrl = buildWhatsAppUrl(normalized.phone, message);
  return {
    ok: Boolean(whatsappUrl),
    mode: "manual",
    whatsappUrl: whatsappUrl || undefined
  };
}
