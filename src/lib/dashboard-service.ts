import { leadStatuses } from "@/lib/constants";
import { generateOpportunityAnalysis, getTemperature } from "@/lib/opportunity-service";
import { todayISO } from "@/lib/utils";
import type { Lead, Proposal, WhatsAppMessage } from "@/types/database";

export type RecentActivity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  leadName?: string;
};

export function getDashboardMetrics(leads: Lead[], proposals: Proposal[]) {
  const total = leads.length;
  const closed = leads.filter((lead) => lead.status === "Fechado").length;
  const hot = leads.filter((lead) => (lead.opportunity_score ?? 0) >= 70).length;
  const warm = leads.filter((lead) => (lead.opportunity_score ?? 0) >= 40 && (lead.opportunity_score ?? 0) < 70).length;
  const cold = leads.filter((lead) => (lead.opportunity_score ?? 0) < 40).length;
  const prepared = leads.filter((lead) => lead.status === "Mensagem pronta").length;
  const opened = leads.filter((lead) => lead.status === "Aberto no WhatsApp").length;
  const manualSent = leads.filter((lead) => lead.status === "Enviado manualmente" || lead.status === "Aguardando resposta").length;
  const replies = leads.filter((lead) => lead.response_status === "respondeu" || lead.response_status === "interessado").length;
  const interested = leads.filter((lead) => lead.status === "Interessado" || lead.response_status === "interessado").length;
  const proposalsSent = leads.filter((lead) => lead.status === "Proposta enviada").length;
  const conversionRate = total ? Math.round((closed / total) * 100) : 0;
  const responseRate = manualSent ? Math.round((replies / manualSent) * 100) : 0;
  const today = todayISO();
  const followUps = leads.filter((lead) => lead.next_follow_up_date && lead.next_follow_up_date <= today && lead.status !== "Fechado" && lead.status !== "Sem interesse");
  const openProposalValue = proposals.filter((proposal) => proposal.status === "Enviada" || proposal.status === "Rascunho").reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0);
  const closedValue = proposals.filter((proposal) => proposal.status === "Aceita").reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0);
  const totalProposalValue = proposals.reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0);
  const averageTicket = proposals.length ? Math.round(totalProposalValue / proposals.length) : 0;
  const estimatedRevenue = closedValue + openProposalValue;

  return {
    total,
    hot,
    warm,
    cold,
    prepared,
    opened,
    manualSent,
    replies,
    interested,
    proposalsSent,
    closed,
    conversionRate,
    responseRate,
    followUps,
    openProposalValue,
    closedValue,
    totalProposalValue,
    averageTicket,
    estimatedRevenue
  };
}

export function getSalesFunnel(leads: Lead[]) {
  const total = leads.length || 1;
  return leadStatuses.map((status) => {
    const count = leads.filter((lead) => lead.status === status).length;
    return {
      status,
      count,
      percent: Math.round((count / total) * 100)
    };
  });
}

export function getTopOpportunities(leads: Lead[], limit = 5) {
  return [...leads]
    .filter((lead) => lead.status !== "Fechado" && lead.status !== "Sem interesse")
    .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0))
    .slice(0, limit)
    .map((lead) => ({
      lead,
      analysis: generateOpportunityAnalysis(lead),
      temperature: getTemperature(lead.opportunity_score)
    }));
}

export function getNextActions(leads: Lead[], proposals: Proposal[], limit = 6) {
  const today = todayISO();
  const items = leads
    .filter((lead) => lead.status !== "Fechado" && lead.status !== "Sem interesse")
    .map((lead) => {
      const hasOpenProposal = proposals.some((proposal) => proposal.lead_id === lead.id && proposal.status === "Enviada");
      const overdueFollowUp = Boolean(lead.next_follow_up_date && lead.next_follow_up_date < today);
      const dueToday = Boolean(lead.next_follow_up_date && lead.next_follow_up_date === today);
      const hotNoContact = (lead.opportunity_score ?? 0) >= 70 && !lead.last_contact_date && !lead.last_whatsapp_sent_at;
      const interestedNoProposal = (lead.status === "Interessado" || lead.response_status === "interessado") && !hasOpenProposal;
      const waiting = lead.status === "Aguardando resposta";

      let priority = 0;
      let reason = "";
      let action = "";

      if (overdueFollowUp) {
        priority = 100;
        reason = "Follow-up atrasado";
        action = "Abrir conversa e retomar contato";
      } else if (dueToday) {
        priority = 90;
        reason = "Follow-up para hoje";
        action = "Enviar follow-up manual";
      } else if (hotNoContact) {
        priority = 80;
        reason = "Lead quente sem contato";
        action = "Preparar mensagem e abrir WhatsApp";
      } else if (interestedNoProposal) {
        priority = 75;
        reason = "Interessado sem proposta";
        action = "Gerar proposta comercial";
      } else if (hasOpenProposal) {
        priority = 65;
        reason = "Proposta enviada sem resposta";
        action = "Fazer follow-up da proposta";
      } else if (waiting) {
        priority = 55;
        reason = "Aguardando resposta";
        action = "Retomar conversa com abordagem leve";
      }

      return { lead, priority, reason, action };
    })
    .filter((item) => item.priority > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);

  return items;
}

