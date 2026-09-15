import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { BarChart3, LayoutList, LifeBuoy, Palette, PanelsTopLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/auth/session";
import { Shell, type NavGroup } from "@/components/layout/Shell";
import { useData } from "@/data/store";
import { isExpired } from "@/lib/dates";

export const Route = createFileRoute("/painel")({
  ssr: false,
  component: ClientLayout,
});

const STATISTICS_SYSTEM_IDS = new Set(["base_registro_siglas", "base_vendas"]);

function ClientLayout() {
  const { ready, discordId, clients, selectedClientId } = useAuth();
  const { db } = useData();
  const navigate = useNavigate();

  const groups = useMemo<NavGroup[]>(() => {
    const clientIds = new Set(clients.map((client) => client.id));
    const hasStatisticsAccess = db.licenses.some(
      (license) =>
        clientIds.has(license.clientId) &&
        STATISTICS_SYSTEM_IDS.has(license.systemId) &&
        !isExpired(license.expiresAt),
    );

    return [
      {
        title: "Área do cliente",
        items: [
          { to: "/painel", label: "Licenças", icon: LayoutList, exact: true },
          { to: "/painel/suporte", label: "Suporte", icon: LifeBuoy },
          { to: "/perfis", label: "Trocar aplicação", icon: PanelsTopLeft },
          ...(clientIds.size > 0
            ? [{ to: "/painel/personalizacao", label: "Personalização", icon: Palette }]
            : []),
          ...(hasStatisticsAccess
            ? [{ to: "/painel/estatisticas", label: "Estatísticas", icon: BarChart3 }]
            : []),
        ],
      },
    ];
  }, [clients, db.licenses]);

  useEffect(() => {
    if (!ready) return;
    if (!discordId) void navigate({ to: "/login", replace: true });
    else if (!selectedClientId) void navigate({ to: "/perfis", replace: true });
  }, [ready, discordId, selectedClientId, navigate]);

  if (!ready || !discordId || !selectedClientId) return null;

  return (
    <Shell groups={groups}>
      <Outlet />
    </Shell>
  );
}
