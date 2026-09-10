import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const links = [
  { href: "#produtos", label: "Produtos" },
  { href: "#por-que", label: "Por que NEXO NETWORK" },
  { href: "#clientes", label: "Clientes" },
  { href: "#suporte", label: "Suporte" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-8 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <NexoLogo />
        </Link>

        <nav className="hidden flex-1 items-center gap-7 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden font-mono text-[11px] uppercase tracking-[0.16em] sm:inline-flex"
          >
            <Link to="/login">Entrar</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-2 font-mono text-[11px] uppercase tracking-[0.16em]"
          >
            <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
              <DiscordIcon className="size-4" />
              Discord
            </a>
          </Button>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background lg:hidden">
          <nav className="mx-auto flex w-full max-w-[1240px] flex-col px-5 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground hairline"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="py-3 font-mono text-xs uppercase tracking-[0.16em] text-foreground"
            >
              Entrar
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
