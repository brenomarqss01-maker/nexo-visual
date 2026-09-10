import { Link } from "@tanstack/react-router";
import { Boxes, KeyRound, Plus, TimerOff, UserSquare2 } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";
import { useData } from "@/data/store";
import { PageHeader, StatusBadge } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { ClientFormDialog } from "@/components/admin/ClientFormDialog";
import { formatDate, isExpired } from "@/lib/dates";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="panel px-5 py-5 transition-colors hover:border-ring/60">
      <div className="flex items-start justify-between">
        <span className="label-kicker">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { db } = useData();
  const [dialog, setDialog] = useState(false);

  const stats = useMemo(() => {
    const active = db.licenses.filter((license) => !isExpired(license.expiresAt)).length;
    return {
      clients: db.clients.length,
      systems: db.systems.length,
      active,
      expired: db.licenses.length - active,
    };
  }, [db]);

  const recent = useMemo(
    () =>
      [...db.clients]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [db.clients],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Gestão"
        title="Dashboard"
        description="Resumo da operação NEXO NETWORK: clientes, sistemas cadastrados e status das licenças."
        action={
          <Button className="gap-2" onClick={() => setDialog(true)}>
            <Plus className="size-4" /> Novo Cliente
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes" value={stats.clients} icon={UserSquare2} />
        <StatCard label="Sistemas" value={stats.systems} icon={Boxes} />
        <StatCard label="Licenças ativas" value={stats.active} icon={KeyRound} />
        <StatCard label="Licenças expiradas" value={stats.expired} icon={TimerOff} />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Clientes recentes</h2>
          <Link
            to="/admin/clientes"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            Ver todos
          </Link>
        </div>
        {recent.map((client) => {
          const licenses = db.licenses.filter((license) => license.clientId === client.id);
          const expired =
            licenses.length > 0 && licenses.every((license) => isExpired(license.expiresAt));
          return (
            <Link
              key={client.id}
              to="/admin/clientes/$clientId"
              params={{ clientId: client.id }}
              className="grid grid-cols-1 gap-2 border-b border-border/70 px-6 py-4 transition-colors last:border-0 hover:bg-accent/40 md:grid-cols-[1.4fr_1.2fr_1fr_auto] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{client.appName}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{client.discordId}</p>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {licenses.length} {licenses.length === 1 ? "sistema" : "sistemas"}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatDate(client.createdAt)}
              </p>
              <StatusBadge expired={expired} />
            </Link>
          );
        })}
      </div>

      <ClientFormDialog open={dialog} onOpenChange={setDialog} />
    </div>
  );
}
