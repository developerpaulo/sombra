export function RankingBarList({ title, items }: { title: string; items: Array<{ label: string; value: number; meta?: string }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="font-bold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-4">
        {items.length ? items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value} {item.meta || ""}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(6, Math.round((item.value / max) * 100))}%` }} />
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Nenhum dado suficiente ainda.</p>}
      </div>
    </section>
  );
}
