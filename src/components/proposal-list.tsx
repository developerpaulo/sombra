import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Proposal } from "@/types/database";

export function ProposalList({ proposals }: { proposals: Proposal[] }) {
  if (!proposals.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhuma proposta registrada ainda.</div>;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="grid gap-3 p-4 md:hidden">
        {proposals.map((proposal) => (
          <article key={proposal.id} className="rounded-lg border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{proposal.leads?.company_name ?? "Lead removido"}</p>
                <p className="mt-1 text-sm text-slate-600">{proposal.service_offered}</p>
              </div>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="mt-3 font-semibold text-slate-900">{formatCurrency(proposal.amount)}</p>
            <p className="mt-1 text-sm text-slate-500">Prazo: {proposal.deadline || "-"}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{proposal.scope || proposal.notes || "-"}</p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Servico</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Escopo/Observacoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{proposal.leads?.company_name ?? "Lead removido"}</td>
                <td className="px-4 py-3 text-slate-600">{proposal.service_offered}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(proposal.amount)}</td>
                <td className="px-4 py-3 text-slate-600">{proposal.deadline || "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={proposal.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{proposal.scope || proposal.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