export function getRankingByNiche(leads: Lead[]) {
  return Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      const key = lead.niche || "Sem nicho";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
}

export function getRankingByCity(leads: Lead[]) {
  return Object.entries(
    leads.reduce<Record<string, { total: number; hot: number; closed: number }>>((acc, lead) => {
      const key = lead.city || "Sem cidade";
      acc[key] = acc[key] || { total: 0, hot: 0, closed: 0 };
      acc[key].total += 1;
      if ((lead.opportunity_score ?? 0) >= 70) acc[key].hot += 1;
      if (lead.status === "Fechado") acc[key].closed += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 7);
}

export function getSmartRecommendations(leads: Lead[], proposals: Proposal[]) {
  const metrics = getDashboardMetrics(leads, proposals);
  const hotNoContact = leads.filter((lead) => (lead.opportunity_score ?? 0) >= 70 && !lead.last_contact_date && !lead.last_whatsapp_sent_at).length;
  const openProposals = proposals.filter((proposal) => proposal.status === "Enviada").length;
  const waiting = leads.filter((lead) => lead.status === "Aguardando resposta").length;
  const bestNiche = getRankingByNiche(leads)[0]?.[0];

  return [
    hotNoContact ? { priority: "Alta", text: `Voce tem ${hotNoContact} leads quentes sem contato.`, action: "Ir para Conversas", href: "/conversas" } : null,
    metrics.followUps.length ? { priority: "Alta", text: `Voce tem ${metrics.followUps.length} follow-ups pendentes ou atrasados.`, action: "Ver agenda", href: "/follow-ups" } : null,
    openProposals ? { priority: "Media", text: `Voce tem ${openProposals} propostas enviadas sem resposta.`, action: "Ver propostas", href: "/propostas" } : null,
    waiting ? { priority: "Media", text: `${waiting} leads estao aguardando resposta.`, action: "Abrir conversas", href: "/conversas" } : null,
    bestNiche ? { priority: "Insight", text: `Seu melhor nicho em volume ate agora e ${bestNiche}.`, action: "Ver nichos", href: "/nichos" } : null
  ].filter(Boolean) as Array<{ priority: string; text: string; action: string; href: string }>;
}

export function getRecentActivities(leads: Lead[], messages: WhatsAppMessage[], proposals: Proposal[]) {
  const leadActivities: RecentActivity[] = leads.slice(0, 5).map((lead) => ({
    id: `lead-${lead.id}`,
    type: "Lead criado",
    leadName: lead.company_name,
    description: `${lead.niche || "Lead"} em ${lead.city || "cidade nao informada"}`,
    createdAt: lead.created_at
  }));

  const messageActivities: RecentActivity[] = messages.slice(0, 7).map((message) => ({
    id: `message-${message.id}`,
    type: message.event_type || "Mensagem",
    description: message.body,
    createdAt: message.created_at
  }));

  const proposalActivities: RecentActivity[] = proposals.slice(0, 5).map((proposal) => ({
    id: `proposal-${proposal.id}`,
    type: "Proposta criada",
    leadName: proposal.leads?.company_name || "Lead",
    description: `${proposal.service_offered} - R$ ${Number(proposal.amount || 0).toLocaleString("pt-BR")}`,
    createdAt: proposal.created_at
  }));

  return [...leadActivities, ...messageActivities, ...proposalActivities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}
