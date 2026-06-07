import { NextResponse } from "next/server";
import { classifyLead } from "@/lib/lead-ai";
import { createClient } from "@/lib/supabase/server";
import type { LeadFormData } from "@/types/database";

type SearchLeadsBody = {
  niche?: string;
  region?: string;
  maxResults?: number;
};

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
};

function limitResults(value?: number) {
  if (!value || Number.isNaN(value)) return 10;
  return Math.min(Math.max(value, 1), 20);
}

function getCityFromAddress(address?: string) {
  if (!address) return null;
  const parts = address.split(",").map((part) => part.trim());
  return parts.length > 1 ? parts[1] : parts[0];
}

function buildLeadNotes(place: GooglePlace, niche: string) {
  const lines = [`Lead importado automaticamente via Google Places. Nicho pesquisado: ${niche}.`];
  if (place.formattedAddress) lines.push(`Endereco: ${place.formattedAddress}`);
  if (place.googleMapsUri) lines.push(`Google Maps: ${place.googleMapsUri}`);
  if (!place.websiteUri) lines.push("Sem site encontrado na busca.");
  return lines.join("\n");
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Configure GOOGLE_PLACES_API_KEY no servidor." }, { status: 500 });
  }

  const body = (await request.json()) as SearchLeadsBody;
  const niche = body.niche?.trim();
  const region = body.region?.trim();
  const maxResultCount = limitResults(body.maxResults);

  if (!niche || !region) {
    return NextResponse.json({ error: "Informe nicho e regiao." }, { status: 400 });
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.types"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery: `${niche} em ${region}`,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount
    })
  });

  const result = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: result?.error?.message || "Nao foi possivel buscar empresas no Google Places.",
        details: result
      },
      { status: 502 }
    );
  }

  const places = (result.places || []) as GooglePlace[];
  if (!places.length) {
    return NextResponse.json({ imported: 0, leads: [] });
  }

  const rows = places
    .filter((place) => place.id && place.displayName?.text)
    .map((place) => {
      const notes = buildLeadNotes(place, niche);
      const formData: LeadFormData = {
        company_name: place.displayName!.text!,
        contact_name: "",
        niche,
        city: getCityFromAddress(place.formattedAddress) || region,
        whatsapp: place.internationalPhoneNumber || place.nationalPhoneNumber || "",
        instagram: "",
        current_site: place.websiteUri || "",
        notes,
        whatsapp_opt_in: false,
        auto_message_enabled: false,
        status: "Novo",
        last_contact_date: "",
        next_follow_up_date: ""
      };

      return {
        user_id: user.id,
        company_name: formData.company_name,
        contact_name: null,
        niche: formData.niche,
        city: formData.city,
        whatsapp: formData.whatsapp || null,
        instagram: null,
        current_site: formData.current_site || null,
        notes: formData.notes,
        whatsapp_opt_in: false,
        auto_message_enabled: false,
        response_status: "sem_resposta" as const,
        status: "Novo" as const,
        opportunity: classifyLead(formData),
        external_source: "google_places",
        external_id: place.id!,
        source_url: place.googleMapsUri || null
      };
    });

  if (!rows.length) {
    return NextResponse.json({ imported: 0, found: 0, leads: [] });
  }

  const { data: importedLeads, error } = await supabase
    .from("leads")
    .upsert(rows, {
      onConflict: "user_id,external_source,external_id",
      ignoreDuplicates: true
    })
    .select("*");

  if (error) {
    return NextResponse.json({ error: "Nao foi possivel importar os leads.", details: error }, { status: 500 });
  }

  return NextResponse.json({
    imported: importedLeads?.length || 0,
    found: rows.length,
    leads: importedLeads || []
  });
}
