import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { SystemEditor, type SystemDraft } from "@/components/admin/SystemEditor";
import { EmptyState, PageHeader } from "@/components/ui-kit/primitives";
import { slugify } from "@/lib/dates";

export const Route = createFileRoute("/admin/sistemas/$systemId")({
  head: () => ({
    meta: [
      { title: "Editar sistema — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Edite os campos dinâmicos que o cliente preenche neste sistema NEXO NETWORK.",
      },
      { property: "og:title", content: "Editar sistema — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Edite os campos dinâmicos deste sistema de bot Discord.",
      },
    ],
  }),
  component: EditSystem,
});

function EditSystem() {
  const { systemId } = useParams({ from: "/admin/sistemas/$systemId" });
  const { db, updateSystem } = useData();
  const system = db.systems.find((s) => s.id === systemId);

  const [draft, setDraft] = useState<SystemDraft>({
    name: system?.name ?? "",
    description: system?.description ?? "",
    fields: system?.fields ?? [],
  });

  if (!system) {
    return (
      <div className="panel">
        <EmptyState>
          Sistema não encontrado.
          <Link to="/admin/sistemas" className="ml-1 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const submit = () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome do sistema.");
      return;
    }
    const fields = draft.fields
      .filter((f) => f.title.trim())
      .map((f) => ({ ...f, key: slugify(f.key) || slugify(f.title) }));
    const keys = fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      toast.error("Existem chaves duplicadas.");
      return;
    }
    updateSystem(system.id, {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      fields,
    });
    toast.success("Sistema atualizado com sucesso.");
  };

  const clients = db.licenses.filter((l) => l.systemId === system.id).length;

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
            kicker={`${clients} licenças ativas neste modelo`}
            title={system.name}
            description="Alterações nos campos aparecem automaticamente para todos os clientes vinculados."
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
