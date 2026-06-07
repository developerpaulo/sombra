"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Copy, ExternalLink, Flame, Loader2, MessageCircle, PlusCircle, Radar, Search, Sparkles, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { leadStatuses } from "@/lib/constants";
import { generateMessageFromTemplate } from "@/lib/message-service";
import { calculateOpportunityScore, scoreToOpportunity } from "@/lib/opportunity-score";
import { generateOpportunityAnalysis, getTemperature, temperatureClasses, temperatureIcon } from "@/lib/opportunity-service";
import { normalizeBrazilianPhone } from "@/lib/phone";
import { generateSearchQueries, type SearchQueryCard } from "@/lib/search-link-service";
import { createClient } from "@/lib/supabase/browser";
import { addDaysISO, todayISO } from "@/lib/utils";
import { createManualWhatsAppLink } from "@/lib/whatsapp-manual-service";
import type { Lead, LeadFormData, MessageTemplate } from "@/types/database";

type Tab = "radar" | "cadastro" | "analise" | "mensagem" | "top";
type MessageType = "abordagem" | "followup" | "proposta" | "objecao" | "reativacao";

const opportunityTypes = [
  "Empresas sem site",
  "Empresas com site antigo",
  "Empresas que usam so Instagram",
  "Empresas com WhatsApp visivel",
  "Empresas com baixa presenca digital",
  "Empresas locais com alto potencial"
];

const emptyLead: LeadFormData = {
  company_name: "",
  contact_name: "",
  niche: "",
  city: "",
  state: "",
  whatsapp: "",
  email: "",
  instagram: "",
  current_site: "",
  notes: "",
  whatsapp_opt_in: false,
  auto_message_enabled: false,
  status: "Novo",
  last_contact_date: "",
  next_follow_up_date: "",
  signal_no_site: false,
  signal_old_site: false,
  signal_slow_site: false,
  signal_not_responsive: false,
  signal_no_https: false,
  signal_only_instagram: false,
  signal_has_whatsapp: false,
  signal_good_presence: false,
  signal_weak_presence: false,
  signal_good_reviews: false,
  signal_competitive_region: false,
  signal_good_client: false,
  signal_high_closing_chance: false
};

function todayFromIso(value?: string | null) {
  return Boolean(value && value.slice(0, 10) === todayISO());
}

function potentialArgument(ticket: number, extraClients: number) {
  const gain = ticket * extraClients;
  return {
    gain,
    text: `Esse cliente poderia gerar aproximadamente R$ ${gain.toLocaleString("pt-BR")} a mais por mes com uma presenca online melhor. Mesmo poucos clientes novos pelo Google e WhatsApp podem pagar o investimento.`
  };
}

function signalItems() {
  return [
    ["signal_no_site", "Nao tem site", 25],
    ["signal_old_site", "Site antigo", 20],
    ["signal_slow_site", "Site lento", 10],
    ["signal_not_responsive", "Site nao responsivo", 15],
    ["signal_no_https", "Site sem HTTPS", 10],
    ["signal_only_instagram", "So tem Instagram", 15],
    ["signal_has_whatsapp", "Tem WhatsApp", 10],
    ["signal_weak_presence", "Presenca digital fraca", 15],
    ["signal_good_reviews", "Boa avaliacao online", 10],
    ["signal_competitive_region", "Regiao competitiva", 10],
    ["signal_good_client", "Parece bom cliente", 15],
    ["signal_high_closing_chance", "Alta chance de fechar", 20]
  ] as const;
}

