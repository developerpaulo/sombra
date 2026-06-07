import { PageHeader } from "@/components/page-header";
import { OpportunityBadge, StatusBadge } from "@/components/ui/badge";
import { responseStatusLabels } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/database";

function normalizeNiche(niche?: string | null) {
  return niche?.trim() || "Sem nicho";
}

function nicheStrategy(niche: string) {
  const name = niche.toLowerCase();
  const base = {
    pains: ["Depende de redes sociais", "Pouca presenca no Google", "Dificuldade para passar confianca rapidamente"],
    benefits: ["Site centraliza servicos, localizacao e WhatsApp", "Aumenta profissionalismo", "Ajuda clientes a entenderem a oferta"],
    arguments: ["Um site simples pode transformar pesquisas locais em conversas no WhatsApp", "Presenca propria reduz dependencia do Instagram"],
    objections: ["Ja tenho Instagram", "Agora nao tenho verba", "Nao sei se preciso de site"],
    answers: ["O site nao substitui o Instagram; ele organiza e converte melhor quem ja se interessou", "Podemos comecar com uma pagina enxuta e objetiva"],
    services: ["Landing page local", "Site institucional", "Pagina com WhatsApp e formulario", "SEO basico local"]
  };

  if (name.includes("barbearia")) {
    return {
      ...base,
      pains: ["Depende so do Instagram", "Dificuldade para mostrar servicos e precos", "Pouca presenca no Google"],
      arguments: ["Site ajuda a mostrar servicos, localizacao e WhatsApp em um unico lugar", "Facilita agendamento e passa mais profissionalismo"]
    };
  }

  if (name.includes("clinica") || name.includes("estetica")) {
    return {
      ...base,
      pains: ["Precisa transmitir confianca", "Servicos exigem explicacao clara", "Concorrencia forte no bairro"],
      arguments: ["Site profissional aumenta autoridade e ajuda pacientes/clientes a entenderem procedimentos com seguranca"]
    };
  }

  return base;
}

export default async function NichesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: leads = [] } = await supabase.from("leads").select("*").eq("user_id", user!.id).order("niche").order("company_name");
  const groups = (leads as Lead[]).reduce<Record<string, Lead[]>>((acc, lead) => {
    const key = normalizeNiche(lead.niche);
    acc[key] = acc[key] || [];
    acc[key].push(lead);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Biblioteca de Nichos" description="Estrategias, argumentos e oportunidades por nicho para vender sites com mais clareza." />
      <div className="space-y-5">
        {Object.entries(groups).length ? (
          Object.entries(groups).map(([niche, group]) => (
            <section key={niche} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              {(() => {
                const strategy = nicheStrategy(niche);
                return (
                  <div className="mb-5 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-lg bg-rose-50 p-4">
                      <p className="font-semibold text-rose-950">Dores comuns</p>
                      <ul className="mt-2 space-y-1 text-sm text-rose-800">{strategy.pains.map((item) => <li key={item}>- {item}</li>)}</ul>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-950">Argumentos de venda</p>
                      <ul className="mt-2 space-y-1 text-sm text-emerald-800">{strategy.arguments.map((item) => <li key={item}>- {item}</li>)}</ul>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="font-semibold text-blue-950">Servicos sugeridos</p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-800">{strategy.services.map((item) => <li key={item}>- {item}</li>)}</ul>
                    </div>
                  </div>
                );
              })()}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{niche}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{group.length} lead(s)</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.map((lead) => (
                  <div key={lead.id} className="rounded-md border border-slate-100 p-3">
                    <p className="font-semibold text-slate-950">{lead.company_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{lead.city || lead.whatsapp || "-"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={lead.status} />
                      <OpportunityBadge level={lead.opportunity} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Resposta: {responseStatusLabels[lead.response_status ?? "sem_resposta"]}</p>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhum lead cadastrado ainda.</div>
        )}
      </div>
    </>
  );
}
