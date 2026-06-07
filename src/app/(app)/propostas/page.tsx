import { PageHeader } from "@/components/page-header";
import { ProposalForm } from "@/components/proposal-form";
import { ProposalList } from "@/components/proposal-list";
import { createClient } from "@/lib/supabase/server";
import type { Lead, Proposal } from "@/types/database";

export default async function ProposalsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: leads = [] }, { data: proposals = [] }] = await Promise.all([
    supabase.from("leads").select("id, company_name").eq("user_id", user!.id).order("company_name"),
    supabase.from("proposals").select("*, leads(company_name)").eq("user_id", user!.id).order("created_at", { ascending: false })
  ]);

  return (
    <>
      <PageHeader title="Propostas" description="Registre propostas enviadas, valores, servicos e status de negociacao." />
      <div className="mb-6">
        <ProposalForm leads={leads as Pick<Lead, "id" | "company_name">[]} />
      </div>
      <ProposalList proposals={proposals as Proposal[]} />
    </>
  );
}
