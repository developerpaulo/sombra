import { NextResponse } from "next/server";
import { addDaysISO, todayISO } from "@/lib/utils";
import { buildWhatsAppUrl, normalizeBrazilianPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus, MessageEventType, ResponseStatus, WhatsAppMessageDirection } from "@/types/database";

type ManualAction = "prepare" | "open_whatsapp" | "confirm_sent" | "manual_response" | "follow_up" | "mark_interested" | "mark_not_interested";

type ManualBody = {
  leadId?: string;
  message?: string;
  action?: ManualAction;
  followUpDays?: number;
  followUpDate?: string;
};

type ManualEventMeta = {
  eventType: MessageEventType;
  direction: WhatsAppMessageDirection;
  status?: LeadStatus;
  responseStatus?: ResponseStatus;
};

function eventMeta(action: ManualAction): {
  eventType: MessageEventType;
  direction: WhatsAppMessageDirection;
  status?: LeadStatus;
  responseStatus?: ResponseStatus;
} {
  const map: Record<ManualAction, ManualEventMeta> = {
    prepare: { eventType: "prepared", direction: "system", status: "Mensagem pronta" },
    open_whatsapp: { eventType: "opened_whatsapp", direction: "system", status: "Aberto no WhatsApp" },
    confirm_sent: { eventType: "manual_sent", direction: "outbound", status: "Aguardando resposta", responseStatus: "sem_resposta" },
    manual_response: { eventType: "manual_response", direction: "inbound", status: "Respondeu", responseStatus: "respondeu" },
    follow_up: { eventType: "follow_up_scheduled", direction: "system", status: "Follow-up" },
    mark_interested: { eventType: "lead_interested", direction: "system", status: "Interessado", responseStatus: "interessado" },
    mark_not_interested: { eventType: "lead_not_interested", direction: "system", status: "Sem interesse", responseStatus: "sem_interesse" }
  };

  return map[action];
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 });
  }

  const body = (await request.json()) as ManualBody;
  if (!body.leadId || !body.action) {
    return NextResponse.json({ error: "Lead e acao sao obrigatorios." }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, user_id, company_name, whatsapp, status, response_status")
    .eq("id", body.leadId)
    .eq("user_id", user.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead nao encontrado." }, { status: 404 });
  }

  const meta = eventMeta(body.action);
  const phone = normalizeBrazilianPhone(lead.whatsapp || "");
  const message = body.message?.trim() || "";

  if ((body.action === "prepare" || body.action === "open_whatsapp" || body.action === "confirm_sent") && !message) {
    return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
  }

  if (body.action === "open_whatsapp" && !phone.ok) {
    return NextResponse.json({ error: phone.error }, { status: 400 });
  }

  const whatsappUrl = body.action === "open_whatsapp" ? buildWhatsAppUrl(lead.whatsapp || "", message) : null;
  if (body.action === "open_whatsapp" && !whatsappUrl) {
    return NextResponse.json({ error: "Nao foi possivel gerar o link do WhatsApp." }, { status: 400 });
  }

  const followUpDate = body.action === "follow_up" ? body.followUpDate || addDaysISO(body.followUpDays || 3) : null;
  const eventBody =
    body.action === "follow_up"
      ? `Follow-up agendado para ${followUpDate}. ${message}`.trim()
      : body.action === "open_whatsapp"
        ? `Mensagem aberta no WhatsApp: ${message}`
        : message || meta.status || "Evento registrado";

  await supabase.from("whatsapp_messages").insert({
    user_id: user.id,
    lead_id: lead.id,
    phone: phone.phone || lead.whatsapp || "",
    direction: meta.direction,
    event_type: meta.eventType,
    communication_mode: "manual",
    body: eventBody,
    provider_message_id: null
  });

  const leadUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (meta.status) leadUpdate.status = meta.status;
  if (meta.responseStatus) leadUpdate.response_status = meta.responseStatus;
  if (body.action === "prepare") leadUpdate.generated_message = message;
  if (body.action === "confirm_sent") {
    leadUpdate.generated_message = message;
    leadUpdate.last_contact_date = todayISO();
    leadUpdate.last_whatsapp_sent_at = new Date().toISOString();
  }
  if (body.action === "manual_response") {
    leadUpdate.last_inbound_message = message;
    leadUpdate.last_inbound_at = new Date().toISOString();
  }
  if (followUpDate) leadUpdate.next_follow_up_date = followUpDate;

  await supabase.from("leads").update(leadUpdate).eq("id", lead.id).eq("user_id", user.id);

  if (followUpDate) {
    await supabase.from("follow_ups").upsert(
      {
        user_id: user.id,
        lead_id: lead.id,
        due_date: followUpDate,
        note: message || "Retorno manual agendado",
        completed: false
      },
      { onConflict: "lead_id,due_date" }
    );
  }

  return NextResponse.json({
    ok: true,
    whatsappUrl,
    followUpDate
  });
}
