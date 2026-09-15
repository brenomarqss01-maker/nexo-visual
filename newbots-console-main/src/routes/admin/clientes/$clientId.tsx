import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { EmptyState, StatusBadge } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientFormDialog } from "@/components/admin/ClientFormDialog";
import { expirationLabel, formatDate, formatDateTime, isExpired } from "@/lib/dates";

export const Route = createFileRoute("/admin/clientes/$clientId")({
  head: () => ({
    meta: [
      { title: "Detalhes do cliente — Admin NEXO NETWORK" },
      {
        name: "description",
        content:
          "Sistemas vinculados, expirações e configurações salvas de um cliente NEXO NETWORK.",
      },
      { property: "og:title", content: "Detalhes do cliente — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Sistemas vinculados, expirações e configurações salvas do cliente.",
      },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = useParams({ from: "/admin/clientes/$clientId" });
  const { db, deleteClient, updateLicenseExpiration } = useData();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(false);

  const client = db.clients.find((c) => c.id === clientId);
  if (!client) {
    return (
      <div className="panel">
        <EmptyState>
          Cliente não encontrado.
          <Link to="/admin/clientes" className="ml-1 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const licenses = db.licenses.filter((l) => l.clientId === client.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/admin/clientes"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Clientes
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{client.appName}</h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {client.discordId} · criado em {formatDate(client.createdAt)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Servidor {client.guildId} · cargo com acesso {client.accessRoleId || "não definido"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => setDialog(true)}>
              <Pencil className="size-4" /> Editar
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-danger"
              onClick={() => {
                deleteClient(client.id);
                toast.success("Cliente excluído.");
                void navigate({ to: "/admin/clientes" });
              }}
            >
              <Trash2 className="size-4" /> Excluir
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="label-kicker">Sistemas vinculados</h2>
        <div className="panel overflow-hidden">
          {licenses.length === 0 ? (
            <EmptyState>Nenhum sistema vinculado. Use “Editar” para vincular.</EmptyState>
          ) : (
            licenses.map((license) => {
              const system = db.systems.find((s) => s.id === license.systemId);
              const config = db.configs.find(
                (c) => c.guildId === client.guildId && c.systemId === license.systemId,
              );
              return (
                <div key={license.id} className="border-b border-border/70 px-6 py-5 last:border-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{system?.name ?? license.systemId}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {license.systemId} · {expirationLabel(license.expiresAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge expired={isExpired(license.expiresAt)} />
                      <Input
                        type="date"
                        value={license.expiresAt.slice(0, 10)}
                        onChange={(e) =>
                          updateLicenseExpiration(
                            license.id,
                            new Date(`${e.target.value}T23:59:59`).toISOString(),
                          )
                        }
                        className="h-9 w-[160px] font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-border bg-background/60 p-4">
                    <p className="label-kicker mb-2">Configuração salva</p>
                    {config && Object.keys(config.values).length > 0 ? (
                      <>
                        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {JSON.stringify(config.values, null, 2)}
                        </pre>
                        <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">
                          Atualizado em {formatDateTime(config.updatedAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        O cliente ainda não preencheu este sistema.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <ClientFormDialog key={client.id} open={dialog} onOpenChange={setDialog} client={client} />
    </div>
  );
}
