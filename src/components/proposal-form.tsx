"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { proposalStatuses } from "@/lib/constants";
import { generateProposalText } from "@/lib/proposal-service";
import { createClient } from "@/lib/supabase/browser";
import type { Lead, ProposalStatus } from "@/types/database";

export function ProposalForm({ leads }: { leads: Pick<Lead, "id" | "company_name">[] }) {
  const [leadId, setLeadId] = useState(leads[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [service, setService] = useState("Site institucional com botao para WhatsApp");
  const [deadline, setDeadline] = useState("10 dias uteis");
  const [scope, setScope] = useState("Site institucional\nPagina inicial\nSobre\nServicos\nGaleria\nBotao WhatsApp\nFormulario de contato\nSEO basico local\nResponsivo para celular");
  const [benefits, setBenefits] = useState("Mais profissionalismo\nMais contatos pelo WhatsApp\nPresenca melhor no Google\nExperiencia melhor no celular");
  const [conditions, setConditions] = useState("50% para iniciar e 50% na entrega. Ajustes finais inclusos antes da publicacao.");
  const [status, setStatus] = useState<ProposalStatus>("Enviada");
  const [notes, setNotes] = useState("");
  const [proposalPreview, setProposalPreview] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

    const { error } = await supabase.from("proposals").insert({
      user_id: user.id,
      lead_id: leadId,
      amount: Number(amount),
      service_offered: service,
      deadline,
      scope,
      benefits,
      conditions,
      status,
      notes: notes || null
    });

    if (!error) {
      await supabase.from("leads").update({ status: "Proposta enviada" }).eq("id", leadId);
    }

    setLoading(false);

    if (error) {
      setFeedback("Nao foi possivel salvar a proposta.");
      return;
    }

    setAmount("");
    setNotes("");
    setFeedback("Proposta registrada.");
    router.refresh();
  }

  function buildPreview() {
    const lead = leads.find((item) => item.id === leadId);
    const text = generateProposalText(
      { company_name: lead?.company_name || "Lead", niche: "", city: "" },
      { service, amount: Number(amount || 0), deadline, scope, benefits, conditions }
    );
    setProposalPreview(text);
  }

  async function copyPreview() {
    if (!proposalPreview) buildPreview();
    const text = proposalPreview || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setFeedback("Proposta copiada.");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Lead</Label>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={leadId}
            onChange={(event) => setLeadId(event.target.value)}
            required
          >
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.company_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Valor da proposta</Label>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </div>
        <div>
          <Label>Servico oferecido</Label>
          <Input value={service} onChange={(event) => setService(event.target.value)} required />
        </div>
        <div>
          <Label>Prazo</Label>
          <Input value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </div>
        <div>
          <Label>Status da proposta</Label>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProposalStatus)}
          >
            {proposalStatuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <Label>Escopo</Label>
          <Textarea value={scope} onChange={(event) => setScope(event.target.value)} />
        </div>
        <div>
          <Label>Beneficios</Label>
          <Textarea value={benefits} onChange={(event) => setBenefits(event.target.value)} />
        </div>
        <div>
          <Label>Condicoes</Label>
          <Textarea value={conditions} onChange={(event) => setConditions(event.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Observacoes</Label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading || !leads.length}>{loading ? "Salvando..." : "Registrar proposta"}</Button>
        <Button type="button" variant="secondary" onClick={buildPreview}>Visualizar texto</Button>
        <Button type="button" variant="ghost" onClick={copyPreview}>Copiar proposta</Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>
      {proposalPreview ? <Textarea className="mt-4 min-h-56" value={proposalPreview} onChange={(event) => setProposalPreview(event.target.value)} /> : null}
    </form>
  );
}
