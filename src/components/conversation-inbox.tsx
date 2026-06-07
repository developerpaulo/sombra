"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Check, CheckCheck, Clock3, Copy, FileText, Loader2, MessageCircle, Paperclip, Phone, Search, Send, Smile, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { responseStatusLabels } from "@/lib/constants";
import { renderSmartTemplate } from "@/lib/template-renderer";
import { cn } from "@/lib/utils";
import { buildWhatsAppClickToChatUrl, onlyDigits } from "@/lib/whatsapp-links";
import type { Lead, MessageEventType, MessageTemplate, ResponseStatus, WhatsAppMessage } from "@/types/database";

type LeadWithMessages = Lead & {
  whatsapp_messages?: WhatsAppMessage[];
};

type ConversationFilter = "all" | ResponseStatus;

const filters: Array<{ value: ConversationFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "sem_resposta", label: "Sem resposta" },
  { value: "respondeu", label: "Respondidas" },
  { value: "interessado", label: "Interessados" },
  { value: "sem_interesse", label: "Sem interesse" }
];

const quickReplies = [
  "Perfeito, posso te mostrar uma ideia simples.",
  "Claro, posso te mandar uma proposta.",
  "Voce ja tem um site hoje?",
  "Posso te mostrar um modelo para seu negocio."
];

const emojiOptions = ["😀", "🙂", "👏", "🚀", "💡", "✅", "📌", "🤝", "💬", "🔥"];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "L";
}

function getLastInteraction(lead: LeadWithMessages) {
  const lastMessage = lead.whatsapp_messages?.[0];
  return lastMessage?.created_at || lead.last_inbound_at || lead.last_whatsapp_sent_at || lead.updated_at || lead.created_at;
}

function formatChatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function responseBadgeClass(status: ResponseStatus) {
  const classes: Record<ResponseStatus, string> = {
    sem_resposta: "bg-slate-100 text-slate-600 ring-slate-200",
    respondeu: "bg-blue-100 text-blue-700 ring-blue-200",
    interessado: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    sem_interesse: "bg-rose-100 text-rose-700 ring-rose-200"
  };

  return classes[status];
}

function Avatar({ name, active = false }: { name: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 text-sm font-bold text-emerald-800 ring-1 ring-white",
        active && "from-emerald-500 to-teal-500 text-white"
      )}
    >
      {getInitials(name)}
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
    </div>
  );
}

function eventLabel(eventType?: MessageEventType) {
  const labels: Partial<Record<MessageEventType, string>> = {
    prepared: "Mensagem preparada",
    opened_whatsapp: "Aberta no WhatsApp",
    manual_sent: "Enviada manualmente",
    manual_response: "Resposta manual",
    api_sent: "Enviada via API",
    api_received: "Recebida via API",
    follow_up_scheduled: "Follow-up agendado",
    lead_interested: "Lead interessado",
    lead_not_interested: "Lead sem interesse"
  };

  return eventType ? labels[eventType] : undefined;
}

