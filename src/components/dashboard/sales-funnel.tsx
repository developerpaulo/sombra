import { StatusBadge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/database";

export function SalesFunnel({ items }: { items: Array<{ status: LeadStatus; count: number; percent: number }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-950">Funil de vendas</h2>
      <p className="mt-1 text-sm text-slate-500">Distribuicao dos leads por etapa.</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.status} className="grid gap-2 md:grid-cols-[190px_1fr_70px] md:items-center">
            <StatusBadge status={item.status} />
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(item.percent, item.count ? 5 : 0)}%` }} />
            </div>
            <p className="text-sm font-semibold text-slate-700">{item.count} - {item.percent}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}

