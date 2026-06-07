"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { normalizeBrazilianPhone } from "@/lib/phone";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",").map((item) => item.trim().toLowerCase()) || [];

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

export function LeadCsvTools() {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function importCsv(file?: File) {
    if (!file) return;
    setLoading(true);
    setFeedback("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setFeedback("Sessao expirada.");
      return;
    }

    const text = await file.text();
    const rows = parseCsv(text);
    const payload = rows
      .filter((row) => row.empresa)
      .map((row) => ({
        user_id: user.id,
        company_name: row.empresa,
        contact_name: row.contato || null,
        niche: row.nicho || null,
        city: row.cidade || null,
        state: row.estado || null,
        whatsapp: row.telefone ? normalizeBrazilianPhone(row.telefone).phone : null,
        instagram: row.instagram || null,
        current_site: row.site || null,
        notes: row.observacoes || null,
        status: row.status || "Novo"
      }));

    if (!payload.length) {
      setLoading(false);
      setFeedback("Nenhum lead valido encontrado no CSV.");
      return;
    }

    const { error } = await supabase.from("leads").insert(payload);
    setLoading(false);

    if (error) {
      setFeedback("Nao foi possivel importar. Confira as colunas e os status.");
      return;
    }

    setFeedback(`${payload.length} lead(s) importado(s).`);
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <a href="/api/export/leads" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        <Download size={16} />
        Exportar leads CSV
      </a>
      <a href="/api/export/historico" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        <Download size={16} />
        Exportar historico CSV
      </a>
      <a href="/api/export/funil" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        <Download size={16} />
        Exportar funil CSV
      </a>
      <a href="/api/export/propostas" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        <Download size={16} />
        Exportar propostas CSV
      </a>
      <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
        {loading ? "Importando..." : "Importar CSV"}
        <input className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => importCsv(event.target.files?.[0])} />
      </label>
      <p className="self-center text-sm text-slate-500">Colunas: empresa, contato, nicho, cidade, estado, telefone, instagram, site, observacoes, status.</p>
      {feedback ? <p className="basis-full text-sm text-slate-600">{feedback}</p> : null}
    </div>
  );
}
