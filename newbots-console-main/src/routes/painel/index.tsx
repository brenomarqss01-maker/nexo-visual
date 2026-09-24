import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/auth/session";
import { useData } from "@/data/store";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui-kit/primitives";
import { expirationLabel, formatDate, isExpired } from "@/lib/dates";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/painel/")({
  head: () => ({
    meta: [
      { title: "Seus Sistemas — NEXO NETWORK" },
      {
        name: "description",
        content: "Configure todos os sistemas de bot Discord vinculados à sua conta NEXO NETWORK.",
      },
      { property: "og:title", content: "Seus Sistemas — NEXO NETWORK" },
      {
        property: "og:description",
        content: "Configure os sistemas de bot Discord vinculados à sua conta.",
      },
    ],
  }),
  component: ClientSystems,
});

function ClientSystems() {
  const { db } = useData();
  const { clients, user } = useAuth();
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const clientIds = new Set(clients.map((client) => client.id));
    return db.licenses
      .filter((license) => clientIds.has(license.clientId))
      .map((license) => ({
        license,
        client: clients.find((item) => item.id === license.clientId),
        system: db.systems.find((s) => s.id === license.systemId),
      }))
      .filter(
        (
          row,
        ): row is {
          license: typeof row.license;
          client: (typeof clients)[number];
          system: NonNullable<typeof row.system>;
        } => Boolean(row.client && row.system),
      )
      .filter((row) => row.system.name.toLowerCase().includes(filter.toLowerCase()));
  }, [db, clients, filter]);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Licenças"
        title="Seus Sistemas"
        description="Aqui você pode configurar todos os sistemas vinculados à sua conta. Cada sistema possui os campos definidos pela equipe NEXO NETWORK."
      />

      {clients.length === 0 ? (
        <div className="panel">
          <EmptyState>
            Nenhum cliente vinculado ao Discord ID{" "}
            <span className="font-mono">{user?.discordId}</span>.
            <br />
            Solicite a liberação com o administrador.
          </EmptyState>
        </div>
      ) : (
        <>
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar sistemas..."
            className="nexo-control-search h-12 max-w-md"
          />

          <div className="panel nexo-license-table overflow-hidden">
            <div className="nexo-license-table__head hidden grid-cols-[2fr_1fr_1fr_120px] gap-4 border-b border-border px-6 py-3.5 md:grid">
              <span className="label-kicker">Sistema</span>
              <span className="label-kicker">Status</span>
              <span className="label-kicker">Expiração</span>
              <span className="label-kicker text-right">Ações</span>
            </div>

            {rows.length === 0 ? (
              <EmptyState>Nenhuma licença encontrada.</EmptyState>
            ) : (
              rows.map(({ license, client, system }) => {
                const expired = isExpired(license.expiresAt);
                return (
                  <div
                    key={license.id}
                    className="nexo-license-table__row grid grid-cols-1 gap-3 border-b border-border/70 px-6 py-4 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[2fr_1fr_1fr_120px] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{system.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {system.fields.length} campos · {system.id}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {client.appName} · servidor {client.guildId}
                      </p>
                    </div>
                    <div>
                      <StatusBadge expired={expired} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{formatDate(license.expiresAt)}</p>
                      <p className="font-mono text-[11px]">{expirationLabel(license.expiresAt)}</p>
                    </div>
                    <div className="md:text-right">
                      <Button asChild variant="secondary" size="sm" className="gap-1.5">
                        <Link
                          to="/painel/sistemas/$systemId"
                          params={{ systemId: system.id }}
                          search={{ clientId: client.id }}
                        >
                          <Settings2 className="size-3.5" />
                          Configurar
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="nexo-license-count font-mono text-[11px] text-muted-foreground">
            {rows.length} {rows.length === 1 ? "sistema" : "sistemas"}.
          </p>
        </>
      )}
    </div>
  );
}
