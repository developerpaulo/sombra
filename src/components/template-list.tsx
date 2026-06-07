"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";
import type { MessageTemplate } from "@/types/database";

export function TemplateList({ templates }: { templates: MessageTemplate[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function makeDefault(template: MessageTemplate) {
    await supabase.from("message_templates").update({ is_default: false }).eq("user_id", template.user_id);
    await supabase.from("message_templates").update({ is_default: true }).eq("id", template.id);
    router.refresh();
  }

  async function deleteTemplate(template: MessageTemplate) {
    const confirmed = window.confirm(`Deseja apagar o modelo "${template.name}"?`);
    if (!confirmed) return;

    await supabase.from("message_templates").delete().eq("id", template.id);
    router.refresh();
  }

  if (!templates.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhum modelo cadastrado ainda.</div>;
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div key={template.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-950">{template.name}</h2>
              {template.is_default ? <p className="mt-1 text-xs font-semibold text-emerald-700">Modelo padrao</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {!template.is_default ? (
                <Button type="button" variant="secondary" onClick={() => makeDefault(template)}>
                  Tornar padrao
                </Button>
              ) : null}
              <Button type="button" variant="danger" onClick={() => deleteTemplate(template)}>
                Deletar
              </Button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{template.content}</p>
        </div>
      ))}
    </div>
  );
}
