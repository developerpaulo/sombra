import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/template-form";
import { TemplateList } from "@/components/template-list";
import { createClient } from "@/lib/supabase/server";
import type { MessageTemplate } from "@/types/database";

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: templates = [] } = await supabase
    .from("message_templates")
    .select("*")
    .eq("user_id", user!.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Mensagens" description="Escolha quais mensagens podem ser usadas no primeiro contato." />
      <div className="mb-6">
        <TemplateForm />
      </div>
      <TemplateList templates={templates as MessageTemplate[]} />
    </>
  );
}
