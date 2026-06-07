import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWhatsAppConfig, onlyDigits } from "@/lib/whatsapp";

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          text?: {
            body?: string;
          };
          timestamp?: string;
        }>;
      };
    }>;
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const config = getWhatsAppConfig();

  if (mode === "subscribe" && token && token === config.webhookVerifyToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as WhatsAppWebhookBody;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, warning: "SUPABASE_SERVICE_ROLE_KEY nao configurada." });
  }

  const messages =
    body.entry?.flatMap((entry) => entry.changes?.flatMap((change) => change.value?.messages || []) || []) || [];

  for (const message of messages) {
    if (!message.from) continue;

    const from = onlyDigits(message.from);
    const text = message.text?.body || "";
    const inboundAt = message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString();

    const { data: leads } = await supabase.from("leads").select("id, user_id, whatsapp").not("whatsapp", "is", null);
    const matchedLeads = leads?.filter((lead) => onlyDigits(lead.whatsapp || "").endsWith(from.slice(-10))) || [];

    if (!matchedLeads.length) continue;

    await supabase
      .from("leads")
      .update({
        status: "Respondeu",
        response_status: "respondeu",
        last_inbound_message: text,
        last_inbound_at: inboundAt
      })
      .in(
        "id",
        matchedLeads.map((lead) => lead.id)
      );

    await supabase.from("whatsapp_messages").insert(
      matchedLeads.map((lead) => ({
        user_id: lead.user_id,
        lead_id: lead.id,
        phone: from,
        direction: "inbound" as const,
        event_type: "api_received" as const,
        communication_mode: "api" as const,
        body: text,
        provider_message_id: message.id || null,
        created_at: inboundAt
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
