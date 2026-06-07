import { LeadForm } from "@/components/lead-form";
import { LeadCsvTools } from "@/components/lead-csv-tools";
import { LeadList } from "@/components/lead-list";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Lead, MessageTemplate } from "@/types/database";

export default async function LeadsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: leads = [] }, { data: templates = [] }] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("message_templates").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
  ]);

  return (
    <>
      <PageHeader title="Leads" description="Organize empresas, status, oportunidade e mensagens para WhatsApp." />
      <LeadCsvTools />
      <div className="mb-6">
        <LeadForm compact />
      </div>
      <LeadList leads={leads as Lead[]} templates={templates as MessageTemplate[]} />
    </>
  );
}
