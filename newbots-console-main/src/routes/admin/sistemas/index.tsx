import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { EmptyState, PageHeader } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

export const Route = createFileRoute("/admin/sistemas/")({
  head: () => ({
    meta: [
      { title: "Sistemas — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Crie sistemas de bot e defina dinamicamente os campos que o cliente preenche.",
      },
      { property: "og:title", content: "Sistemas — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Crie sistemas e defina os campos que o cliente preenche.",
      },
    ],
  }),
  component: SystemsPage,
});

function SystemsPage() {
  const { db, deleteSystem } = useData();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Gestão"
        title="Sistemas"
        description="Cada sistema é um modelo: você define os campos, o cliente preenche os valores."
        action={
          <Button asChild className="gap-2">
            <Link to="/admin/sistemas/novo">
              <Plus className="size-4" /> Criar Sistema
            </Link>
          </Button>
        }
      />

      {db.systems.length === 0 ? (
        <div className="panel">
          <EmptyState>Nenhum sistema cadastrado.</EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {db.systems.map((system) => {
            const clients = db.licenses
              .filter((license) => license.systemId === system.id)
              .map(
                (license) => db.clients.find((client) => client.id === license.clientId)?.appName,
              )
              .filter((name): name is string => Boolean(name));
            return (
              <div key={system.id} className="panel flex flex-col px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{system.name}</h2>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{system.id}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild variant="ghost" size="icon" aria-label="Editar">
                      <Link to="/admin/sistemas/$systemId" params={{ systemId: system.id }}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      className="text-muted-foreground hover:text-danger"
                      onClick={() => {
                        deleteSystem(system.id);
                        toast.success("Sistema excluído.");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {system.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">{system.description}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {system.fields.slice(0, 6).map((field) => (
                    <span
                      key={field.id}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] text-muted-foreground"
                    >
                      {field.key || "sem_chave"}
                    </span>
                  ))}
                  {system.fields.length > 6 ? (
                    <span className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                      +{system.fields.length - 6}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{system.fields.length} campos</span>
                  <span title={clients.join(", ") || "Ninguém utiliza este sistema"}>
                    Utilizado por: {clients.length ? clients.join(", ") : "ninguém"}
                  </span>
                  <span>{formatDate(system.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