export function OpportunityRadar({ initialLeads, templates }: { initialLeads: Lead[]; templates: MessageTemplate[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const [niche, setNiche] = useState("hamburgueria");
  const [city, setCity] = useState("Brasilia");
  const [state, setState] = useState("DF");
  const [service, setService] = useState("site profissional com botao para WhatsApp");
  const [opportunityType, setOpportunityType] = useState(opportunityTypes[0]);
  const [missionCount, setMissionCount] = useState(10);
  const [missionGenerated, setMissionGenerated] = useState(false);
  const [queries, setQueries] = useState<SearchQueryCard[]>([]);
  const [leadForm, setLeadForm] = useState<LeadFormData>(emptyLead);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [savedLead, setSavedLead] = useState<Lead | null>(null);
  const [messageType, setMessageType] = useState<MessageType>("abordagem");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates.find((template) => template.is_default)?.id || templates[0]?.id || "");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(80);
  const [extraClients, setExtraClients] = useState(20);
  const [myServiceValue, setMyServiceValue] = useState(1500);
  const router = useRouter();
  const supabase = createClient();

  const score = calculateOpportunityScore(leadForm);
  const temperature = getTemperature(score);
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const generatedMessage = generateMessageFromTemplate({ lead: { ...leadForm, opportunity_score: score }, template: selectedTemplate, service, type: messageType });
  const topLeads = [...initialLeads].sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)).slice(0, 8);
  const potential = potentialArgument(ticket, extraClients);

  const metrics = useMemo(() => {
    const todayLeads = initialLeads.filter((lead) => todayFromIso(lead.created_at)).length;
    const hot = initialLeads.filter((lead) => (lead.opportunity_score ?? 0) >= 70).length;
    const followUps = initialLeads.filter((lead) => lead.next_follow_up_date && lead.next_follow_up_date <= todayISO()).length;
    const prepared = initialLeads.filter((lead) => lead.status === "Mensagem pronta").length;
    const opened = initialLeads.filter((lead) => lead.status === "Aberto no WhatsApp").length;
    return { todayLeads, hot, followUps, prepared, opened };
  }, [initialLeads]);

  function updateLead<K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) {
    setLeadForm((current) => ({ ...current, [key]: value }));
  }

  function generateMission() {
    setMissionGenerated(true);
    setQueries(generateSearchQueries({ niche, city, state, service, opportunityType }));
    setFeedback(`Missao criada: encontrar ${missionCount} ${niche} em ${city} com potencial para contratar ${service}.`);
  }

  function clearMission() {
    setMissionGenerated(false);
    setQueries([]);
    setFeedback("");
  }

  async function copyText(text: string, label = "Texto copiado.") {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(label);
    } catch {
      setFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  function openLeadModal(query?: SearchQueryCard) {
    setLeadForm((current) => ({
      ...current,
      niche,
      city,
      state,
      notes: query ? `Lead encontrado a partir da busca: ${query.query}` : current.notes,
      signal_no_site: opportunityType.includes("sem site") || current.signal_no_site,
      signal_old_site: opportunityType.includes("site antigo") || current.signal_old_site,
      signal_only_instagram: opportunityType.includes("Instagram") || current.signal_only_instagram,
      signal_has_whatsapp: opportunityType.includes("WhatsApp") || current.signal_has_whatsapp,
      signal_weak_presence: opportunityType.includes("baixa presenca") || current.signal_weak_presence,
      signal_good_client: opportunityType.includes("alto potencial") || current.signal_good_client
    }));
    setLeadModalOpen(true);
    setActiveTab("cadastro");
  }

  async function findDuplicate(phone: string | null) {
    const checks = [];
    if (phone) checks.push(await supabase.from("leads").select("id, company_name").eq("whatsapp", phone).limit(1));
    if (leadForm.company_name) checks.push(await supabase.from("leads").select("id, company_name").ilike("company_name", leadForm.company_name).limit(1));
    if (leadForm.instagram) checks.push(await supabase.from("leads").select("id, company_name").eq("instagram", leadForm.instagram).limit(1));
    if (leadForm.current_site) checks.push(await supabase.from("leads").select("id, company_name").eq("current_site", leadForm.current_site).limit(1));
    if (leadForm.email) checks.push(await supabase.from("leads").select("id, company_name").eq("email", leadForm.email).limit(1));
    return checks.find((result) => result.data?.length)?.data?.[0] as { id: string; company_name: string } | undefined;
  }

  async function saveLead(prepareAfterSave = false, force = false) {
    setLoading(true);
    setFeedback("");
    setDuplicateWarning("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setFeedback("Sessao expirada. Entre novamente.");
      return;
    }

    const phone = leadForm.whatsapp ? normalizeBrazilianPhone(leadForm.whatsapp) : null;
    if (phone && !phone.ok) {
      setLoading(false);
      setFeedback(phone.error || "WhatsApp invalido.");
      return;
    }

    if (!force) {
      const duplicate = await findDuplicate(phone?.phone || null);
      if (duplicate) {
        setLoading(false);
        setDuplicateWarning(`Este lead parece ja existir: ${duplicate.company_name}. Deseja salvar mesmo assim?`);
        return;
      }
    }

    const opportunityScore = calculateOpportunityScore(leadForm);
    const payload = {
      user_id: user.id,
      company_name: leadForm.company_name,
      contact_name: leadForm.contact_name || null,
      niche: leadForm.niche || null,
      city: leadForm.city || null,
      state: leadForm.state || null,
      whatsapp: phone?.phone || null,
      email: leadForm.email || null,
      instagram: leadForm.instagram || null,
      current_site: leadForm.current_site || null,
      notes: leadForm.notes || null,
      status: prepareAfterSave ? "Mensagem pronta" : leadForm.status,
      last_contact_date: leadForm.last_contact_date || todayISO(),
      next_follow_up_date: leadForm.next_follow_up_date || null,
      generated_message: prepareAfterSave ? generatedMessage : null,
      opportunity_score: opportunityScore,
      opportunity: scoreToOpportunity(opportunityScore),
      signal_no_site: Boolean(leadForm.signal_no_site),
      signal_old_site: Boolean(leadForm.signal_old_site),
      signal_slow_site: Boolean(leadForm.signal_slow_site),
      signal_not_responsive: Boolean(leadForm.signal_not_responsive),
      signal_no_https: Boolean(leadForm.signal_no_https),
      signal_only_instagram: Boolean(leadForm.signal_only_instagram),
      signal_has_whatsapp: Boolean(leadForm.signal_has_whatsapp),
      signal_good_presence: Boolean(leadForm.signal_good_presence),
      signal_weak_presence: Boolean(leadForm.signal_weak_presence),
      signal_good_reviews: Boolean(leadForm.signal_good_reviews),
      signal_competitive_region: Boolean(leadForm.signal_competitive_region),
      signal_good_client: Boolean(leadForm.signal_good_client),
      signal_high_closing_chance: Boolean(leadForm.signal_high_closing_chance)
    };

    const { data, error } = await supabase.from("leads").insert(payload).select("*").single();
    setLoading(false);

    if (error) {
      setFeedback("Nao foi possivel salvar o lead. Confira os campos.");
      return;
    }

    setSavedLead(data as Lead);
    setLeadModalOpen(false);
    setMessage(prepareAfterSave ? generatedMessage : "");
    setFeedback(prepareAfterSave ? "Lead salvo e mensagem preparada." : "Lead salvo com sucesso.");
    router.refresh();
  }

  function runAnalysis() {
    setActiveTab("analise");
    setFeedback("Analise gerada com regras locais.");
  }

  function prepareMessage() {
    setMessage(generatedMessage);
    setActiveTab("mensagem");
    setFeedback("Mensagem preparada. Revise antes de usar.");
  }

  async function registerManualEvent(action: "prepare" | "open_whatsapp" | "confirm_sent" | "follow_up", customMessage = message || generatedMessage) {
    if (!savedLead) {
      setFeedback("Salve o lead antes de registrar historico.");
      return null;
    }
    const response = await fetch("/api/communication/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: savedLead.id, action, message: customMessage, followUpDays: 3 })
    });
    const result = await response.json();
    if (!response.ok) {
      setFeedback(result.error || "Nao foi possivel registrar a acao.");
      return null;
    }
    router.refresh();
    return result;
  }

  async function openWhatsApp() {
    const text = message || generatedMessage;
    const phone = savedLead?.whatsapp || leadForm.whatsapp;
    const link = createManualWhatsAppLink(phone || "", text);
    if (!link.ok) {
      setFeedback(link.error);
      return;
    }
    if (savedLead) await registerManualEvent("open_whatsapp", text);
    window.open(link.url, "_blank", "noopener,noreferrer");
    setConfirmOpen(true);
    setFeedback("WhatsApp aberto. Confirme depois de enviar.");
  }

  async function confirmSent() {
    await registerManualEvent("confirm_sent", message || generatedMessage);
    setConfirmOpen(false);
    setFeedback("Mensagem marcada como enviada manualmente.");
  }

  const analysisLead: Lead = {
    ...(savedLead || ({} as Lead)),
    ...leadForm,
    id: savedLead?.id || "preview",
    user_id: savedLead?.user_id || "",
    company_name: leadForm.company_name || savedLead?.company_name || "Lead em analise",
    contact_name: leadForm.contact_name || savedLead?.contact_name || null,
    niche: leadForm.niche || savedLead?.niche || null,
    city: leadForm.city || savedLead?.city || null,
    state: leadForm.state || savedLead?.state || null,
    whatsapp: leadForm.whatsapp || savedLead?.whatsapp || null,
    email: leadForm.email || savedLead?.email || null,
    instagram: leadForm.instagram || savedLead?.instagram || null,
    current_site: leadForm.current_site || savedLead?.current_site || null,
    notes: leadForm.notes || savedLead?.notes || null,
    whatsapp_opt_in: false,
    auto_message_enabled: false,
    response_status: savedLead?.response_status || "sem_resposta",
    status: leadForm.status,
    opportunity: scoreToOpportunity(score),
    opportunity_score: score,
    last_contact_date: leadForm.last_contact_date || null,
    next_follow_up_date: leadForm.next_follow_up_date || null,
    generated_message: message || generatedMessage,
    last_whatsapp_sent_at: null,
    last_inbound_message: null,
    last_inbound_at: null,
    external_source: null,
    external_id: null,
    source_url: null,
    created_at: savedLead?.created_at || new Date().toISOString(),
    updated_at: savedLead?.updated_at || new Date().toISOString(),
    signal_no_site: Boolean(leadForm.signal_no_site),
    signal_old_site: Boolean(leadForm.signal_old_site),
    signal_slow_site: Boolean(leadForm.signal_slow_site),
    signal_not_responsive: Boolean(leadForm.signal_not_responsive),
    signal_no_https: Boolean(leadForm.signal_no_https),
    signal_only_instagram: Boolean(leadForm.signal_only_instagram),
    signal_has_whatsapp: Boolean(leadForm.signal_has_whatsapp),
    signal_good_presence: Boolean(leadForm.signal_good_presence),
    signal_weak_presence: Boolean(leadForm.signal_weak_presence),
    signal_good_reviews: Boolean(leadForm.signal_good_reviews),
    signal_competitive_region: Boolean(leadForm.signal_competitive_region),
    signal_good_client: Boolean(leadForm.signal_good_client),
    signal_high_closing_chance: Boolean(leadForm.signal_high_closing_chance)
  };
  const analysis = generateOpportunityAnalysis(analysisLead);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "radar", label: "Radar" },
    { id: "cadastro", label: "Cadastro rapido" },
    { id: "analise", label: "Analise" },
    { id: "mensagem", label: "Mensagem" },
    { id: "top", label: "Top oportunidades" }
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <Radar size={14} />
                Maquina de aquisicao
              </p>
              <h1 className="mt-4 text-2xl font-bold md:text-3xl">Radar de Oportunidades</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">Encontre, analise e aborde empresas com potencial para contratar sites profissionais.</p>
            </div>
            <Button type="button" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setLeadModalOpen(true)}>
              <PlusCircle size={16} className="mr-2" />
              Criar lead
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Oportunidades hoje", queries.length],
            ["Leads quentes", metrics.hot],
            ["Leads cadastrados", initialLeads.length],
            ["Follow-ups", metrics.followUps],
            ["Mensagens prontas", metrics.prepared],
            ["WhatsApps abertos", metrics.opened]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {feedback ? <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div> : null}

      {activeTab === "radar" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Target size={22} /></div>
              <div>
                <h2 className="font-bold text-slate-950">Missao do Dia</h2>
                <p className="text-sm text-slate-500">Defina uma tarefa clara de prospeccao.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div><Label>Nicho alvo</Label><Input value={niche} onChange={(event) => setNiche(event.target.value)} /></div>
              <div><Label>Cidade alvo</Label><Input value={city} onChange={(event) => setCity(event.target.value)} /></div>
              <div><Label>Quantidade desejada</Label><Input type="number" min="1" value={missionCount} onChange={(event) => setMissionCount(Number(event.target.value))} /></div>
              <div><Label>Servico oferecido</Label><Input value={service} onChange={(event) => setService(event.target.value)} /></div>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              Hoje sua missao e encontrar <strong>{missionCount} {niche}</strong> em <strong>{city}</strong> com potencial para contratar <strong>{service}</strong>.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={generateMission}>Gerar missao</Button>
              <Button type="button" variant="secondary" onClick={generateMission}>Iniciar busca</Button>
              <Button type="button" variant="ghost" onClick={clearMission}>Limpar</Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Search size={22} /></div>
              <div>
                <h2 className="font-bold text-slate-950">Busca inteligente</h2>
                <p className="text-sm text-slate-500">Gere links prontos sem scraping e sem API obrigatoria.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div><Label>Nicho</Label><Input value={niche} onChange={(event) => setNiche(event.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={city} onChange={(event) => setCity(event.target.value)} /></div>
              <div><Label>Estado</Label><Input value={state} onChange={(event) => setState(event.target.value)} /></div>
              <div>
                <Label>Tipo de oportunidade</Label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={opportunityType} onChange={(event) => setOpportunityType(event.target.value)}>
                  {opportunityTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><Label>Servico oferecido</Label><Input value={service} onChange={(event) => setService(event.target.value)} /></div>
            </div>
            <Button type="button" className="mt-5 w-full py-3 text-base" onClick={generateMission}>Encontrar oportunidades</Button>
          </section>

          <section className="xl:col-span-2">
            {queries.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {queries.map((query) => (
                  <article key={`${query.source}-${query.query}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-emerald-200">
                    <p className="font-bold text-slate-950">{query.source}</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">"{query.query}"</p>
                    <p className="mt-2 text-sm text-slate-500">{query.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={query.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><ExternalLink size={13} /> Abrir pesquisa</a>
                      <button type="button" onClick={() => copyText(query.query, "Busca copiada.")} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Copy size={13} /> Copiar busca</button>
                      <button type="button" onClick={() => openLeadModal(query)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><PlusCircle size={13} /> Criar lead</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                <Sparkles className="mx-auto text-emerald-600" size={34} />
                <p className="mt-3 font-semibold text-slate-900">Nenhuma busca gerada ainda</p>
                <p className="mt-1">Preencha nicho e cidade para gerar oportunidades de pesquisa manual.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "cadastro" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Cadastro rapido de lead</h2>
              <p className="text-sm text-slate-500">Use o modal para evitar uma tela poluida.</p>
            </div>
            <Button type="button" onClick={() => setLeadModalOpen(true)}><PlusCircle size={16} className="mr-2" /> Abrir cadastro</Button>
          </div>
          {savedLead ? <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Lead salvo: {savedLead.company_name}. Agora voce pode analisar, preparar mensagem e abrir WhatsApp.</p> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Nenhum lead salvo nesta sessao ainda.</p>}
        </section>
      ) : null}

      {activeTab === "analise" ? (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-slate-950">Detector de Oportunidade</h2>
            <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Score de Oportunidade</p>
              <p className="mt-2 text-4xl font-bold">{score}/100</p>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${temperatureClasses(score)}`}>{temperatureIcon(score)} {temperature}</span>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {signalItems().map(([key, label, points]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                  <span><input className="mr-2 h-4 w-4" type="checkbox" checked={Boolean(leadForm[key])} onChange={(event) => updateLead(key, event.target.checked)} />{label}</span>
                  <span className="text-xs font-semibold text-emerald-700">+{points}</span>
                </label>
              ))}
            </div>
            <Button type="button" className="mt-5" onClick={runAnalysis}>Analisar oportunidade</Button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="font-bold text-slate-950">Analise estrategica</h2>
            <p className="mt-2 text-sm text-slate-500">{analysis.summary}</p>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-950">Abordagem recomendada</p>
              <p className="mt-2 text-sm text-emerald-800">{analysis.approach}</p>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Motivos para abordar</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">{(analysis.reasons.length ? analysis.reasons : ["Preencha os sinais para gerar uma analise melhor."]).map((item) => <li key={item}>- {item}</li>)}</ul>
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 p-4">
              <p className="font-semibold text-amber-950">Objeção provável</p>
              <p className="mt-2 text-sm text-amber-800">"Ja tenho Instagram."</p>
              <p className="mt-3 font-semibold text-amber-950">Resposta sugerida</p>
              <p className="mt-1 text-sm text-amber-800">O Instagram ajuda, mas um site profissional passa mais confianca, aparece no Google e organiza servicos, localizacao e WhatsApp em um so lugar.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:col-span-2">
            <h2 className="font-bold text-slate-950">Potencial do cliente</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div><Label>Ticket medio</Label><Input type="number" value={ticket} onChange={(event) => setTicket(Number(event.target.value))} /></div>
              <div><Label>Clientes extras/mes</Label><Input type="number" value={extraClients} onChange={(event) => setExtraClients(Number(event.target.value))} /></div>
              <div><Label>Valor do seu servico</Label><Input type="number" value={myServiceValue} onChange={(event) => setMyServiceValue(Number(event.target.value))} /></div>
              <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Ganho estimado</p><p className="mt-1 text-2xl font-bold text-emerald-800">R$ {potential.gain.toLocaleString("pt-BR")}</p></div>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{potential.text} Seu servico de R$ {myServiceValue.toLocaleString("pt-BR")} pode ser apresentado como investimento para gerar novos contatos.</p>
          </div>
        </section>
      ) : null}

      {activeTab === "mensagem" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">Gerador de mensagens</h2>
              <p className="text-sm text-slate-500">Revise tudo antes de copiar ou abrir no WhatsApp.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Manual Assistido</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <Label>Tipo de mensagem</Label>
              <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={messageType} onChange={(event) => setMessageType(event.target.value as MessageType)}>
                <option value="abordagem">Primeira abordagem</option>
                <option value="followup">Follow-up</option>
                <option value="proposta">Proposta inicial</option>
                <option value="objecao">Resposta para objecao</option>
                <option value="reativacao">Reativacao</option>
              </select>
            </div>
            <div>
              <Label>Template</Label>
              <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                <option value="">Modelo automatico</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </div>
            <div className="flex items-end"><Button type="button" variant="secondary" onClick={prepareMessage}>Gerar mensagem</Button></div>
          </div>
          <Textarea className="mt-4 min-h-44" value={message || generatedMessage} onChange={(event) => setMessage(event.target.value)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => copyText(message || generatedMessage, "Mensagem copiada.")}><Copy size={16} className="mr-2" /> Copiar mensagem</Button>
            <Button type="button" onClick={openWhatsApp}><MessageCircle size={16} className="mr-2" /> Abrir no WhatsApp</Button>
            <Button type="button" variant="ghost" onClick={() => registerManualEvent("prepare", message || generatedMessage)}>Salvar no historico</Button>
            <Button type="button" variant="ghost" onClick={() => registerManualEvent("follow_up", "Follow-up agendado em 3 dias")}>Agendar follow-up</Button>
          </div>
        </section>
      ) : null}

      {activeTab === "top" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="font-bold text-slate-950">Top oportunidades</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topLeads.length ? topLeads.map((lead) => {
              const leadAnalysis = generateOpportunityAnalysis(lead);
              return (
                <article key={lead.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">{lead.company_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{lead.niche || "Sem nicho"} · {lead.city || "Sem cidade"}</p>
                  <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${temperatureClasses(lead.opportunity_score)}`}>{temperatureIcon(lead.opportunity_score)} Score {lead.opportunity_score ?? 0}</span>
                  <p className="mt-3 text-sm text-slate-600">Motivo: {leadAnalysis.mainProblem}</p>
                  <p className="mt-1 text-sm text-slate-600">Acao: {leadAnalysis.approach}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setSavedLead(lead); setLeadForm({ ...emptyLead, company_name: lead.company_name, contact_name: lead.contact_name || "", niche: lead.niche || "", city: lead.city || "", state: lead.state || "", whatsapp: lead.whatsapp || "", email: lead.email || "", instagram: lead.instagram || "", current_site: lead.current_site || "", notes: lead.notes || "", status: lead.status }); setActiveTab("mensagem"); }} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Preparar mensagem</button>
                    <button type="button" onClick={() => { setSavedLead(lead); setActiveTab("mensagem"); }} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Abrir WhatsApp</button>
                  </div>
                </article>
              );
            }) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-4">Nenhuma oportunidade quente ainda.</div>}
          </div>
        </section>
      ) : null}

      {leadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-slate-950">Cadastro rapido de lead</h2><p className="text-sm text-slate-500">Preencha o essencial agora. Voce pode completar depois.</p></div>
              <button type="button" onClick={() => setLeadModalOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            {duplicateWarning ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {duplicateWarning}
                <div className="mt-3 flex gap-2"><Button type="button" variant="secondary" onClick={() => saveLead(false, true)}>Salvar mesmo assim</Button><Button type="button" variant="ghost" onClick={() => setDuplicateWarning("")}>Corrigir</Button></div>
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div><Label>Nome da empresa</Label><Input value={leadForm.company_name} onChange={(event) => updateLead("company_name", event.target.value)} required /></div>
              <div><Label>Nome do responsavel</Label><Input value={leadForm.contact_name} onChange={(event) => updateLead("contact_name", event.target.value)} /></div>
              <div><Label>Nicho</Label><Input value={leadForm.niche} onChange={(event) => updateLead("niche", event.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={leadForm.city} onChange={(event) => updateLead("city", event.target.value)} /></div>
              <div><Label>Estado</Label><Input value={leadForm.state} onChange={(event) => updateLead("state", event.target.value)} /></div>
              <div><Label>WhatsApp</Label><Input value={leadForm.whatsapp} onChange={(event) => updateLead("whatsapp", event.target.value)} /></div>
              <div><Label>Instagram</Label><Input value={leadForm.instagram} onChange={(event) => updateLead("instagram", event.target.value)} /></div>
              <div><Label>Site</Label><Input value={leadForm.current_site} onChange={(event) => updateLead("current_site", event.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" value={leadForm.email} onChange={(event) => updateLead("email", event.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={leadForm.status} onChange={(event) => updateLead("status", event.target.value as LeadFormData["status"])}>
                  {leadStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div><Label>Ultimo contato</Label><Input type="date" value={leadForm.last_contact_date} onChange={(event) => updateLead("last_contact_date", event.target.value)} /></div>
              <div><Label>Proximo follow-up</Label><Input type="date" value={leadForm.next_follow_up_date} onChange={(event) => updateLead("next_follow_up_date", event.target.value)} /></div>
              <div className="md:col-span-3"><Label>Observacoes</Label><Textarea value={leadForm.notes} onChange={(event) => updateLead("notes", event.target.value)} /></div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-bold text-slate-950">Detector de Oportunidade</p><p className="text-sm text-slate-500">Marque os sinais encontrados.</p></div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${temperatureClasses(score)}`}>{temperatureIcon(score)} {temperature} · {score}/100</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {signalItems().map(([key, label, points]) => (
                  <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <span><input className="mr-2 h-4 w-4" type="checkbox" checked={Boolean(leadForm[key])} onChange={(event) => updateLead(key, event.target.checked)} />{label}</span>
                    <span className="text-xs font-semibold text-emerald-700">+{points}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" disabled={loading || !leadForm.company_name} onClick={() => saveLead(false)}>{loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <CheckCircle2 size={16} className="mr-2" />} Salvar lead</Button>
              <Button type="button" variant="secondary" disabled={loading || !leadForm.company_name} onClick={() => saveLead(true)}>Salvar e preparar mensagem</Button>
              <Button type="button" variant="ghost" onClick={() => setLeadModalOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <MessageCircle className="text-emerald-600" size={30} />
            <h2 className="mt-4 text-lg font-bold text-slate-950">A mensagem foi aberta no WhatsApp</h2>
            <p className="mt-2 text-sm text-slate-600">Depois de enviar, confirme abaixo para registrar no historico.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={confirmSent}>Marcar como enviado</Button>
              <Button type="button" variant="secondary" onClick={() => copyText(message || generatedMessage, "Mensagem copiada.")}>Copiar mensagem</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>Ainda nao enviei</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
