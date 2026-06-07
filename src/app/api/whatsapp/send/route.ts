import { NextResponse } from "next/server";
import { todayISO } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getCommunicationMode } from "@/lib/communication";
import { getWhatsAppErrorMessage, onlyDigits, sendWhatsAppTextMessage } from "@/lib/whatsapp";

type SendWhatsAppBody = {
  leadId?: string;
  message?: string;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 });
  }

  const body = (await request.json()) as SendWhatsAppBody;
  if (!body.leadId || !body.message?.trim()) {
    return NextResponse.json({ error: "Lead e mensagem sao obrigatorios." }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, user_id, company_name, whatsapp, whatsapp_opt_in, status, response_status")
    .eq("id", body.leadId)
    .eq("user_id", user.id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead nao encontrado." }, { status: 404 });
  }

  if (!lead.whatsapp) {
    return NextResponse.json({ error: "Este lead nao tem WhatsApp cadastrado." }, { status: 400 });
  }

  if (!lead.whatsapp_opt_in) {
    return NextResponse.json({ error: "Marque que o lead autorizou contato por WhatsApp antes de enviar." }, { status: 403 });
  }

  if (getCommunicationMode() !== "api") {
    return NextResponse.json({ error: "O sistema esta em Manual Assistido. Use Abrir no WhatsApp e confirme o envio manualmente." }, { status: 400 });
  }

  const to = onlyDigits(lead.whatsapp);
  if (to.length < 10) {
    return NextResponse.json({ error: "WhatsApp invalido. Use DDI + DDD + numero, por exemplo 5511999999999." }, { status: 400 });
  }

  const result = await sendWhatsAppTextMessage({ to, message: body.message });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: getWhatsAppErrorMessage(result.data),
        details: result.data
      },
      { status: result.status || 502 }
    );
  }

  await supabase
    .from("leads")
    .update({
      generated_message: body.message,
      last_whatsapp_sent_at: new Date().toISOString(),
      last_contact_date: todayISO(),
      status: lead.response_status === "sem_resposta" ? "Aguardando resposta" : lead.status
    })
    .eq("id", lead.id)
    .eq("user_id", user.id);

  await supabase.from("whatsapp_messages").insert({
    user_id: user.id,
    lead_id: lead.id,
    phone: to,
    direction: "outbound",
    event_type: "api_sent",
    communication_mode: "api",
    body: body.message,
    provider_message_id: result.data?.messages?.[0]?.id || null
  });

  return NextResponse.json({ ok: true, result: result.data });
}
