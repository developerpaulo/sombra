import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  description,
  icon,
  tone = "slate",
  attention
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  tone?: "slate" | "emerald" | "blue" | "amber" | "rose" | "violet";
  attention?: boolean;
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700"
  };

  return (
    <article className={cn("rounded-2xl border bg-white p-4 shadow-soft transition hover:-translate-y-0.5", attention ? "border-amber-200" : "border-slate-200")}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>
        {attention ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">Atencao</span> : null}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}

