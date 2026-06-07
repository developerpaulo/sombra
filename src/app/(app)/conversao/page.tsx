import Link from "next/link";
import { Flame, MessageCircle, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { generateOpportunityAnalysis, temperatureClasses, temperatureIcon } from "@/lib/opportunity-service";
import { formatDate, todayISO } from "@/lib/utils";
import type { Lead } from "@/types/database";

function recommendedAction(lead: Lead) {
  if (!lead.current_site || lead.signal_no_site) return "Enviar abordagem sobre site profissional e Google.";
  if (lead.signal_old_site || lead.signal_not_responsive) return "Falar sobre modernizacao, celular e confianca.";
  if (lead.status === "Aguardando resposta") return "Fazer follow-up leve e objetivo.";
  if (lead.response_status === "interessado") return "Criar proposta comercial.";
  return "Validar interesse com mensagem consultiva.";
}

export default async function ConversionCenterPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: leads = [] } = await supabase.from("leads").select("*").eq("user_id", user!.id).order("opportunity_score", { ascending: false });
  const typedLeads = leads as Lead[];
  const today = todayISO();
  const hotLeads = typedLeads.filter((lead) => (lead.opportunity_score ?? 0) >= 70 && lead.status !== "Fechado" && lead.status !== "Sem interesse").slice(0, 8);
  const stuckLeads = typedLeads.filter((lead) => lead.status === "Aguardando resposta" || (lead.next_follow_up_date && lead.next_follow_up_date <= today)).slice(0, 8);
  const noSiteLeads = typedLeads.filter((lead) => !lead.current_site || lead.signal_no_site).slice(0, 8);
  const todayList = [...hotLeads, ...stuckLeads, ...noSiteLeads].filter((lead, index, arr) => arr.findIndex((item) => item.id === lead.id) === index).slice(0, 5);

  return (
    <>
      <PageHeader title="Centro de Conversão" description="As melhores oportunidades e proximas acoes para transformar leads em clientes." />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-5">
          <Flame className="text-rose-600" />
          <p className="mt-3 text-2xl font-bold text-rose-700">{hotLeads.length}</p>
          <p className="text-sm text-rose-800">Leads quentes</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-5">
          <MessageCircle className="text-amber-600" />
          <p className="mt-3 text-2xl font-bold text-amber-700">{stuckLeads.length}</p>
          <p className="text-sm text-amber-800">Precisam de retorno</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
          <Target className="text-blue-600" />
          <p className="mt-3 text-2xl font-bold text-blue-700">{noSiteLeads.length}</p>
          <p className="text-sm text-blue-800">Sem site ou site fraco</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="font-semibold text-slate-950">Hoje voce deveria falar com estes leads</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {todayList.length ? todayList.map((lead) => {
            const analysis = generateOpportunityAnalysis(lead);
            return (
              <article key={lead.id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{lead.company_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{lead.niche || "Sem nicho"} · {lead.city || "Sem cidade"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${temperatureClasses(lead.opportunity_score)}`}>
                    {temperatureIcon(lead.opportunity_score)} {analysis.temperature} {lead.opportunity_score ?? 0}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">Motivo: {analysis.mainProblem}</p>
                <p className="mt-1 text-sm text-slate-600">Acao sugerida: {recommendedAction(lead)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={lead.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Follow-up {formatDate(lead.next_follow_up_date)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/conversas" className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Abrir WhatsApp</Link>
                  <Link href="/propostas" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Criar proposta</Link>
                </div>
              </article>
            );
          }) : <p className="text-sm text-slate-500">Nenhuma prioridade urgente agora.</p>}
        </div>
      </section>
    </>
  );
}

