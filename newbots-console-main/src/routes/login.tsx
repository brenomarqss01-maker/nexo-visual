import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { useAuth } from "@/auth/session";
import { useData } from "@/data/store";
import { Button } from "@/components/ui/button";
import { beginDiscordLogin } from "@/services/auth/discordAuth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar - NEXO NETWORK" },
      {
        name: "description",
        content:
          "Entre com o Discord para gerenciar as licencas e configuracoes dos seus sistemas NEXO NETWORK.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { databaseError } = useData();
  const { discordId, ready } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !discordId) return;
    void navigate({ to: "/perfis", replace: true });
  }, [ready, discordId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Voltar ao site
        </Link>
        <div className="panel px-8 py-10">
          <div className="flex flex-col items-center text-center">
            <NexoLogo className="h-10 w-[13rem]" />
            <h1 className="mt-8 text-xl font-bold">Area do Cliente</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com o Discord para gerenciar seus sistemas.
            </p>
          </div>

          <Button
            className="mt-8 h-12 w-full gap-2 text-sm font-semibold"
            onClick={() => {
              try {
                beginDiscordLogin();
              } catch (error) {
                setLoginError(
                  error instanceof Error ? error.message : "Nao foi possivel iniciar o login.",
                );
              }
            }}
          >
            <DiscordIcon className="size-[18px]" />
            Entrar com Discord
          </Button>
          {loginError && <p className="mt-3 text-center text-xs text-destructive">{loginError}</p>}
          {databaseError && (
            <p className="mt-3 text-center text-xs text-destructive">
              NÃ£o foi possÃ­vel consultar seus sistemas: {databaseError}
            </p>
          )}

          <p className="label-kicker mt-8 text-center">NEXO NETWORK</p>
        </div>
      </div>
    </div>
  );
}
