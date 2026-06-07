import { OpportunityRadar } from "@/components/opportunity-radar";
import { createClient } from "@/lib/supabase/server";
import type { Lead, MessageTemplate } from "@/types/database";

export default async function CapturePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: leads = [] }, { data: templates = [] }] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("message_templates").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
  ]);

  return <OpportunityRadar initialLeads={leads as Lead[]} templates={templates as MessageTemplate[]} />;
}
