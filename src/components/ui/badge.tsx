import type { LeadStatus, OpportunityLevel, ProposalStatus } from "@/types/database";
import { opportunityLabels, statusColors } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: LeadStatus | ProposalStatus }) {
  const color = status in statusColors ? statusColors[status as LeadStatus] : "bg-slate-100 text-slate-700";
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", color)}>{status}</span>;
}

export function OpportunityBadge({ level }: { level: OpportunityLevel }) {
  const color =
    level === "high"
      ? "bg-emerald-100 text-emerald-700"
      : level === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", color)}>{opportunityLabels[level]}</span>;
}
