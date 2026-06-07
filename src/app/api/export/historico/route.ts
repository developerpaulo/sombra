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

  const { data: messages = [] } = await supabase.from("whatsapp_messages").select("*, leads(company_name)").eq("user_id", user.id).order("created_at", { ascending: false });
  const headers = ["empresa", "telefone", "direcao", "evento", "modo", "mensagem", "data"];
  const rows = (messages || []).map((message) =>
    [
      message.leads?.company_name,
      message.phone,
      message.direction,
      message.event_type,
      message.communication_mode,
      message.body,
      message.created_at
    ].map(csvEscape).join(",")
  );

  return new Response([headers.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=historico.csv"
    }
  });
}
