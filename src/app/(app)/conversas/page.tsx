import { ConversationInbox } from "@/components/conversation-inbox";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Lead, MessageTemplate, WhatsAppMessage } from "@/types/database";

type LeadWithMessages = Lead & {
  whatsapp_messages?: WhatsAppMessage[];
};

export default async function ConversationsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: leads = [] }, { data: messages = [] }, { data: templates = [] }] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user!.id).not("whatsapp", "is", null).order("updated_at", { ascending: false }),
    supabase.from("whatsapp_messages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("message_templates").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
  ]);

  const leadsWithMessages = (leads as Lead[]).map((lead) => ({
    ...lead,
    whatsapp_messages: (messages as WhatsAppMessage[]).filter((message) => message.lead_id === lead.id)
  }));

  return (
    <>
      <PageHeader title="Conversas" description="Leia e responda mensagens do WhatsApp dentro do CRM." />
      <ConversationInbox leads={leadsWithMessages as LeadWithMessages[]} templates={templates as MessageTemplate[]} />
    </>
  );
}
