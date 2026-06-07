import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { followUpBucket } from "@/lib/follow-up-service";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types/database";

const bucketLabels: Record<string, string> = {
  atrasado: "Atrasados",
  hoje: "Hoje",
  proximos_7: "Proximos 7 dias",
  sem_data: "Sem data",
  futuro: "Futuros"
};

export default async function FollowUpsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: leads = [] } = await supabase.from("leads").select("*").eq("user_id", user!.id).order("next_follow_up_date", { ascending: true });
  const typedLeads = leads as Lead[];
  const groups = typedLeads.reduce<Record<string, Lead[]>>((acc, lead) => {
    const bucket = followUpBucket(lead);
    acc[bucket] = acc[bucket] || [];
    acc[bucket].push(lead);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Agenda de Follow-up" description="Lembretes manuais para retornar leads no momento certo, sem envio automatico." />
      <div className="grid gap-4 lg:grid-cols-2">
        {["atrasado", "hoje", "proximos_7", "sem_data"].map((bucket) => (
          <section key={bucket} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-950">{bucketLabels[bucket]}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{groups[bucket]?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {groups[bucket]?.length ? groups[bucket].slice(0, 8).map((lead) => (
                <article key={lead.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{lead.company_name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{lead.niche || "Sem nicho"} · {lead.whatsapp || "Sem telefone"}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><CalendarClock size={15} /> {formatDate(lead.next_follow_up_date)}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/conversas" className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Abrir WhatsApp</Link>
                    <Link href="/conversas" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Copiar follow-up</Link>
                  </div>
                </article>
              )) : <p className="text-sm text-slate-500">Nada aqui agora.</p>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
