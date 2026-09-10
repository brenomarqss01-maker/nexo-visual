import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageX } from "lucide-react";
import { useAuth } from "@/auth/session";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/no-products")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nenhum produto encontrado — NEXO NETWORK" },
      {
        name: "description",
        content: "Não encontramos sistemas NEXO NETWORK vinculados a esta conta do Discord.",
      },
      { property: "og:title", content: "Nenhum produto encontrado — NEXO NETWORK" },
      {
        property: "og:description",
        content: "Sua conta Discord ainda não possui sistemas NEXO NETWORK vinculados.",
      },
    ],
  }),
  component: NoProductsPage,
});

function NoProductsPage() {
  const { discordId, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px] panel px-8 py-12 text-center">
        <div className="flex flex-col items-center">
          <NexoLogo />
          <span className="mt-8 inline-flex size-12 items-center justify-center rounded-[2px] border border-border bg-surface-2">
            <PackageX className="size-5 text-brand" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">Nenhum produto encontrado</h1>
          <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            Não encontramos nenhum sistema vinculado à sua conta. Caso você tenha realizado uma
            compra recentemente, entre em contato com nosso suporte.
          </p>
          {discordId && <p className="label-kicker mt-4">Discord ID: {discordId}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="h-11 gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
                <DiscordIcon className="size-4" />
                Entrar no Discord
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              className="h-11 font-mono text-[11px] uppercase tracking-[0.18em]"
              asChild
            >
              <Link to="/">Voltar ao site</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
