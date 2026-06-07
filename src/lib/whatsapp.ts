import { onlyDigits } from "@/lib/phone";

type SendTextMessageInput = {
  to: string;
  message: string;
};

type WhatsAppApiResult = {
  messages?: Array<{ id?: string }>;
  error?: {
    message?: string;
  } | string;
};

export function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v23.0",
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  };
}

export { onlyDigits } from "@/lib/phone";

export function isWhatsAppConfigured() {
  const config = getWhatsAppConfig();
  return Boolean(config.accessToken && config.phoneNumberId);
}

export function getWhatsAppErrorMessage(data: WhatsAppApiResult) {
  if (typeof data.error === "string") return data.error;
  return data.error?.message || "Nao foi possivel enviar pelo WhatsApp.";
}

async function readJson(response: Response): Promise<WhatsAppApiResult> {
  try {
    return (await response.json()) as WhatsAppApiResult;
  } catch {
    return {};
  }
}

export async function sendWhatsAppTextMessage({ to, message }: SendTextMessageInput) {
  const config = getWhatsAppConfig();

  if (!config.accessToken || !config.phoneNumberId) {
    const data: WhatsAppApiResult = {
      error: "Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no servidor."
    };

    return {
      ok: false,
      status: 500,
      data
    };
  }

  const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: onlyDigits(to),
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const data = await readJson(response);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
