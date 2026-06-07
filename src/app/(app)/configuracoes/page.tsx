import { CheckCircle2, ExternalLink, MessageCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type ApiItem = {
  name: string;
  description: string;
  requiredFor: string;
  mode: "Obrigatoria" | "Opcional";
  configured: boolean;
  envVars: string[];
  docsUrl?: string;
};

function hasValue(value?: string) {
  return Boolean(value && value.trim() && !value.includes("sua-chave") && !value.includes("seu-"));
}

const apiItems: ApiItem[] = [
  {
    name: "Modo de Comunicacao",
    description: "Define se o CRM usa Manual Assistido ou WhatsApp Business API.",
    requiredFor: "Manual Assistido funciona sem Meta, webhook ou token. API fica preparada para o futuro.",
    mode: "Obrigatoria",
    configured: true,
    envVars: [`COMMUNICATION_MODE=${process.env.COMMUNICATION_MODE === "api" ? "api" : "manual"}`]
  },
  {
    name: "Supabase",
    description: "Banco de dados, login e seguranca do sistema.",
    requiredFor: "Entrar no CRM, salvar leads, propostas, mensagens e conversas.",
    mode: "Obrigatoria",
    configured: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    docsUrl: "https://supabase.com/docs"
  },
  {
    name: "WhatsApp normal",
    description: "Abre o WhatsApp Web ou app com a mensagem pronta para voce revisar e enviar.",
    requiredFor: "Usar seu WhatsApp comum sem API, sem automacao e sem caixa de entrada sincronizada.",
    mode: "Opcional",
    configured: true,
    envVars: ["Nao precisa de variavel de ambiente"],
    docsUrl: "https://faq.whatsapp.com/5913398998672934"
  },
  {
    name: "WhatsApp Business API",
    description: "API oficial da Meta para envio, recebimento por webhook e inbox dentro do CRM.",
    requiredFor: "Enviar pelo sistema, registrar mensagens automaticamente e organizar quem respondeu.",
    mode: "Opcional",
    configured: hasValue(process.env.WHATSAPP_ACCESS_TOKEN) && hasValue(process.env.WHATSAPP_PHONE_NUMBER_ID),
    envVars: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_API_VERSION", "WHATSAPP_WEBHOOK_VERIFY_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"],
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api"
  },
  {
    name: "Google Places",
    description: "Busca empresas por nicho e regiao para captar leads automaticamente.",
    requiredFor: "Pesquisar restaurantes, clinicas, lojas e outros nichos por cidade/regiao.",
    mode: "Opcional",
    configured: hasValue(process.env.GOOGLE_PLACES_API_KEY),
    envVars: ["GOOGLE_PLACES_API_KEY"],
    docsUrl: "https://developers.google.com/maps/documentation/places/web-service"
  }
];

export default function ConfiguracoesPage() {
  const requiredMissing = apiItems.filter((item) => item.mode === "Obrigatoria" && !item.configured);
  const optionalApis = apiItems.filter((item) => item.mode === "Opcional" && item.name !== "WhatsApp normal");
  const optionalReady = optionalApis.filter((item) => item.configured).length;

  return (
    <>
      <PageHeader title="Configuracoes" description="Veja quais APIs estao prontas e como conectar Supabase, WhatsApp e Google Places." />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Status principal</p>
          <p className={cn("mt-2 text-2xl font-bold", requiredMissing.length ? "text-rose-600" : "text-emerald-600")}>
            {requiredMissing.length ? "Incompleto" : "Operacional"}
          </p>
          <p className="mt-1 text-sm text-slate-500">{requiredMissing.length ? "Configure o Supabase para usar o CRM." : "Login e banco estao configurados."}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">WhatsApp disponivel agora</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">Normal manual</p>
          <p className="mt-1 text-sm text-slate-500">Abre conversa com mensagem preenchida, sem envio automatico.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">APIs opcionais prontas</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{optionalReady}/{optionalApis.length}</p>
          <p className="mt-1 text-sm text-slate-500">Business API e Google podem ser ativados depois.</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {apiItems.map((item) => (
          <article key={item.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">{item.name}</h2>
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", item.mode === "Obrigatoria" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600")}>{item.mode}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
              {item.configured ? <CheckCircle2 className="shrink-0 text-emerald-600" size={22} /> : <XCircle className="shrink-0 text-rose-600" size={22} />}
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Serve para</p>
              <p className="mt-1 text-sm text-slate-700">{item.requiredFor}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variaveis</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.envVars.map((envVar) => (
                  <code key={envVar} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {envVar}
                  </code>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", item.configured ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                {item.configured ? "Configurado" : "Faltando configuracao"}
              </span>
              {item.docsUrl ? (
                <a href={item.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                  Documentacao
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <MessageCircle className="mt-0.5 shrink-0 text-amber-700" size={20} />
          <div>
            <h2 className="font-semibold text-amber-950">Sobre WhatsApp normal e Business</h2>
            <p className="mt-1 text-sm text-amber-900">
              WhatsApp normal nao oferece uma API oficial para espelhar conversas dentro do CRM. Por isso o sistema abre a conversa com a mensagem pronta para envio manual. Para envio automatico, webhook e inbox sincronizada, use WhatsApp Business API oficial da Meta.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
