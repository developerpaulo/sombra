"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

const defaultContent =
  "Ola {{nome}}, tudo bem? Vi que a {{empresa}} trabalha com {{nicho}} em {{cidade}}. Eu desenvolvo {{servico}} e queria te mostrar uma ideia simples para atrair mais clientes. Posso te mandar uma sugestao?";

const templatePresets = [
  {
    name: "Direta - sem site",
    content:
      "Ola {{nome}}, tudo bem? Vi que a {{empresa}} atua com {{nicho}} em {{cidade}}. Tenho uma ideia de site simples com botao para WhatsApp que pode ajudar a atrair mais clientes. Posso te mostrar?"
  },
  {
    name: "Consultiva - oportunidade",
    content:
      "Ola {{nome}}! Estava analisando negocios de {{nicho}} em {{cidade}} e a {{empresa}} chamou minha atencao. Posso te mandar uma sugestao rapida de {{servico}} para melhorar a presenca online?"
  },
  {
    name: "Instagram para site",
    content:
      "Ola {{nome}}, tudo bem? Vi o Instagram da {{empresa}} e gostei do posicionamento. Uma ideia: transformar esse interesse em mais pedidos com um site rapido ligado ao WhatsApp. Posso te mostrar como ficaria?"
  },
  {
    name: "Site antigo",
    content:
      "Ola {{nome}}! Vi a {{empresa}} e pensei em uma melhoria simples: um site mais moderno, claro e pronto para gerar contatos pelo WhatsApp. Posso te mostrar uma sugestao?"
  },
  {
    name: "Follow-up leve",
    content:
      "Oi {{nome}}, tudo bem? Passando rapido para saber se faz sentido eu te mostrar uma ideia de site para a {{empresa}}. A proposta e simples, profissional e focada em receber contatos pelo WhatsApp."
  }
];

export function TemplateForm() {
  const [name, setName] = useState("Primeiro contato");
  const [content, setContent] = useState(defaultContent);
  const [isDefault, setIsDefault] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFeedback("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setFeedback("Sessao expirada. Entre novamente.");
      setLoading(false);
      return;
    }

    if (isDefault) {
      await supabase.from("message_templates").update({ is_default: false }).eq("user_id", user.id);
    }

    const { error } = await supabase.from("message_templates").insert({
      user_id: user.id,
      name,
      content,
      is_default: isDefault
    });

    setLoading(false);

    if (error) {
      setFeedback("Nao foi possivel salvar o modelo.");
      return;
    }

    setFeedback("Modelo salvo.");
    router.refresh();
  }

  async function saveAllPresets() {
    setLoading(true);
    setFeedback("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setFeedback("Sessao expirada. Entre novamente.");
      setLoading(false);
      return;
    }

    await supabase.from("message_templates").update({ is_default: false }).eq("user_id", user.id);

    const { error } = await supabase.from("message_templates").insert(
      templatePresets.map((preset, index) => ({
        user_id: user.id,
        name: preset.name,
        content: preset.content,
        is_default: index === 0
      }))
    );

    setLoading(false);

    if (error) {
      setFeedback("Nao foi possivel salvar os modelos prontos.");
      return;
    }

    setFeedback("Modelos prontos salvos.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Modelos prontos</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {templatePresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setName(preset.name);
                setContent(preset.content);
              }}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3" onClick={saveAllPresets} disabled={loading}>
          Salvar todos os modelos prontos
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <div>
          <Label>Nome do modelo</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
          Modelo padrao
        </label>
      </div>
      <div className="mt-4">
        <Label>Mensagem</Label>
        <Textarea value={content} onChange={(event) => setContent(event.target.value)} required />
        <p className="mt-2 text-xs text-slate-500">
          Variaveis: {"{{nome}}"}, {"{{empresa}}"}, {"{{nicho}}"}, {"{{cidade}}"}, {"{{telefone}}"}, {"{{servico}}"}.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={loading}>{loading ? "Salvando..." : "Salvar modelo"}</Button>
        {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
      </div>
    </form>
  );
}
