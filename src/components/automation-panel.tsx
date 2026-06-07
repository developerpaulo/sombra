"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

import type { MessageTemplate } from "@/types/database";

export function AutomationPanel({ templates = [] }: { templates?: MessageTemplate[] }) {
  const [niche, setNiche] = useState("");
  const [limit, setLimit] = useState(10);
  const [templateId, setTemplateId] = useState(templates.find((template) => template.is_default)?.id || templates[0]?.id || "");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRun(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/automation/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        niche: niche || undefined,
        limit,
        templateId: templateId || undefined
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(result.error || "Nao foi possivel rodar a automacao.");
      return;
    }

    setFeedback(`${result.sent} mensagem(ns) enviada(s) de ${result.attempted} lead(s) elegivel(is).`);
  }

  return (
    <form onSubmit={handleRun} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-md bg-brand-50 p-2 text-brand-700">
          <Send size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">Envio automatico seguro</h2>
          <p className="text-sm text-slate-500">Prioriza leads com maior chance de resposta, com autorizacao e automacao marcada.</p>
        </div>
      </div>

      <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
        A prioridade considera falta de site, Instagram sem site, WhatsApp cadastrado, nicho definido, oportunidade alta e follow-up pendente.
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_160px]">
        <div>
          <Label>Nicho opcional</Label>
          <Input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="Ex: restaurante" />
        </div>
        <div>
          <Label>Mensagem</Label>
          <select
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">Mensagem automatica</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.is_default ? " (padrao)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Limite</Label>
          <Input type="number" min="1" max="25" value={limit} onChange={(event) => setLimit(Number(event.target.value))} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading}>{loading ? "Enviando..." : "Rodar automacao"}</Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>
    </form>
  );
}
