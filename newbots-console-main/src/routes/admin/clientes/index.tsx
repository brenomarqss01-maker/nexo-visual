import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientFormDialog } from "@/components/admin/ClientFormDialog";
import { formatDate, isExpired } from "@/lib/dates";
import type { Client } from "@/data/types";

export const Route = createFileRoute("/admin/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Gerencie clientes, licenças e expirações dos sistemas NEXO NETWORK.",
      },
      { property: "og:title", content: "Clientes — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Gerencie clientes, licenças e expirações dos sistemas NEXO NETWORK.",
      },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { db, deleteClient } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>(undefined);

  const rows = useMemo(
    () =>
      db.clients
        .filter(
          (c) =>
            c.appName.toLowerCase().includes(filter.toLowerCase()) || c.discordId.includes(filter),
        )
        .map((client) => {
          const licenses = db.licenses.filter((l) => l.clientId === client.id);
          const nextExpiry = licenses
            .map((l) => l.expiresAt)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
          return {
            client,
            licenses,
            nextExpiry,
            expired: licenses.length > 0 && licenses.every((l) => isExpired(l.expiresAt)),
          };
        }),
    [db, filter],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Gestão"
        title="Clientes"
        description="Todos os clientes cadastrados, seus sistemas vinculados e o status das licenças."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(undefined);
              setDialog(true);
            }}
          >
            <Plus className="size-4" /> Novo Cliente
          </Button>
        }
      />

      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar clientes..."
        className="h-12 max-w-md"
      />

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.2fr_1fr_1fr_120px_140px] gap-4 border-b border-border px-6 py-3.5 lg:grid">
          <span className="label-kicker">Cliente</span>
          <span className="label-kicker">ID Discord</span>
          <span className="label-kicker">Sistemas</span>
          <span className="label-kicker">Expiração</span>
          <span className="label-kicker">Status</span>
          <span className="label-kicker text-right">Ações</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState>Nenhum cliente encontrado.</EmptyState>
        ) : (
          rows.map(({ client, licenses, nextExpiry, expired }) => (
            <div
              key={client.id}
              className="grid grid-cols-1 gap-3 border-b border-border/70 px-6 py-4 transition-colors last:border-0 hover:bg-accent/40 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_120px_140px] lg:items-center lg:gap-4"
            >
              <Link
                to="/admin/clientes/$clientId"
                params={{ clientId: client.id }}
                className="min-w-0 text-sm font-medium hover:underline"
              >
                {client.appName}
              </Link>
              <p className="font-mono text-[11px] text-muted-foreground">{client.discordId}</p>
              <p className="text-sm text-muted-foreground">
                {licenses.length} {licenses.length === 1 ? "sistema" : "sistemas"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {nextExpiry ? formatDate(nextExpiry) : "—"}
              </p>
              <StatusBadge expired={expired} />
              <div className="flex items-center gap-1 lg:justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Visualizar"
                  onClick={() =>
                    void navigate({
                      to: "/admin/clientes/$clientId",
                      params: { clientId: client.id },
                    })
                  }
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  onClick={() => {
                    setEditing(client);
                    setDialog(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir"
                  className="text-muted-foreground hover:text-danger"
                  onClick={() => {
                    deleteClient(client.id);
                    toast.success("Cliente excluído.");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">{rows.length} clientes.</p>

      <ClientFormDialog
        key={editing?.id ?? "new"}
        open={dialog}
        onOpenChange={setDialog}
        client={editing}
      />
    </div>
  );
}
