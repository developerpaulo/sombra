import Link from "next/link";
import { Flame } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDate } from "@/lib/utils";
import { temperatureClasses, temperatureIcon } from "@/lib/opportunity-service";
import type { Lead } from "@/types/database";

export function TopOpportunities({ items }: { items: Array<{ lead: Lead; analysis: { mainProblem: string; approach: string } }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Top oportunidades</h2>
          <p className="text-sm text-slate-500">Leads ranqueados por score.</p>
        </div>
        <Link href="/conversao" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Ver centro</Link>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.length ? items.map(({ lead, analysis }) => (
          <article key={lead.id} className="rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{lead.company_name}</p>
                <p className="mt-1 text-sm text-slate-500">{lead.niche || "Sem nicho"} - {lead.city || "Sem cidade"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${temperatureClasses(lead.opportunity_score)}`}>
                {temperatureIcon(lead.opportunity_score)} {lead.opportunity_score ?? 0}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Motivo: {analysis.mainProblem}</p>
            <p className="mt-1 text-sm text-slate-600">Proxima acao: {analysis.approach}</p>
            <p className="mt-2 text-xs text-slate-400">Ultima interacao: {formatDate(lead.last_contact_date || lead.last_inbound_at?.slice(0, 10) || lead.updated_at?.slice(0, 10))}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/leads" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Ver lead</Link>
              <Link href="/conversas" className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Preparar mensagem</Link>
              <Link href="/conversas" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Abrir WhatsApp</Link>
            </div>
          </article>
        )) : <div className="lg:col-span-2"><EmptyState icon={<Flame size={22} />} title="Nenhuma oportunidade quente ainda" description="Use o Radar de Oportunidades para encontrar e cadastrar leads com potencial." /></div>}
      </div>
    </section>
  );
}

