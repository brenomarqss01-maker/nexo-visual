import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function FinalCTA() {
  return (
    <section id="suporte" className="px-5 py-24">
      <div className="relative mx-auto w-full max-w-[1240px] overflow-hidden rounded-[2px] border border-brand/40 bg-surface px-8 py-16 text-center sm:px-16">
        <div className="pointer-events-none absolute inset-0 tech-grid opacity-70" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
        <div className="relative">
          <h2 className="mx-auto max-w-[24ch] text-[1.9rem] font-bold leading-[1.1] sm:text-[2.6rem]">
            Pronto para automatizar <span className="text-brand">seu servidor?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Entre no nosso Discord, conheça os sistemas e fale diretamente com nossa equipe.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-9 h-12 gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
          >
            <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
              <DiscordIcon className="size-4" />
              Entrar no Discord
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
