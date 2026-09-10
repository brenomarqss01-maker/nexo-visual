import { createFileRoute } from "@tanstack/react-router";
import { useData } from "@/data/store";
import { EmptyState, PageHeader } from "@/components/ui-kit/primitives";
import { formatDateTime } from "@/lib/dates";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [
      { title: "Logs — Admin NEXO NETWORK" },
      {
        name: "description",
        content:
          "Histórico de ações: sistemas criados, clientes cadastrados e configurações salvas.",
      },
      { property: "og:title", content: "Logs — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Histórico de ações da plataforma NEXO NETWORK.",
      },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const { db } = useData();
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Configurações"
        title="Logs"
        description="Registro das últimas ações realizadas no painel."
      />
      <div className="panel overflow-hidden">
        {db.logs.length === 0 ? (
          <EmptyState>Nenhum registro ainda.</EmptyState>
        ) : (
          db.logs.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 gap-1 border-b border-border/70 px-6 py-4 last:border-0 md:grid-cols-[180px_1fr_1fr] md:items-center md:gap-4"
            >
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatDateTime(entry.at)}
              </p>
              <p className="text-sm">{entry.action}</p>
              <p className="text-sm text-muted-foreground">
                {entry.detail ? `${entry.detail} · ` : ""}
                <span className="font-mono text-[11px]">{entry.actor}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
