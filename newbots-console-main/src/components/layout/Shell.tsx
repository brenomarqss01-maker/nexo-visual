import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { useAuth } from "@/auth/session";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

function SidebarContent({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-[72px] items-center px-6">
        <Link to="/" onClick={onNavigate}>
          <NexoLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="label-kicker px-3 pb-2">{group.title}</p>
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors duration-150",
                    active
                      ? "border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs text-primary-foreground"
          style={{ backgroundColor: user?.avatarColor ?? "#4f7fd6" }}
        >
          {user?.name?.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="label-kicker">{user?.role === "admin" ? "Administrador" : "Cliente"}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label="Sair"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Shell({ groups, children }: { groups: NavGroup[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-sidebar-border lg:block">
        <SidebarContent groups={groups} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[268px] border-r border-sidebar-border animate-in slide-in-from-left duration-200">
            <SidebarContent groups={groups} onNavigate={() => setOpen(false)} />
          </div>
          <button
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-5 rounded-md border border-border bg-card p-2 text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="lg:pl-[256px]">
        <header className="flex h-[72px] items-center gap-3 border-b border-border px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="rounded-md border border-border bg-card p-2 text-muted-foreground"
          >
            <Menu className="size-4" />
          </button>
          <NexoLogo />
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
