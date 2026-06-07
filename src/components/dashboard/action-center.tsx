import Link from "next/link";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { temperatureClasses, temperatureIcon } from "@/lib/opportunity-service";
import type { Lead } from "@/types/database";

export function ActionCenter({ actions }: { actions: Array<{ lead: Lead; reason: string; action: string }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Proximas acoes</h2>
          <p className="text-sm text-slate-500">O que voce precisa fazer agora.</p>
        </div>
        <Link href="/follow-ups" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Ver agenda</Link>
      </div>
      <div className="mt-4 space-y-3">
        {actions.length ? actions.map((item) => (
          <article key={item.lead.id} className="rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{item.lead.company_name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.lead.niche || "Sem nicho"} - {item.lead.city || "Sem cidade"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${temperatureClasses(item.lead.opportunity_score)}`}>
                {temperatureIcon(item.lead.opportunity_score)} {item.lead.opportunity_score ?? 0}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={item.lead.status} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{item.reason}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">Acao recomendada: {item.action}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/conversas" className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Abrir conversa</Link>
              <Link href="/conversas" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Abrir WhatsApp</Link>
              <Link href="/propostas" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Gerar proposta</Link>
            </div>
          </article>
        )) : <EmptyState icon={<Sparkles size={22} />} title="Tudo em dia por enquanto" description="Nenhuma acao urgente foi encontrada agora." />}
      </div>
    </section>
  );
}
