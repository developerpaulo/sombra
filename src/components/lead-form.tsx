"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { leadStatuses } from "@/lib/constants";
import { classifyLead, generateWhatsAppMessage } from "@/lib/lead-ai";
import { calculateOpportunityScore, scoreToOpportunity } from "@/lib/opportunity-score";
import { normalizeBrazilianPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/browser";
import { addDaysISO, todayISO } from "@/lib/utils";
import type { Lead, LeadFormData } from "@/types/database";

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

function toFormData(lead?: Lead): LeadFormData {
  if (!lead) return emptyLead;
  return {
    company_name: lead.company_name,
    contact_name: lead.contact_name ?? "",
    niche: lead.niche ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    instagram: lead.instagram ?? "",
    current_site: lead.current_site ?? "",
    notes: lead.notes ?? "",
    whatsapp_opt_in: lead.whatsapp_opt_in ?? false,
    auto_message_enabled: lead.auto_message_enabled ?? false,
    status: lead.status,
    last_contact_date: lead.last_contact_date ?? "",
    next_follow_up_date: lead.next_follow_up_date ?? "",
    signal_no_site: lead.signal_no_site ?? false,
    signal_old_site: lead.signal_old_site ?? false,
    signal_slow_site: lead.signal_slow_site ?? false,
    signal_not_responsive: lead.signal_not_responsive ?? false,
    signal_no_https: lead.signal_no_https ?? false,
    signal_only_instagram: lead.signal_only_instagram ?? false,
    signal_has_whatsapp: lead.signal_has_whatsapp ?? false,
    signal_good_presence: lead.signal_good_presence ?? false,
    signal_weak_presence: lead.signal_weak_presence ?? false,
    signal_good_reviews: lead.signal_good_reviews ?? false,
    signal_competitive_region: lead.signal_competitive_region ?? false,
    signal_good_client: lead.signal_good_client ?? false,
    signal_high_closing_chance: lead.signal_high_closing_chance ?? false
  };
}

export function LeadForm({ lead, compact = false }: { lead?: Lead; compact?: boolean }) {
  const [form, setForm] = useState<LeadFormData>(toFormData(lead));
  const [message, setMessage] = useState(lead?.generated_message ?? "");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function updateField<K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setFollowUp(days: number) {
    updateField("next_follow_up_date", addDaysISO(days));
  }

  function handleGenerateMessage() {
    const generated = generateWhatsAppMessage(form);
    setMessage(generated);
    updateField("status", "Mensagem pronta");
  }

  async function saveFollowUp(userId: string, leadId: string) {
    if (!form.next_follow_up_date) return;
    const { error } = await supabase
      .from("follow_ups")
      .upsert(
        {
          user_id: userId,
          lead_id: leadId,
          due_date: form.next_follow_up_date,
          note: "Proximo contato agendado",
          completed: false
        },
        {
          onConflict: "lead_id,due_date"
        }
      );
    return error;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setFeedback("Sessao expirada. Entre novamente.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      contact_name: form.contact_name || null,
      niche: form.niche || null,
      city: form.city || null,
      state: form.state || null,
      whatsapp: form.whatsapp ? normalizeBrazilianPhone(form.whatsapp).phone : null,
      email: form.email || null,
      instagram: form.instagram || null,
      current_site: form.current_site || null,
      notes: form.notes || null,
      whatsapp_opt_in: form.whatsapp_opt_in,
      auto_message_enabled: form.auto_message_enabled,
      last_contact_date: form.last_contact_date || null,
      next_follow_up_date: form.next_follow_up_date || null,
      generated_message: message || null,
      opportunity_score: calculateOpportunityScore(form),
      opportunity: scoreToOpportunity(calculateOpportunityScore(form)) || classifyLead(form),
      updated_at: new Date().toISOString()
    };

    if (form.whatsapp) {
      const phone = normalizeBrazilianPhone(form.whatsapp);
      if (!phone.ok) {
        setLoading(false);
        setFeedback(phone.error || "WhatsApp invalido.");
        return;
      }
    }

    if (!lead) {
      const duplicateResults = [];
      if (payload.whatsapp) duplicateResults.push(await supabase.from("leads").select("id").eq("user_id", user.id).eq("whatsapp", payload.whatsapp).limit(1));
      if (form.company_name) duplicateResults.push(await supabase.from("leads").select("id").eq("user_id", user.id).ilike("company_name", form.company_name).limit(1));
      if (form.instagram) duplicateResults.push(await supabase.from("leads").select("id").eq("user_id", user.id).eq("instagram", form.instagram).limit(1));
      if (form.current_site) duplicateResults.push(await supabase.from("leads").select("id").eq("user_id", user.id).eq("current_site", form.current_site).limit(1));
      if (form.email) duplicateResults.push(await supabase.from("leads").select("id").eq("user_id", user.id).eq("email", form.email).limit(1));

      if (duplicateResults.some((result) => result.data?.length)) {
        setLoading(false);
        setFeedback("Possivel duplicado encontrado por telefone, empresa, Instagram ou site.");
        return;
      }
    }

    const request = lead
      ? supabase.from("leads").update(payload).eq("id", lead.id).select("id").single()
      : supabase
          .from("leads")
          .insert({ ...payload, user_id: user.id, last_contact_date: payload.last_contact_date || todayISO() })
          .select("id")
          .single();

    const { data, error } = await request;

    if (error) {
      setLoading(false);
      setFeedback("Nao foi possivel salvar. Confira os campos e tente de novo.");
      return;
    }

    const followUpError = await saveFollowUp(user.id, data.id);
    setLoading(false);

    if (followUpError) {
      setFeedback("Lead salvo, mas nao foi possivel criar o follow-up.");
      router.refresh();
      return;
    }

    setFeedback("Lead salvo com sucesso.");
    if (!lead) {
      setForm(emptyLead);
      setMessage("");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Nome da empresa</Label>
          <Input value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} required />
        </div>
        <div>
          <Label>Nome do responsavel</Label>
          <Input value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} />
        </div>
        <div>
          <Label>Nicho</Label>
          <Input placeholder="Ex: restaurante, clinica, loja" value={form.niche} onChange={(event) => updateField("niche", event.target.value)} />
        </div>
        <div>
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} />
        </div>
        <div>
          <Label>Estado</Label>
          <Input placeholder="Ex: GO, DF, SP" value={form.state} onChange={(event) => updateField("state", event.target.value)} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
        </div>
        <div>
          <Label>Instagram</Label>
          <Input placeholder="@empresa" value={form.instagram} onChange={(event) => updateField("instagram", event.target.value)} />
        </div>
        <div>
          <Label>Site atual</Label>
          <Input placeholder="Deixe vazio se nao tiver site" value={form.current_site} onChange={(event) => updateField("current_site", event.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as LeadFormData["status"])}
          >
            {leadStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Data do ultimo contato</Label>
          <Input type="date" value={form.last_contact_date} onChange={(event) => updateField("last_contact_date", event.target.value)} />
        </div>
        <div>
          <Label>Proximo follow-up</Label>
          <Input type="date" value={form.next_follow_up_date} onChange={(event) => updateField("next_follow_up_date", event.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        <Label>Observacoes</Label>
        <Textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Ex: sem site, site antigo, atende por WhatsApp..." />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300"
          checked={form.whatsapp_opt_in}
          onChange={(event) => updateField("whatsapp_opt_in", event.target.checked)}
        />
        <span>Este lead autorizou receber contato pelo WhatsApp.</span>
      </label>

      <label className="mt-3 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300"
          checked={form.auto_message_enabled}
          onChange={(event) => updateField("auto_message_enabled", event.target.checked)}
        />
        <span>Permitir automacao de envio para este lead quando a API oficial estiver configurada.</span>
      </label>

      {!compact ? (
        <div className="mt-4 rounded-md bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleGenerateMessage}>
              Gerar mensagem
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFollowUp(2)}>
              Chamar em 2 dias
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFollowUp(7)}>
              Chamar em 7 dias
            </Button>
            <Button type="button" variant="ghost" onClick={() => updateField("status", "Sem interesse")}>
              Marcar sem interesse
            </Button>
          </div>
          {message ? <Textarea className="mt-3" value={message} onChange={(event) => setMessage(event.target.value)} /> : null}
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-950">Detector de oportunidade</p>
            <p className="text-sm text-slate-500">Marque os sinais encontrados durante a pesquisa manual.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Score {calculateOpportunityScore(form)}
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            ["signal_no_site", "Nao tem site"],
            ["signal_old_site", "Site antigo"],
            ["signal_slow_site", "Site lento"],
            ["signal_not_responsive", "Site nao responsivo"],
            ["signal_no_https", "Site sem HTTPS"],
            ["signal_only_instagram", "So tem Instagram"],
            ["signal_has_whatsapp", "Tem WhatsApp"],
            ["signal_good_presence", "Tem boa presenca digital"],
            ["signal_weak_presence", "Presenca digital fraca"],
            ["signal_good_reviews", "Boa avaliacao online"],
            ["signal_competitive_region", "Regiao competitiva"],
            ["signal_good_client", "Parece bom cliente"],
            ["signal_high_closing_chance", "Alta chance de fechar"]
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={Boolean(form[key as keyof LeadFormData])}
                onChange={(event) => updateField(key as keyof LeadFormData, event.target.checked as never)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading}>{loading ? "Salvando..." : "Salvar lead"}</Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>
    </form>
  );
}
