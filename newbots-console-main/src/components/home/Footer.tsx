import { Link } from "@tanstack/react-router";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { siteConfig } from "@/config/site";
import { activeProducts } from "@/data/products";

export function Footer() {
  const items = activeProducts();

  return (
    <footer className="border-t border-border/60 py-16">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <NexoLogo />
          <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
            Automação, tecnologia e gestão para comunidades Discord.
          </p>
        </div>

        <div>
          <p className="label-kicker">Produtos</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {items.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {p.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#produtos"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Todos os produtos
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="label-kicker">{siteConfig.companyName}</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href="#por-que"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Por que NEXO NETWORK
              </a>
            </li>
            <li>
              <a
                href="#clientes"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Clientes
              </a>
            </li>
            <li>
              <Link
                to="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="label-kicker">Comunidade</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={siteConfig.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href={siteConfig.supportUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Suporte
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1240px] border-t border-border/60 px-5 pt-6">
        <p className="font-mono text-[11px] text-muted-foreground">{siteConfig.copyright}</p>
      </div>
    </footer>
  );
}
