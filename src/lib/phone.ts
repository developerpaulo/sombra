export type PhoneValidation = {
  ok: boolean;
  phone: string;
  error?: string;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeBrazilianPhone(value?: string | null): PhoneValidation {
  const digits = onlyDigits(value || "");

  if (!digits) {
    return { ok: false, phone: "", error: "Informe um numero de WhatsApp." };
  }

  const withoutLeadingZeros = digits.replace(/^0+/, "");
  const withDdi = withoutLeadingZeros.startsWith("55") ? withoutLeadingZeros : `55${withoutLeadingZeros}`;

  if (withDdi.length < 12 || withDdi.length > 13) {
    return {
      ok: false,
      phone: withDdi,
      error: "WhatsApp invalido. Use DDI + DDD + numero, por exemplo 5511999999999."
    };
  }

  return { ok: true, phone: withDdi };
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalized = normalizeBrazilianPhone(phone);
  if (!normalized.ok) return null;
  return `https://wa.me/${normalized.phone}?text=${encodeURIComponent(message.trim())}`;
}

