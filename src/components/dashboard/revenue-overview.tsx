import { formatCurrency } from "@/lib/utils";

export function RevenueOverview({
  estimated,
  open,
  closed,
  averageTicket
}: {
  estimated: number;
  open: number;
  closed: number;
  averageTicket: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Receita potencial</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(estimated)}</p>
      <p className="mt-1 text-sm text-slate-500">Baseado em propostas abertas e valores fechados.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Propostas abertas</p>
          <p className="mt-1 font-bold text-slate-950">{formatCurrency(open)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Fechado</p>
          <p className="mt-1 font-bold text-emerald-800">{formatCurrency(closed)}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-700">Ticket medio</p>
          <p className="mt-1 font-bold text-blue-800">{formatCurrency(averageTicket)}</p>
        </div>
      </div>
    </section>
  );
}

