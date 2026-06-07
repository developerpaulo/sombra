"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OpportunityBadge, StatusBadge } from "@/components/ui/badge";
import { responseStatusLabels } from "@/lib/constants";
import { generateWhatsAppMessage, renderMessageTemplate } from "@/lib/lead-ai";
import { calculateLeadPriority } from "@/lib/lead-priority";
import { generateOpportunityAnalysis, temperatureClasses, temperatureIcon } from "@/lib/opportunity-service";
import { createClient } from "@/lib/supabase/browser";
import { formatDate } from "@/lib/utils";
import { buildWhatsAppClickToChatUrl, onlyDigits } from "@/lib/whatsapp-links";
import type { Lead, LeadFormData, MessageTemplate } from "@/types/database";

export function LeadList({ leads, templates = [] }: { leads: Lead[]; templates?: MessageTemplate[] }) {
  const [copiedId, setCopiedId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates.find((template) => template.is_default)?.id || templates[0]?.id || "");
  const [analysisLead, setAnalysisLead] = useState<Lead | null>(null);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function generateMessage(lead: Lead) {
    const formData: LeadFormData = {
      company_name: lead.company_name,
      contact_name: lead.contact_name ?? "",
      niche: lead.niche ?? "",
      city: lead.city ?? "",
      whatsapp: lead.whatsapp ?? "",
      instagram: lead.instagram ?? "",
      current_site: lead.current_site ?? "",
      notes: lead.notes ?? "",
      whatsapp_opt_in: lead.whatsapp_opt_in ?? false,
      auto_message_enabled: lead.auto_message_enabled ?? false,
      status: lead.status,
      last_contact_date: lead.last_contact_date ?? "",
      next_follow_up_date: lead.next_follow_up_date ?? ""
    };
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    const message = selectedTemplate ? renderMessageTemplate(selectedTemplate.content, formData) : generateWhatsAppMessage(formData);
    const { error } = await supabase.from("leads").update({ generated_message: message, status: "Mensagem pronta" }).eq("id", lead.id);
    if (error) {
      setFeedback("Nao foi possivel salvar a mensagem.");
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setFeedback("Mensagem gerada e copiada.");
    } catch {
      setFeedback("Mensagem gerada. Abra o lead para copiar manualmente.");
    }
    setCopiedId(lead.id);
    router.refresh();
  }

  async function sendWhatsApp(lead: Lead) {
    setFeedback("");
    const formData: LeadFormData = {
      company_name: lead.company_name,
      contact_name: lead.contact_name ?? "",
      niche: lead.niche ?? "",
      city: lead.city ?? "",
      whatsapp: lead.whatsapp ?? "",
      instagram: lead.instagram ?? "",
      current_site: lead.current_site ?? "",
      notes: lead.notes ?? "",
      whatsapp_opt_in: lead.whatsapp_opt_in ?? false,
      auto_message_enabled: lead.auto_message_enabled ?? false,
      status: lead.status,
      last_contact_date: lead.last_contact_date ?? "",
      next_follow_up_date: lead.next_follow_up_date ?? ""
    };
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    const message = selectedTemplate ? renderMessageTemplate(selectedTemplate.content, formData) : lead.generated_message || generateWhatsAppMessage(formData);

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leadId: lead.id,
        message
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setFeedback(result.error || "Nao foi possivel enviar a mensagem.");
      return;
    }

    setFeedback("Mensagem enviada pelo WhatsApp.");
    router.refresh();
  }

  function openWhatsAppNormal(lead: Lead) {
    if (!lead.whatsapp) {
      setFeedback("Este lead nao tem WhatsApp cadastrado.");
      return;
    }

    const formData: LeadFormData = {
      company_name: lead.company_name,
      contact_name: lead.contact_name ?? "",
      niche: lead.niche ?? "",
      city: lead.city ?? "",
      whatsapp: lead.whatsapp ?? "",
      instagram: lead.instagram ?? "",
      current_site: lead.current_site ?? "",
      notes: lead.notes ?? "",
      whatsapp_opt_in: lead.whatsapp_opt_in ?? false,
      auto_message_enabled: lead.auto_message_enabled ?? false,
      status: lead.status,
      last_contact_date: lead.last_contact_date ?? "",
      next_follow_up_date: lead.next_follow_up_date ?? ""
    };
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    const message = selectedTemplate ? renderMessageTemplate(selectedTemplate.content, formData) : lead.generated_message || generateWhatsAppMessage(formData);
    const phone = onlyDigits(lead.whatsapp);

    if (phone.length < 10) {
      setFeedback("WhatsApp invalido. Use DDI + DDD + numero, por exemplo 5511999999999.");
      return;
    }

    window.open(buildWhatsAppClickToChatUrl(phone, message), "_blank", "noopener,noreferrer");
    setFeedback("Conversa aberta no WhatsApp normal. Revise e envie manualmente.");
  }

  if (!leads.length) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhum lead cadastrado ainda.</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      {templates.length ? (
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <label className="text-sm font-medium text-slate-700">
            Modelo de primeiro contato
            <select
              className="ml-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.is_default ? " (padrao)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {feedback ? <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">{feedback}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Resposta</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Oportunidade</th>
                  <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Análise</th>
              <th className="px-4 py-3">Mensagem</th>
              <th className="px-4 py-3">Envio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const priority = calculateLeadPriority(lead);
              return (
                <tr key={lead.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{lead.company_name}</p>
                    <p className="text-xs text-slate-500">{lead.city || lead.whatsapp || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.niche || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{responseStatusLabels[lead.response_status ?? "sem_resposta"]}</td>
                  <td className="px-4 py-3">
                    <div className="w-28" title={priority.reasons.join(", ") || "Sem sinais fortes de prioridade"}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{priority.label}</span>
                        <span>{priority.score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${priority.score}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OpportunityBadge level={lead.opportunity} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(lead.next_follow_up_date)}</td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="ghost" onClick={() => setAnalysisLead(lead)}>
                      Analisar oportunidade
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="secondary" onClick={() => generateMessage(lead)}>
                      {copiedId === lead.id ? "Copiada" : "Gerar e copiar"}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => openWhatsAppNormal(lead)} disabled={!lead.whatsapp}>
                        Abrir normal
                      </Button>
                      <Button type="button" variant="primary" onClick={() => sendWhatsApp(lead)} disabled={!lead.whatsapp || !lead.whatsapp_opt_in}>
                        Enviar Business
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Normal abre o app/site para envio manual. Business usa API oficial.
                    </p>
                    {!lead.whatsapp_opt_in ? <p className="mt-1 text-xs text-slate-500">Business requer autorizacao</p> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {analysisLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {(() => {
              const analysis = generateOpportunityAnalysis(analysisLead);
              return (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Analise da oportunidade</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-950">{analysisLead.company_name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{analysis.summary}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${temperatureClasses(analysis.score)}`}>
                      {temperatureIcon(analysis.score)} {analysis.temperature} · {analysis.score}/100
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="font-semibold text-slate-950">Motivos para abordar</p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600">
                        {(analysis.reasons.length ? analysis.reasons : ["Lead ainda precisa de mais qualificacao."]).map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-950">Abordagem recomendada</p>
                      <p className="mt-2 text-sm text-emerald-800">{analysis.approach}</p>
                      <p className="mt-3 text-sm font-semibold text-emerald-900">Chance de fechamento: {analysis.chance}%</p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button type="button" variant="secondary" onClick={() => setAnalysisLead(null)}>
                      Fechar
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
