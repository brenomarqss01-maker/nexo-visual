import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  Megaphone,
  PanelsTopLeft,
  ScrollText,
  Settings,
  Users,
  UserSquare2,
} from "lucide-react";
import { useEffect } from "react";
import { Shell, type NavGroup } from "@/components/layout/Shell";
import { useAuth } from "@/auth/session";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

const groups: NavGroup[] = [
  {
    title: "Gestão",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/clientes", label: "Clientes", icon: UserSquare2 },
      { to: "/admin/sistemas", label: "Sistemas", icon: Boxes },
      { to: "/admin/changelog", label: "Changelog", icon: Megaphone },
      { to: "/admin/usuarios", label: "Usuários", icon: Users },
      { to: "/perfis", label: "Trocar perfil", icon: PanelsTopLeft },
    ],
  },
  {
    title: "Configurações",
    items: [
      { to: "/admin/configuracoes", label: "Configurações gerais", icon: Settings },
      { to: "/admin/logs", label: "Logs", icon: ScrollText },
    ],
  },
];

function AdminLayout() {
  const { ready, discordId, isAdmin } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!discordId) void navigate({ to: "/login", replace: true });
    else if (!isAdmin) void navigate({ to: "/perfis", replace: true });
  }, [ready, discordId, isAdmin, navigate]);

  if (!ready || !isAdmin) return null;

  return <Shell groups={groups}>{pathname === "/admin" ? <AdminDashboard /> : <Outlet />}</Shell>;
}
