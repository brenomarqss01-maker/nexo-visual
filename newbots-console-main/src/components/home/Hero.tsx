import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[620px] -translate-x-1/2 rounded-full bg-brand/12 blur-[140px]" />
      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-16 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="label-kicker">Automação • Gestão • Performance</p>
          <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-[3.4rem] lg:text-[4rem]">
            Bots feitos para
            <br />
            <span className="text-brand">automatizar</span>
            <br />
            seu servidor.
          </h1>
          <p className="mt-7 max-w-[46ch] text-[0.95rem] leading-relaxed text-muted-foreground">
            Sistemas completos para Discord, criados para automatizar processos, organizar equipes e
            facilitar a gestão do seu servidor.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              <a href="#produtos">
                Ver produtos
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 gap-2 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
                <DiscordIcon className="size-4" />
                Discord
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>

        <HeroMark />
      </div>
    </section>
  );
}

function HeroMark() {
  return (
    <div className="relative aspect-square w-full max-w-[520px] justify-self-center">
      <div className="absolute inset-0 rounded-[2px] border border-border/70 tech-grid" />
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-brand/30" />
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brand/20" />

      <div className="absolute inset-[14%] rounded-[2px] border border-border bg-surface/80 shadow-[var(--shadow-panel)]">
        <div className="hairline flex items-center justify-between px-4 py-2.5">
          <span className="label-kicker text-[9px]">nexonetwork.dev</span>
          <span className="flex gap-1.5">
            <span className="size-1.5 rounded-full bg-brand" />
            <span className="size-1.5 rounded-full bg-border" />
            <span className="size-1.5 rounded-full bg-border" />
          </span>
        </div>
        <div className="flex h-[calc(100%-42px)] flex-col items-center justify-center gap-4">
          <span className="font-display text-[clamp(1.6rem,5vw,2.6rem)] font-bold uppercase tracking-[0.28em] text-foreground">
            NEXO
          </span>
          <span className="relative flex size-14 items-center justify-center">
            <span className="absolute inset-0 rotate-45 border border-brand/60" />
            <span className="absolute inset-3 rotate-45 bg-brand/25" />
            <span className="absolute inset-0 rounded-full bg-brand/20 blur-xl" />
          </span>
          <span className="font-display text-[clamp(1.6rem,5vw,2.6rem)] font-bold uppercase tracking-[0.28em] text-brand">
            NETWORK
          </span>
        </div>
      </div>

      <span className="absolute -left-px -top-px size-3 border-l border-t border-brand" />
      <span className="absolute -right-px -top-px size-3 border-r border-t border-brand" />
      <span className="absolute -bottom-px -left-px size-3 border-b border-l border-brand" />
      <span className="absolute -bottom-px -right-px size-3 border-b border-r border-brand" />
    </div>
  );
}
