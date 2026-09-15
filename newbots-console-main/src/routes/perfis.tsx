import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Bot, LogOut, Server, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { useAuth } from "@/auth/session";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { Button } from "@/components/ui/button";
import type { PersonalizationApplication } from "@/services/personalization/personalization.types";

export const Route = createFileRoute("/perfis")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Escolha seu perfil — NEXO NETWORK" },
      {
        name: "description",
        content: "Escolha qual aplicação e servidor Discord deseja administrar.",
      },
    ],
  }),
  component: ProfileSelection,
});

function ProfileSelection() {
  const {
    ready,
    discordId,
    user,
    applications,
    accessError,
    isAdmin,
    selectClient,
    clearSelectedClient,
    refreshApplications,
    signOut,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!discordId) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    void refreshApplications();
  }, [ready, discordId, navigate, refreshApplications]);

  if (!ready || !discordId) {
    return (
      <main className="profile-stage flex min-h-screen items-center justify-center px-5">
        <div className="size-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
      </main>
    );
  }

  const openApplication = (application: PersonalizationApplication) => {
    selectClient(application.clientId);
    void navigate({ to: "/painel" });
  };

  return (
    <main className="profile-stage relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 sm:py-12">
      <div className="profile-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="profile-orb profile-orb--one" aria-hidden="true" />
      <div className="profile-orb profile-orb--two" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1180px]">
        <header className="flex items-center justify-between gap-4 border-b border-border/70 pb-6">
          <NexoLogo className="h-9 w-[12rem]" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{discordId}</p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Sair"
              onClick={async () => {
                await signOut();
                void navigate({ to: "/login", replace: true });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <section className="pb-10 pt-12 sm:pt-16">
          <div className="profile-heading max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-brand">
              <Sparkles className="size-3.5" /> Central de acesso
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              Qual perfil você quer usar?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Cada perfil representa uma aplicação e um servidor diferente. Tudo o que você salvar
              ficará isolado no servidor escolhido.
            </p>
          </div>
        </section>

        {accessError ? (
          <div className="mb-6 rounded-xl border border-danger/25 bg-danger/10 px-5 py-4 text-sm text-danger">
            {accessError}
          </div>
        ) : null}

        <section className="grid gap-5 pb-16 md:grid-cols-2 xl:grid-cols-3">
          {isAdmin ? (
            <button
              type="button"
              className="profile-card profile-card--admin group text-left"
              style={{ "--profile-delay": "0ms" } as CSSProperties}
              onClick={() => {
                clearSelectedClient();
                void navigate({ to: "/admin" });
              }}
            >
              <div className="profile-card__banner profile-card__banner--admin">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/35 via-transparent to-white/5" />
                <NexoLogo className="relative z-10 h-11 w-[14rem] opacity-90" />
              </div>
              <div className="profile-card__body">
                <span className="profile-card__avatar border-brand/40 bg-brand/15 text-brand">
                  <ShieldCheck className="size-7" />
                </span>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">Administração NEXO</h2>
                      <BadgeCheck className="size-4 text-brand" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Clientes, sistemas, usuários e configurações gerais.
                    </p>
                  </div>
                  <span className="profile-card__arrow">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
                <div className="mt-5 border-t border-border/70 pt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-brand">
                  Perfil exclusivo · {discordId}
                </div>
              </div>
            </button>
          ) : null}

          {applications.map((application, index) => (
            <ApplicationProfileCard
              key={application.clientId}
              application={application}
              index={index + (isAdmin ? 1 : 0)}
              onOpen={() => openApplication(application)}
            />
          ))}
        </section>

        {!isAdmin && applications.length === 0 && !accessError ? (
          <div className="panel mx-auto max-w-xl px-8 py-12 text-center">
            <Bot className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-5 text-xl font-bold">Nenhuma aplicação disponível</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Seu Discord ID não é titular de uma aplicação e nenhum dos seus cargos liberou acesso.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function ApplicationProfileCard({
  application,
  index,
  onOpen,
}: {
  application: PersonalizationApplication;
  index: number;
  onOpen: () => void;
}) {
  const customization = application.customization;
  const accentColor = customization?.accentColor || "#4f7fd6";

  return (
    <button
      type="button"
      className="profile-card group text-left"
      style={{ "--profile-delay": `${Math.min(index, 8) * 80}ms` } as CSSProperties}
      onClick={onOpen}
    >
      <div
        className="profile-card__banner"
        style={{
          background: `radial-gradient(circle at 20% 10%, ${accentColor}80 0%, transparent 50%), linear-gradient(135deg, #111217 0%, ${accentColor}30 100%)`,
        }}
      >
        {customization?.bannerUrl ? (
          <img
            src={customization.bannerUrl}
            alt={`Banner de ${application.appName}`}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      <div className="profile-card__body">
        <span
          className="profile-card__avatar overflow-hidden bg-surface-2"
          style={{ borderColor: `${accentColor}80` }}
        >
          {customization?.avatarUrl ? (
            <img
              src={customization.avatarUrl}
              alt={`Perfil de ${application.appName}`}
              className="size-full object-cover"
            />
          ) : application.guildIconUrl ? (
            <img
              src={application.guildIconUrl}
              alt={`Ícone de ${application.guildName}`}
              className="size-full object-cover"
            />
          ) : (
            <Bot className="size-7 text-muted-foreground" />
          )}
        </span>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold">{application.appName}</h2>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                APP
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {customization?.requestedName || application.botName}
            </p>
          </div>
          <span className="profile-card__arrow">
            <ArrowRight className="size-4" />
          </span>
        </div>

        <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Server className="size-3.5 shrink-0 text-brand" />
            <span className="truncate">{application.guildName}</span>
          </div>
          <div className="flex items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="truncate">{application.guildId}</span>
            <span className="shrink-0 uppercase tracking-[0.12em]">
              {application.accessMode === "owner" ? "Titular" : "Acesso por cargo"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
