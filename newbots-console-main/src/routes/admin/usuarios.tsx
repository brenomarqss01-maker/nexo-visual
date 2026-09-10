import { createFileRoute } from "@tanstack/react-router";
import { useData } from "@/data/store";
import { PageHeader } from "@/components/ui-kit/primitives";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Contas Discord com acesso ao painel NEXO NETWORK e seus níveis de permissão.",
      },
      { property: "og:title", content: "Usuários — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Contas Discord com acesso ao painel e seus níveis de permissão.",
      },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { db } = useData();
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Gestão"
        title="Usuários"
        description="Contas Discord conhecidas pela plataforma. O acesso administrativo é definido pelo Discord ID nas configurações gerais."
      />
      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1.4fr_1fr] gap-4 border-b border-border px-6 py-3.5 md:grid">
          <span className="label-kicker">Usuário</span>
          <span className="label-kicker">ID Discord</span>
          <span className="label-kicker">Permissão</span>
        </div>
        {db.users.map((user) => (
          <div
            key={user.discordId}
            className="grid grid-cols-1 gap-2 border-b border-border/70 px-6 py-4 last:border-0 md:grid-cols-[1.4fr_1.4fr_1fr] md:items-center md:gap-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-8 items-center justify-center rounded-full font-mono text-[11px] text-primary-foreground"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate text-sm">{user.name}</span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">{user.discordId}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {user.role === "admin" ? "Administrador" : "Cliente"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
