import Link from "next/link";

export function DailyMissionCard({ niche, city, goal, progress }: { niche: string; city: string; goal: number; progress: number }) {
  const percent = goal ? Math.min(100, Math.round((progress / goal) * 100)) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Missao do Dia</p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">Encontrar {goal} leads no nicho {niche} em {city}</h2>
          <p className="mt-1 text-sm text-slate-500">Mantenha foco e avance sua prospeccao com uma meta simples.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950">{progress}/{goal}</p>
          <p className="text-xs text-slate-500">leads hoje</p>
        </div>
      </div>
      <div className="mt-5 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/captar" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Ir para Radar de Oportunidades</Link>
        <Link href="/captar" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Criar nova missao</Link>
      </div>
    </section>
  );
}

