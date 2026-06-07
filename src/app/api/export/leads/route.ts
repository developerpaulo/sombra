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

  const { data: leads = [] } = await supabase.from("leads").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const headers = ["empresa", "contato", "nicho", "cidade", "estado", "telefone", "instagram", "site", "observacoes", "status", "score"];
  const rows = (leads || []).map((lead) =>
    [
      lead.company_name,
      lead.contact_name,
      lead.niche,
      lead.city,
      lead.state,
      lead.whatsapp,
      lead.instagram,
      lead.current_site,
      lead.notes,
      lead.status,
      lead.opportunity_score
    ].map(csvEscape).join(",")
  );

  return new Response([headers.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads.csv"
    }
  });
}
