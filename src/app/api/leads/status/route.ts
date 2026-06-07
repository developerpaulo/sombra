import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus, ResponseStatus } from "@/types/database";

type UpdateLeadStatusBody = {
  leadId?: string;
  responseStatus?: ResponseStatus;
};

const allowedStatuses: ResponseStatus[] = ["sem_resposta", "respondeu", "interessado", "sem_interesse"];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 });
  }

  const body = (await request.json()) as UpdateLeadStatusBody;
  if (!body.leadId || !body.responseStatus || !allowedStatuses.includes(body.responseStatus)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const nextLeadStatus: LeadStatus | undefined =
    body.responseStatus === "sem_interesse" ? "Sem interesse" : body.responseStatus === "respondeu" || body.responseStatus === "interessado" ? "Respondeu" : undefined;

  const payload = nextLeadStatus
    ? {
        response_status: body.responseStatus,
        status: nextLeadStatus
      }
    : {
        response_status: body.responseStatus
      };

  const { error } = await supabase.from("leads").update(payload).eq("id", body.leadId).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel atualizar o lead.", details: error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
