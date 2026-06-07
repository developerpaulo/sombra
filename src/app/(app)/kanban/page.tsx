import { KanbanBoard } from "@/components/kanban-board";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/database";

export default async function KanbanPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: leads = [] } = await supabase.from("leads").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Kanban" description="Arraste os leads entre os status conforme o avanco da negociacao." />
      <KanbanBoard initialLeads={leads as Lead[]} />
    </>
  );
}
