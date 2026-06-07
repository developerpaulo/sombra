import { BarChart3, CheckCircle2, Flame, MailCheck, MessageCircle, Send, Target, Thermometer, Users, WalletCards } from "lucide-react";
import { ActionCenter } from "@/components/dashboard/action-center";
import { DailyMissionCard } from "@/components/dashboard/daily-mission-card";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RankingBarList } from "@/components/dashboard/ranking-bar-list";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { RevenueOverview } from "@/components/dashboard/revenue-overview";
import { SalesFunnel } from "@/components/dashboard/sales-funnel";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { TopOpportunities } from "@/components/dashboard/top-opportunities";
import {
  getDashboardMetrics,
  getNextActions,
  getRankingByCity,
  getRankingByNiche,
  getRecentActivities,
  getSalesFunnel,
  getSmartRecommendations,
  getTopOpportunities
} from "@/lib/dashboard-service";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, todayISO } from "@/lib/utils";
import type { Lead, Proposal, WhatsAppMessage } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ data: leads = [] }, { data: proposals = [] }, { data: messages = [] }] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("proposals").select("*, leads(company_name)").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("whatsapp_messages").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20)
  ]);

  const typedLeads = leads as Lead[];
  const typedProposals = proposals as Proposal[];
  const typedMessages = messages as WhatsAppMessage[];
  const metrics = getDashboardMetrics(typedLeads, typedProposals);
  const funnel = getSalesFunnel(typedLeads);
  const topOpportunities = getTopOpportunities(typedLeads, 6);
  const actions = getNextActions(typedLeads, typedProposals, 6);
  const recommendations = getSmartRecommendations(typedLeads, typedProposals);
  const recentActivities = getRecentActivities(typedLeads, typedMessages, typedProposals);
  const nicheRanking = getRankingByNiche(typedLeads).map(([label, value]) => ({ label, value }));
  const cityRanking = getRankingByCity(typedLeads).map(([label, value]) => ({
    label,
    value: value.total,
    meta: `${value.hot} quentes, ${value.closed} fechados`
  }));
  const todayLeads = typedLeads.filter((lead) => lead.created_at?.slice(0, 10) === todayISO()).length;
  const bestNiche = nicheRanking[0]?.label || "restaurantes";
  const bestCity = cityRanking[0]?.label || "Brasilia";

  return (
    <div className="space-y-6">
      <DashboardHero
        hot={metrics.hot}
        followUps={metrics.followUps.length}
        openProposals={typedProposals.filter((proposal) => proposal.status === "Enviada").length}
        estimatedRevenue={metrics.estimatedRevenue}
        conversionRate={metrics.conversionRate}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total de leads" value={metrics.total} description="Empresas cadastradas no CRM" icon={<Users size={20} />} tone="slate" />
        <KpiCard title="Leads quentes" value={metrics.hot} description="Score acima de 70" icon={<Flame size={20} />} tone="rose" attention={metrics.hot > 0} />
        <KpiCard title="Leads mornos" value={metrics.warm} description="Score entre 40 e 69" icon={<Thermometer size={20} />} tone="amber" />
        <KpiCard title="Leads frios" value={metrics.cold} description="Score abaixo de 40" icon={<Thermometer size={20} />} tone="blue" />
        <KpiCard title="Mensagens preparadas" value={metrics.prepared} description="Prontas para revisar e enviar" icon={<MailCheck size={20} />} tone="violet" />
        <KpiCard title="WhatsApps abertos" value={metrics.opened} description="Links wa.me utilizados" icon={<MessageCircle size={20} />} tone="emerald" />
        <KpiCard title="Enviadas manualmente" value={metrics.manualSent} description="Confirmadas pelo usuario" icon={<Send size={20} />} tone="emerald" />
        <KpiCard title="Respostas registradas" value={metrics.replies} description={`Taxa de resposta ${metrics.responseRate}%`} icon={<MessageCircle size={20} />} tone="blue" />
        <KpiCard title="Interessados" value={metrics.interested} description="Leads com sinal positivo" icon={<Target size={20} />} tone="emerald" attention={metrics.interested > 0} />
        <KpiCard title="Propostas enviadas" value={metrics.proposalsSent} description="Negociacoes abertas" icon={<WalletCards size={20} />} tone="violet" />
        <KpiCard title="Fechados" value={metrics.closed} description="Clientes conquistados" icon={<CheckCircle2 size={20} />} tone="emerald" />
        <KpiCard title="Taxa de conversao" value={`${metrics.conversionRate}%`} description="Fechados sobre total de leads" icon={<BarChart3 size={20} />} tone="slate" />
        <KpiCard title="Receita estimada" value={formatCurrency(metrics.estimatedRevenue)} description="Propostas abertas + fechadas" icon={<WalletCards size={20} />} tone="emerald" />
        <KpiCard title="Follow-ups pendentes" value={metrics.followUps.length} description="Atrasados ou para hoje" icon={<Target size={20} />} tone="amber" attention={metrics.followUps.length > 0} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ActionCenter actions={actions} />
        <DailyMissionCard niche={bestNiche} city={bestCity} goal={10} progress={todayLeads} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SalesFunnel items={funnel} />
        <RevenueOverview estimated={metrics.estimatedRevenue} open={metrics.openProposalValue} closed={metrics.closedValue} averageTicket={metrics.averageTicket} />
      </section>

      <TopOpportunities items={topOpportunities} />

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingBarList title="Performance por nicho" items={nicheRanking} />
        <RankingBarList title="Performance por cidade" items={cityRanking} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SmartRecommendations items={recommendations} />
        <RecentActivityList activities={recentActivities} />
      </section>
    </div>
  );
}
