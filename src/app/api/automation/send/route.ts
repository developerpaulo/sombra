import { NextResponse } from "next/server";
import { generateWhatsAppMessage, renderMessageTemplate } from "@/lib/lead-ai";
import { calculateLeadPriority } from "@/lib/lead-priority";
import { getCommunicationMode } from "@/lib/communication";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import { getWhatsAppErrorMessage, onlyDigits, sendWhatsAppTextMessage } from "@/lib/whatsapp";
import type { Lead, LeadFormData } from "@/types/database";

type AutomationBody = {
  niche?: string;
  limit?: number;
  templateId?: string;
};

function limitBatch(value?: number) {
  if (!value || Number.isNaN(value)) return 10;
  return Math.min(Math.max(value, 1), 25);
}

function leadToFormData(lead: Lead): LeadFormData {
  return {
    company_name: lead.company_name,
    contact_name: lead.contact_name || "",
    niche: lead.niche || "",
    city: lead.city || "",
    whatsapp: lead.whatsapp || "",
    instagram: lead.instagram || "",
    current_site: lead.current_site || "",
    notes: lead.notes || "",
    whatsapp_opt_in: lead.whatsapp_opt_in,
    auto_message_enabled: lead.auto_message_enabled,
    status: lead.status,
    last_contact_date: lead.last_contact_date || "",
    next_follow_up_date: lead.next_follow_up_date || ""
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 });
  }

  if (getCommunicationMode() !== "api") {
    return NextResponse.json({
      attempted: 0,
      sent: 0,
      results: [],
      manualMode: true,
      message: "Manual Assistido ativo. Gere a mensagem, abra o WhatsApp e confirme manualmente."
    });
  }

  const body = (await request.json()) as AutomationBody;
  const batchLimit = limitBatch(body.limit);
  const { data: selectedTemplate } = body.templateId
    ? await supabase.from("message_templates").select("*").eq("id", body.templateId).eq("user_id", user.id).single()
    : await supabase.from("message_templates").select("*").eq("user_id", user.id).eq("is_default", true).maybeSingle();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .eq("whatsapp_opt_in", true)
    .eq("auto_message_enabled", true)
    .eq("response_status", "sem_resposta")
    .not("whatsapp", "is", null)
    .is("last_whatsapp_sent_at", null)
    .limit(batchLimit * 3);

  if (body.niche?.trim()) {
    query = query.ilike("niche", `%${body.niche.trim()}%`);
  }

  const { data: leads, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel buscar leads para automacao.", details: error }, { status: 500 });
  }

  const prioritizedLeads = ((leads || []) as Lead[])
    .map((lead) => ({
      lead,
      priority: calculateLeadPriority(lead)
    }))
    .sort((a, b) => b.priority.score - a.priority.score)
    .slice(0, batchLimit)
    .map((item) => item.lead);

  const results = [];

  for (const lead of prioritizedLeads) {
    const phone = onlyDigits(lead.whatsapp || "");
    if (phone.length < 10) {
      results.push({ leadId: lead.id, ok: false, error: "WhatsApp invalido." });
      continue;
    }

    const formData = leadToFormData(lead);
    const message = selectedTemplate ? renderMessageTemplate(selectedTemplate.content, formData) : lead.generated_message || generateWhatsAppMessage(formData);
    const sent = await sendWhatsAppTextMessage({ to: phone, message });

    if (!sent.ok) {
      results.push({ leadId: lead.id, ok: false, error: getWhatsAppErrorMessage(sent.data) });
      continue;
    }

    await supabase
      .from("leads")
      .update({
        generated_message: message,
        status: "Aguardando resposta",
        response_status: "sem_resposta",
        last_whatsapp_sent_at: new Date().toISOString(),
        last_contact_date: todayISO()
      })
      .eq("id", lead.id)
      .eq("user_id", user.id);

    await supabase.from("whatsapp_messages").insert({
      user_id: user.id,
      lead_id: lead.id,
      phone,
      direction: "outbound",
      event_type: "api_sent",
      communication_mode: "api",
      body: message,
      provider_message_id: sent.data?.messages?.[0]?.id || null
    });

    results.push({ leadId: lead.id, ok: true });
  }

  return NextResponse.json({
    attempted: results.length,
    sent: results.filter((result) => result.ok).length,
    results
  });
}
