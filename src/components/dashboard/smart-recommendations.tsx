import Link from "next/link";
import { Lightbulb } from "lucide-react";

export function SmartRecommendations({ items }: { items: Array<{ priority: string; text: string; action: string; href: string }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-950">Recomendacoes</h2>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.text} className="flex gap-3 rounded-xl border border-slate-100 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Lightbulb size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{item.priority}</span>
                <p className="text-sm font-medium text-slate-800">{item.text}</p>
              </div>
              <Link href={item.href} className="mt-2 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800">{item.action}</Link>
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Nenhuma recomendacao urgente agora.</p>}
      </div>
    </section>
  );
}

