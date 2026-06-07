import { AutomationPanel } from "@/components/automation-panel";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { MessageTemplate } from "@/types/database";

export default async function AutomationPage() {
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
      <PageHeader title="Automacao" description="Envio em lote controlado e organizacao automatica de respostas." />
      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        Use somente com leads que autorizaram contato. Sem WhatsApp Business configurado, esta tela mostra erro de configuracao e nao envia nada.
      </div>
      <AutomationPanel templates={templates as MessageTemplate[]} />
    </>
  );
}