export function ConversationInbox({ leads, templates = [] }: { leads: LeadWithMessages[]; templates?: MessageTemplate[] }) {
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates.find((template) => template.is_default)?.id || templates[0]?.id || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [message, setMessage] = useState("");
  const [manualResponse, setManualResponse] = useState("");
  const [customFollowUpDate, setCustomFollowUpDate] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const router = useRouter();

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const haystack = `${lead.company_name} ${lead.niche || ""} ${lead.whatsapp || ""} ${lead.last_inbound_message || ""}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesFilter = filter === "all" || lead.response_status === filter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(getLastInteraction(b)).getTime() - new Date(getLastInteraction(a)).getTime());
  }, [filter, leads, search]);

  const selectedLead = useMemo(() => filteredLeads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0], [filteredLeads, selectedLeadId]);
  const messages = selectedLead?.whatsapp_messages || [];
  const unreadCount = leads.filter((lead) => lead.response_status === "sem_resposta").length;
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const previewMessage = selectedLead ? message || renderSmartTemplate(selectedTemplate?.content || "", selectedLead) : message;

  function setNotice(text: string, type: "success" | "error" | "info" = "info") {
    setFeedback(text);
    setFeedbackType(type);
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead || !message.trim()) return;

    setLoading(true);
    setNotice("", "info");

    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leadId: selectedLead.id,
        message
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setNotice(result.error || "Nao foi possivel enviar a resposta.", "error");
      return;
    }

    setMessage("");
    setShowEmojiPicker(false);
    setNotice("Resposta enviada pelo WhatsApp Business.", "success");
    router.refresh();
  }

  async function manualAction(
    action: "prepare" | "open_whatsapp" | "confirm_sent" | "manual_response" | "follow_up" | "mark_interested" | "mark_not_interested",
    customMessage = previewMessage,
    followUpDays?: number,
    followUpDate?: string
  ) {
    if (!selectedLead) return null;

    setLoading(true);
    setNotice("", "info");

    const response = await fetch("/api/communication/manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leadId: selectedLead.id,
        action,
        message: customMessage,
        followUpDays,
        followUpDate
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setNotice(result.error || "Nao foi possivel registrar a acao manual.", "error");
      return null;
    }

    router.refresh();
    return result as { whatsappUrl?: string; followUpDate?: string };
  }

  async function copyMessage() {
    if (!previewMessage.trim()) return;
    try {
      await navigator.clipboard.writeText(previewMessage);
      setNotice("Mensagem copiada.", "success");
    } catch {
      setNotice("Nao foi possivel copiar automaticamente. Selecione e copie manualmente.", "error");
    }
  }

  async function prepareMessage() {
    const result = await manualAction("prepare");
    if (result) setNotice("Mensagem preparada e salva no historico.", "success");
  }

  async function openAssistedWhatsApp() {
    const result = await manualAction("open_whatsapp");
    if (!result?.whatsappUrl) return;

    window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    setConfirmModalOpen(true);
    setNotice("Mensagem aberta no WhatsApp. Confirme depois de enviar.", "info");
  }

  async function confirmManualSent() {
    const result = await manualAction("confirm_sent");
    if (!result) return;
    setConfirmModalOpen(false);
    setMessage("");
    setNotice("Envio manual confirmado e funil atualizado.", "success");
  }

  async function addManualResponse() {
    if (!manualResponse.trim()) {
      setNotice("Digite a resposta recebida antes de salvar.", "error");
      return;
    }
    const result = await manualAction("manual_response", manualResponse);
    if (!result) return;
    setManualResponse("");
    setNotice("Resposta manual registrada.", "success");
  }

  async function scheduleFollowUp(days: number) {
    const result = await manualAction("follow_up", `Retornar em ${days} dia(s).`, days);
    if (result) setNotice(`Follow-up agendado para ${result.followUpDate}.`, "success");
  }

  async function scheduleCustomFollowUp() {
    if (!customFollowUpDate) {
      setNotice("Escolha uma data para o follow-up.", "error");
      return;
    }
    const result = await manualAction("follow_up", `Retorno manual agendado para ${customFollowUpDate}.`, undefined, customFollowUpDate);
    if (result) setNotice(`Follow-up agendado para ${result.followUpDate}.`, "success");
  }

  async function updateResponseStatus(status: ResponseStatus) {
    if (!selectedLead) return;
    setNotice("", "info");

    const response = await fetch("/api/leads/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        leadId: selectedLead.id,
        responseStatus: status
      })
    });

    const result = await response.json();
    if (!response.ok) {
      setNotice(result.error || "Nao foi possivel atualizar o status.", "error");
      return;
    }

    setNotice(status === "interessado" ? "Lead marcado como interessado." : "Status atualizado.", "success");
    router.refresh();
  }

  function openNormalWhatsApp() {
    if (!selectedLead?.whatsapp || !message.trim()) {
      setNotice("Escolha um lead com WhatsApp e escreva a mensagem.", "error");
      return;
    }

    const phone = onlyDigits(selectedLead.whatsapp);
    if (phone.length < 10) {
      setNotice("WhatsApp invalido. Use DDI + DDD + numero, por exemplo 5511999999999.", "error");
      return;
    }

    window.open(buildWhatsAppClickToChatUrl(phone, message), "_blank", "noopener,noreferrer");
    setNotice("Conversa aberta no WhatsApp normal. Envie manualmente depois de revisar.", "success");
  }

  function appendEmoji(emoji: string) {
    setMessage((current) => `${current}${emoji}`);
    setShowEmojiPicker(false);
  }

  if (!leads.length) {
    return (
      <div className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white shadow-soft">
        <div className="flex min-h-[520px] flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <MessageCircle size={30} />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">Nenhuma conversa encontrada</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">Cadastre leads com WhatsApp para responder contatos por aqui ou abrir conversas com mensagem pronta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="grid min-h-[720px] bg-slate-100 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex min-h-[360px] flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">CRM Inbox</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Conversas</h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {unreadCount} sem resposta
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-inner">
              <Search size={16} className="text-slate-400" />
              <Input
                className="h-7 border-0 bg-transparent p-0 text-sm focus:border-0 focus:ring-0"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar empresa, nicho ou telefone"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5",
                    filter === item.value ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {filteredLeads.map((lead) => {
              const lastMessage = lead.whatsapp_messages?.[0];
              const selected = selectedLead?.id === lead.id;
              const preview = lastMessage?.body || lead.last_inbound_message || "Nenhuma mensagem salva ainda.";

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={cn("group block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50", selected && "bg-emerald-50/80")}
                >
                  <div className="flex gap-3">
                    <Avatar name={lead.company_name} active={selected} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{lead.company_name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {lead.whatsapp || "Sem WhatsApp"} • {lead.niche || "Sem nicho"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-slate-400">{formatChatTime(getLastInteraction(lead))}</span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{preview}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", responseBadgeClass(lead.response_status))}>
                          {responseStatusLabels[lead.response_status]}
                        </span>
                        {lead.response_status === "interessado" ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Prioridade</span> : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {!filteredLeads.length ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Search size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-950">Nenhuma conversa neste filtro</h3>
                <p className="mt-1 text-sm text-slate-500">Tente outro status ou busque por empresa, telefone ou nicho.</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-slate-50">
          {!selectedLead ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Escolha uma conversa na lista ou ajuste os filtros.
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selectedLead.company_name} active />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-bold text-slate-950">{selectedLead.company_name}</h2>
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", responseBadgeClass(selectedLead.response_status))}>
                        {responseStatusLabels[selectedLead.response_status]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} />
                        {selectedLead.whatsapp || "Sem WhatsApp"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BriefcaseBusiness size={13} />
                        {selectedLead.niche || "Sem nicho"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => manualAction("mark_interested")}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5",
                      selectedLead.response_status === "interessado" ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    )}
                  >
                    Interessado
                  </button>
                  <button
                    type="button"
                    onClick={() => manualAction("mark_not_interested")}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5",
                      selectedLead.response_status === "sem_interesse" ? "bg-rose-600 text-white shadow-sm shadow-rose-200" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                    )}
                  >
                    Sem interesse
                  </button>
                  <Link href="/propostas" className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                    <FileText size={14} />
                    Criar proposta
                  </Link>
                </div>
              </header>

              <div className="relative flex-1 overflow-hidden bg-[#eef2e8]">
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#cbd5c6_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="relative h-full max-h-[520px] space-y-3 overflow-y-auto p-4 md:p-6">
                  {messages.length ? (
                    [...messages].reverse().map((item) => {
                      const outbound = item.direction === "outbound";

                      return (
                        <div key={item.id} className={cn("flex", outbound ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm md:max-w-[68%]",
                              item.event_type === "prepared" || item.direction === "system"
                                ? "mx-auto rounded-xl border border-dashed border-slate-300 bg-white/80 text-slate-600"
                                : outbound
                                  ? "rounded-br-md bg-[#dcf8c6] text-slate-900"
                                  : "rounded-bl-md bg-white text-slate-800"
                            )}
                          >
                            {eventLabel(item.event_type) ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{eventLabel(item.event_type)}</p> : null}
                            <p className="whitespace-pre-wrap">{item.body}</p>
                            <div className={cn("mt-1 flex items-center gap-1 text-[11px] text-slate-400", outbound ? "justify-end" : "justify-start")}>
                              <span>{formatChatTime(item.created_at)}</span>
                              {outbound ? item.provider_message_id ? <CheckCheck size={14} className="text-emerald-600" /> : <Check size={14} /> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[440px] items-center justify-center">
                      <div className="max-w-md rounded-2xl border border-white/70 bg-white/85 p-8 text-center shadow-sm backdrop-blur">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Sparkles size={26} />
                        </div>
                        <h3 className="mt-4 font-semibold text-slate-950">Comece esta conversa</h3>
                        <p className="mt-2 text-sm text-slate-500">Ainda nao ha mensagens salvas para este lead. Use uma resposta rapida, envie pelo Business ou abra no WhatsApp normal.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={sendReply} className="border-t border-slate-200 bg-white p-4">
                {templates.length ? (
                  <div className="mb-3 grid gap-2 md:grid-cols-[220px_1fr]">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Template
                      <select
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm normal-case text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        value={selectedTemplateId}
                        onChange={(event) => {
                          setSelectedTemplateId(event.target.value);
                          setMessage("");
                        }}
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.is_default ? " (padrao)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Previa</p>
                      <p className="mt-1 line-clamp-2">{previewMessage || "Escolha um template ou digite uma mensagem."}</p>
                    </div>
                  </div>
                ) : null}
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => setMessage(reply)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {feedback ? (
                  <div
                    className={cn(
                      "mb-3 rounded-lg px-3 py-2 text-sm",
                      feedbackType === "success" && "bg-emerald-50 text-emerald-700",
                      feedbackType === "error" && "bg-rose-50 text-rose-700",
                      feedbackType === "info" && "bg-slate-50 text-slate-600"
                    )}
                  >
                    {feedback}
                  </div>
                ) : null}

                <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((current) => !current)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-emerald-700"
                      aria-label="Adicionar emoji"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker ? (
                      <div className="absolute bottom-12 left-0 z-10 grid w-56 grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                        {emojiOptions.map((emoji) => (
                          <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} className="rounded-lg p-2 text-lg transition hover:bg-slate-100">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotice("Anexos ainda nao enviam arquivos. Use este botao como atalho visual por enquanto.", "info")}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800"
                    aria-label="Anexar arquivo"
                  >
                    <Paperclip size={20} />
                  </button>

                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Digite sua resposta para o lead..."
                    className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm focus:border-0 focus:ring-0"
                  />

                  <Button disabled={loading || !selectedLead.whatsapp || !message.trim()} className="h-10 rounded-full bg-emerald-600 px-4 hover:bg-emerald-700">
                    {loading ? <Loader2 size={17} className="mr-2 animate-spin" /> : <Send size={17} className="mr-2" />}
                    <span className="hidden sm:inline">{loading ? "Enviando..." : "Enviar Business"}</span>
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock3 size={14} />
                    Manual Assistido: revise, abra o WhatsApp e confirme o envio.
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={prepareMessage} disabled={loading || !previewMessage.trim()} className="font-semibold text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300">
                      Marcar preparada
                    </button>
                    <button type="button" onClick={copyMessage} disabled={!previewMessage.trim()} className="inline-flex items-center gap-1 font-semibold text-slate-700 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300">
                      <Copy size={13} />
                      Copiar
                    </button>
                    <button type="button" onClick={openAssistedWhatsApp} disabled={loading || !selectedLead.whatsapp || !previewMessage.trim()} className="font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-300">
                      Abrir no WhatsApp
                    </button>
                    <button type="button" onClick={() => scheduleFollowUp(1)} className="font-semibold text-blue-700 transition hover:text-blue-800">
                      Follow-up amanha
                    </button>
                    <button type="button" onClick={() => scheduleFollowUp(3)} className="font-semibold text-blue-700 transition hover:text-blue-800">
                      3 dias
                    </button>
                    <button type="button" onClick={() => scheduleFollowUp(7)} className="font-semibold text-blue-700 transition hover:text-blue-800">
                      7 dias
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicionar resposta manual</p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <Input value={manualResponse} onChange={(event) => setManualResponse(event.target.value)} placeholder="Ex: Tenho interesse, pode mandar proposta." />
                    <Button type="button" variant="secondary" onClick={addManualResponse} disabled={loading || !manualResponse.trim()}>
                      Salvar resposta
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:flex-row md:items-end">
                  <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Data personalizada de follow-up
                    <Input className="mt-1" type="date" value={customFollowUpDate} onChange={(event) => setCustomFollowUpDate(event.target.value)} />
                  </label>
                  <Button type="button" variant="secondary" onClick={scheduleCustomFollowUp} disabled={loading || !customFollowUpDate}>
                    Agendar follow-up
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
      {confirmModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle size={24} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-950">Mensagem aberta no WhatsApp</h2>
            <p className="mt-2 text-sm text-slate-600">Depois de enviar manualmente no WhatsApp, confirme abaixo para atualizar o historico e mover o lead no funil.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={confirmManualSent} disabled={loading}>
                Marcar como enviado
              </Button>
              <Button type="button" variant="secondary" onClick={copyMessage}>
                Copiar mensagem
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmModalOpen(false)}>
                Ainda nao enviei
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
