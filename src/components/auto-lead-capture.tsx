"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AutoLeadCapture() {
  const [niche, setNiche] = useState("restaurante");
  const [region, setRegion] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const response = await fetch("/api/leads/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        niche,
        region,
        maxResults
      })
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(result.error || "Nao foi possivel buscar leads agora.");
      return;
    }

    if (!result.found) {
      setFeedback("Nenhuma empresa encontrada para essa busca.");
      return;
    }

    const duplicated = result.found - result.imported;
    setFeedback(`${result.imported} lead(s) importado(s). ${duplicated > 0 ? `${duplicated} ja existia(m) e foram ignorado(s).` : ""}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSearch} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-md bg-brand-50 p-2 text-brand-700">
          <Search size={18} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">Busca automatica por nicho</h2>
          <p className="text-sm text-slate-500">Opcional: funciona quando a chave do Google Places estiver configurada.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_160px]">
        <div>
          <Label>Nicho</Label>
          <Input value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="Ex: restaurante" required />
        </div>
        <div>
          <Label>Regiao</Label>
          <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Ex: Campinas SP" required />
        </div>
        <div>
          <Label>Quantidade</Label>
          <Input type="number" min="1" max="20" value={maxResults} onChange={(event) => setMaxResults(Number(event.target.value))} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading}>{loading ? "Buscando..." : "Buscar e importar"}</Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>
    </form>
  );
}
