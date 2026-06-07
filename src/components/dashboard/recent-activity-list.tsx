import { Clock3 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RecentActivity } from "@/lib/dashboard-service";

export function RecentActivityList({ activities }: { activities: RecentActivity[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-950">Atividades recentes</h2>
      <div className="mt-4 space-y-3">
        {activities.length ? activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Clock3 size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{activity.type}{activity.leadName ? ` - ${activity.leadName}` : ""}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{activity.description}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(activity.createdAt.slice(0, 10))}</p>
            </div>
          </div>
        )) : <p className="text-sm text-slate-500">Nenhuma atividade recente ainda.</p>}
      </div>
    </section>
  );
}
