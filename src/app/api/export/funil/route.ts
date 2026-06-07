import { NextResponse } from "next/server";
import { leadStatuses } from "@/lib/constants";
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

  const { data: leads = [] } = await supabase.from("leads").select("status").eq("user_id", user.id);
  const rows = leadStatuses.map((status) => [status, (leads || []).filter((lead) => lead.status === status).length].map(csvEscape).join(","));

  return new Response(["status,total", ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=funil.csv"
    }
  });
}

