import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { clearDiscordOAuthState, isValidDiscordOAuthState } from "@/services/auth/discordAuth";
import { exchangeDiscordAuthorizationCode } from "@/services/auth/discordOAuth.functions";

export const Route = createFileRoute("/auth/discord/callback")({
  ssr: false,
  component: DiscordCallbackPage,
});

function DiscordCallbackPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const loginStarted = useRef(false);

  useEffect(() => {
    // Evita que o React em modo de desenvolvimento troque o mesmo code duas vezes.
    if (loginStarted.current) return;
    loginStarted.current = true;

    async function completeLogin() {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error")) {
        clearDiscordOAuthState();
        setError("A autorizacao do Discord foi cancelada ou recusada.");
        return;
      }

      const code = params.get("code");
      if (!code || !isValidDiscordOAuthState(params.get("state"))) {
        clearDiscordOAuthState();
        setError("Nao foi possivel validar o retorno do Discord. Tente novamente.");
        return;
      }

      try {
        const identity = await Promise.race([
          exchangeDiscordAuthorizationCode({ data: { code } }),
          new Promise<never>((_, reject) => {
            window.setTimeout(
              () => reject(new Error("O Discord demorou para responder. Tente entrar novamente.")),
              20_000,
            );
          }),
        ]);
        const discordId = identity.discordId.trim();
        clearDiscordOAuthState();
        signIn(discordId);
        await navigate({ to: "/perfis", replace: true });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel concluir o login com o Discord.",
        );
      }
    }

    void completeLogin();
  }, [navigate, signIn]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="panel w-full max-w-[400px] px-8 py-10 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold">Nao foi possivel entrar</h1>
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-7">
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Autorizando Discord</h1>
            <p className="mt-3 text-sm text-muted-foreground">Concluindo o acesso a sua conta.</p>
          </>
        )}
      </div>
    </main>
  );
}
