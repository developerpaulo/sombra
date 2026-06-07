export type SearchQueryInput = {
  niche: string;
  city: string;
  state: string;
  service: string;
  opportunityType: string;
};

export type SearchQueryCard = {
  source: string;
  query: string;
  description: string;
  url: string;
};

function google(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function maps(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

export function generateSearchQueries(input: SearchQueryInput): SearchQueryCard[] {
  const niche = input.niche || "empresa local";
  const city = input.city || "sua cidade";
  const state = input.state || "";
  const place = `${city} ${state}`.trim();
  const base = `${niche} em ${place}`;

  return [
    {
      source: "Google Search",
      query: `${base} WhatsApp`,
      description: "Encontre empresas com telefone, site, redes sociais e sinais de oportunidade.",
      url: google(`${base} WhatsApp`)
    },
    {
      source: "Google Maps",
      query: base,
      description: "Encontre empresas locais com telefone, localizacao e avaliacoes.",
      url: maps(base)
    },
    {
      source: "Instagram",
      query: `${niche} ${place} Instagram`,
      description: "Ache negocios que dependem de rede social e podem precisar de site.",
      url: google(`${niche} ${place} site:instagram.com`)
    },
    {
      source: "Facebook",
      query: `${niche} ${place} Facebook`,
      description: "Busque empresas com presenca social, mas sem estrutura propria.",
      url: google(`${niche} ${place} site:facebook.com`)
    },
    {
      source: "Catalogos publicos",
      query: `${base} telefone contato catalogo`,
      description: "Procure diretorios comerciais e listas publicas de negocios.",
      url: google(`${base} telefone contato catalogo`)
    },
    {
      source: "Sites antigos",
      query: `${niche} ${place} site antigo`,
      description: "Procure empresas com presenca digital desatualizada.",
      url: google(`${niche} ${place} site antigo`)
    },
    {
      source: "Sem site",
      query: `${niche} ${place} sem site`,
      description: "Busque negocios que podem depender apenas de redes sociais ou catalogos.",
      url: google(`${niche} ${place} sem site`)
    },
    {
      source: "Oportunidade escolhida",
      query: `${niche} ${place} ${input.opportunityType} ${input.service}`,
      description: "Pesquisa alinhada com a oportunidade e o servico que voce quer vender.",
      url: google(`${niche} ${place} ${input.opportunityType} ${input.service}`)
    }
  ];
}

