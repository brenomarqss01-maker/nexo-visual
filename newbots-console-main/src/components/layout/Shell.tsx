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

type ShellVariant = "default" | "control";

function SidebarContent({
  groups,
  onNavigate,
  variant = "default",
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
  variant?: ShellVariant;
}) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const control = variant === "control";

  return (
    <div className={cn("flex h-full flex-col bg-sidebar", control && "nexo-control-sidebar")}>
      <div className={cn("flex h-[72px] items-center px-6", control && "nexo-control-brand")}>
        <Link to="/" onClick={onNavigate}>
          <NexoLogo className={control ? "nexo-control-logo" : ""} />
        </Link>
      </div>

      {control ? (
        <div className="nexo-control-identity" aria-hidden="true">
          <span>NEXO / CONTROL</span>
          <span>
            <i /> SYSTEM ONLINE
          </span>
        </div>
      ) : null}

      <nav
        className={cn("flex-1 space-y-6 overflow-y-auto px-3 pb-6", control && "nexo-control-nav")}
      >
        {groups.map((group) => (
          <div key={group.title} className={cn("space-y-1", control && "nexo-control-nav__group")}>
            <p className={cn("label-kicker px-3 pb-2", control && "nexo-control-nav__title")}>
              {group.title}
            </p>
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  data-active={active ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors duration-150",
                    control && "nexo-control-nav__item",
                    active
                      ? "border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  {control ? (
                    <span className="nexo-control-nav__indicator" aria-hidden="true" />
                  ) : null}
                  <item.icon className="size-4 shrink-0" />
                  <span className={cn("truncate", control && "nexo-control-nav__label")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "flex items-center gap-3 border-t border-sidebar-border px-5 py-4",
          control && "nexo-control-user",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-xs text-primary-foreground",
            control && "nexo-control-user__avatar",
          )}
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
          className={cn(
            "rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            control && "nexo-control-signout",
          )}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Shell({
  groups,
  children,
  variant = "default",
}: {
  groups: NavGroup[];
  children: ReactNode;
  variant?: ShellVariant;
}) {
  const [open, setOpen] = useState(false);
  const control = variant === "control";

  return (
    <div className={cn("min-h-screen bg-background", control && "nexo-control")}>
      {control ? <div className="nexo-control-grid" aria-hidden="true" /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-sidebar-border lg:block",
          control && "nexo-control-sidebar-frame",
        )}
      >
        <SidebarContent groups={groups} variant={variant} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-[268px] border-r border-sidebar-border animate-in slide-in-from-left duration-200",
              control && "nexo-control-drawer",
            )}
          >
            <SidebarContent groups={groups} onNavigate={() => setOpen(false)} variant={variant} />
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

      <div className={cn("lg:pl-[256px]", control && "nexo-control-workspace")}>
        {control ? (
          <header className="nexo-control-topbar hidden lg:flex">
            <div>
              <i />
              <span>NEXO / CONTROL</span>
            </div>
            <div>
              <span>CORE / READY</span>
              <span>SESSION / ACTIVE</span>
            </div>
          </header>
        ) : null}

        <header
          className={cn(
            "flex h-[72px] items-center gap-3 border-b border-border px-4 lg:hidden",
            control && "nexo-control-mobile-header",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="rounded-md border border-border bg-card p-2 text-muted-foreground"
          >
            <Menu className="size-4" />
          </button>
          <NexoLogo className={control ? "nexo-control-mobile-logo" : ""} />
          {control ? <span className="nexo-control-mobile-status">CONTROL / ACTIVE</span> : null}
        </header>
        <main
          className={cn(
            "mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 lg:py-12",
            control && "nexo-control-main",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
