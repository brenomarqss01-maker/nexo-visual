import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { SystemEditor, newField, type SystemDraft } from "@/components/admin/SystemEditor";
import { PageHeader } from "@/components/ui-kit/primitives";
import { slugify } from "@/lib/dates";

export const Route = createFileRoute("/admin/sistemas/novo")({
  head: () => ({
    meta: [
      { title: "Criar sistema — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Cadastre um novo sistema de bot Discord e seus campos de configuração.",
      },
      { property: "og:title", content: "Criar sistema — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Cadastre um novo sistema e seus campos de configuração.",
      },
    ],
  }),
  component: NewSystem,
});

function NewSystem() {
  const { createSystem } = useData();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SystemDraft>({
    name: "",
    description: "",
    fields: [newField()],
  });

  const submit = () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome do sistema.");
      return;
    }
    const fields = draft.fields.filter((f) => f.title.trim());
    if (fields.some((f) => !f.key.trim())) {
      toast.error("Todos os campos precisam de uma chave única.");
      return;
    }
    const keys = fields.map((f) => slugify(f.key));
    if (new Set(keys).size !== keys.length) {
      toast.error("Existem chaves duplicadas.");
      return;
    }
    const system = createSystem({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      fields: fields.map(({ id: _id, ...rest }) => ({ ...rest, key: slugify(rest.key) })),
    });
    toast.success("Sistema salvo com sucesso.");
    void navigate({ to: "/admin/sistemas/$systemId", params: { systemId: system.id } });
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/admin/sistemas"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Sistemas
        </Link>
        <div className="mt-4">
          <PageHeader
            kicker="Novo modelo"
            title="Criar Sistema"
            description="Defina o nome e os campos que o cliente verá ao configurar este sistema."
          />
        </div>
      </div>

      <SystemEditor
        draft={draft}
        onChange={setDraft}
        onSubmit={submit}
        submitLabel="Salvar Sistema"
      />
    </div>
  );
}
