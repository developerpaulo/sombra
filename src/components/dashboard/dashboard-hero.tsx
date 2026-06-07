import { BarChart3, CalendarClock, Flame, Target, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DashboardHero({
  hot,
  followUps,
  openProposals,
  estimatedRevenue,
  conversionRate
}: {
  hot: number;
  followUps: number;
  openProposals: number;
  estimatedRevenue: number;
  conversionRate: number;
}) {
  const items = [
    { label: "Leads quentes", value: hot, icon: Flame },
    { label: "Follow-ups", value: followUps, icon: CalendarClock },
    { label: "Propostas abertas", value: openProposals, icon: Target },
    { label: "Receita potencial", value: formatCurrency(estimatedRevenue), icon: WalletCards },
    { label: "Conversao", value: `${conversionRate}%`, icon: BarChart3 }
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-soft">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white md:p-8">
        <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">Painel de vendas</p>
        <h1 className="mt-4 text-2xl font-bold md:text-3xl">Bem-vindo ao seu painel de vendas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200 md:text-base">Acompanhe oportunidades, follow-ups, propostas e proximos passos para vender mais sites.</p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/10 p-4 text-white">
              <Icon size={18} className="text-emerald-200" />
              <p className="mt-3 text-xs font-medium text-slate-300">{item.label}</p>
              <p className="mt-1 text-xl font-bold">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

