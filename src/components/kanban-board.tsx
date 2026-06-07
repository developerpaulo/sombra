"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { OpportunityBadge } from "@/components/ui/badge";
import { leadStatuses } from "@/lib/constants";
import { temperatureClasses, temperatureIcon, getTemperature } from "@/lib/opportunity-service";
import { createClient } from "@/lib/supabase/browser";
import { cn, formatDate } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { status: lead.status }
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm", isDragging && "opacity-60")}
      {...listeners}
      {...attributes}
    >
      <p className="font-semibold text-slate-950">{lead.company_name}</p>
      <p className="mt-1 text-xs text-slate-500">{lead.niche || "Sem nicho"} · {lead.city || "Sem cidade"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <OpportunityBadge level={lead.opportunity} />
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", temperatureClasses(lead.opportunity_score))}>
          {temperatureIcon(lead.opportunity_score)} {getTemperature(lead.opportunity_score)} {lead.opportunity_score ?? 0}
        </span>
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-500">
        <p>Ultima interacao: {formatDate(lead.last_contact_date || lead.last_inbound_at?.slice(0, 10) || lead.updated_at?.slice(0, 10))}</p>
        <p>Follow-up: {formatDate(lead.next_follow_up_date)}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <a href={`/conversas`} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Conversar</a>
        <a href={`/propostas`} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">Proposta</a>
      </div>
    </div>
  );
}

function KanbanColumn({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef} className={cn("min-h-[280px] w-72 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-3", isOver && "border-brand-500 bg-brand-50")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">{status}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{leads.length}</span>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </section>
  );
}

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [feedback, setFeedback] = useState("");
  const supabase = createClient();

  async function handleDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const nextStatus = event.over?.id as LeadStatus | undefined;
    if (!nextStatus || !leadStatuses.includes(nextStatus)) return;

    const currentLead = leads.find((lead) => lead.id === leadId);
    if (!currentLead || currentLead.status === nextStatus) return;

    setFeedback("");
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status: nextStatus } : lead)));
    const { error } = await supabase.from("leads").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", leadId);

    if (error) {
      setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status: currentLead.status } : lead)));
      setFeedback("Nao foi possivel mover o lead. Tente novamente.");
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {feedback ? <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}
      <div className="overflow-x-auto pb-3">
        <div className="flex gap-4">
          {leadStatuses.map((status) => (
            <KanbanColumn key={status} status={status} leads={leads.filter((lead) => lead.status === status)} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
