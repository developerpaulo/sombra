"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, PlusCircle, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type SearchLink = {
  label: string;
  query: string;
  url: string;
};

function googleSearch(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function googleMaps(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

function instagramSearch(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} site:instagram.com`)}`;
}

function facebookSearch(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} site:facebook.com`)}`;
}

export function AssistedLeadCapture() {
  const [niche, setNiche] = useState("restaurante");
  const [city, setCity] = useState("Brasilia");
  const [state, setState] = useState("DF");
  const [clientType, setClientType] = useState("negocio local sem site profissional");
  const [opportunityType, setOpportunityType] = useState("sem site");
  const [service, setService] = useState("site profissional com botao para WhatsApp");
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState(false);
  const [feedback, setFeedback] = useState("");

  const links = useMemo<SearchLink[]>(() => {
    const place = `${city} ${state}`.trim();
    const base = `${niche} em ${place}`;
    const queries = [
      { label: "Google Search", query: `${base} WhatsApp`, url: googleSearch(`${base} WhatsApp`) },
      { label: "Google Maps", query: base, url: googleMaps(base) },
      { label: "Instagram", query: `${niche} ${place} Instagram`, url: instagramSearch(`${niche} ${place}`) },
      { label: "Facebook", query: `${niche} ${place} Facebook`, url: facebookSearch(`${niche} ${place}`) },
      { label: "Sem site", query: `${niche} ${place} sem site`, url: googleSearch(`${niche} ${place} sem site`) },
      { label: "WhatsApp/cardapio", query: `${niche} ${place} cardapio WhatsApp`, url: googleSearch(`${niche} ${place} cardapio WhatsApp`) },
      { label: "Catalogos publicos", query: `${base} catalogo telefone`, url: googleSearch(`${base} catalogo telefone`) },
      { label: "Oportunidade", query: `${clientType} ${place} ${service}`, url: googleSearch(`${clientType} ${place} ${service}`) }
      ,
      { label: "Tipo de oportunidade", query: `${niche} ${place} ${opportunityType}`, url: googleSearch(`${niche} ${place} ${opportunityType}`) }
    ];

    return queries;
  }, [city, clientType, niche, opportunityType, service, state]);

  async function copyQuery(query: string) {
    try {
      await navigator.clipboard.writeText(query);
      setFeedback("Busca copiada.");
    } catch {
      setFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
          <Radar size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">Radar de Clientes</h2>
          <p className="text-sm text-slate-500">Gere pesquisas prontas, encontre leads manualmente e cadastre sem usar scraping ou APIs obrigatorias.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Nicho</Label>
          <Input value={niche} onChange={(event) => setNiche(event.target.value)} />
        </div>
        <div>
          <Label>Cidade</Label>
          <Input value={city} onChange={(event) => setCity(event.target.value)} />
        </div>
        <div>
          <Label>Estado</Label>
          <Input value={state} onChange={(event) => setState(event.target.value)} />
        </div>
        <div>
          <Label>Tipo desejado</Label>
          <Input value={clientType} onChange={(event) => setClientType(event.target.value)} />
        </div>
        <div>
          <Label>Tipo de oportunidade</Label>
          <Input value={opportunityType} onChange={(event) => setOpportunityType(event.target.value)} placeholder="Ex: sem site, site antigo, so Instagram" />
        </div>
        <div>
          <Label>Servico oferecido</Label>
          <Input value={service} onChange={(event) => setService(event.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Observacoes</Label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex: procurar negocios com WhatsApp visivel e sem site no Google." />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setGenerated(true)}>
          Gerar oportunidades
        </Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>

      {generated ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {links.map((link) => (
            <div key={link.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{link.label}</p>
                <ExternalLink size={16} className="text-slate-400" />
              </div>
              <p className="mt-2 text-sm text-slate-600">{link.query}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                  <ExternalLink size={13} />
                  Abrir pesquisa
                </a>
                <button type="button" onClick={() => copyQuery(link.query)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Copy size={13} />
                  Copiar busca
                </button>
                <Link href="/leads" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <PlusCircle size={13} />
                  Criar lead manualmente
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
