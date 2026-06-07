import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Sessao expirada." }, { status: 401 });

  const { data: proposals = [] } = await supabase.from("proposals").select("*, leads(company_name)").eq("user_id", user.id).order("created_at", { ascending: false });
  const headers = ["lead", "servico", "valor", "prazo", "status", "escopo", "beneficios", "condicoes", "observacoes"];
  const rows = (proposals || []).map((proposal) =>
    [
      proposal.leads?.company_name,
      proposal.service_offered,
      proposal.amount,
      proposal.deadline,
      proposal.status,
      proposal.scope,
      proposal.benefits,
      proposal.conditions,
      proposal.notes
    ].map(csvEscape).join(",")
  );

  return new Response([headers.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=propostas.csv"
    }
  });
}

