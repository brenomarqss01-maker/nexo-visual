import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { siteConfig } from "@/config/site";
import { activeProducts } from "@/data/products";

export function Footer() {
  const items = activeProducts();

  return (
    <footer className="home-footer">
      <div className="home-footer__lead">
        <div>
          <NexoLogo className="home-footer__logo" />
          <p>Automação, tecnologia e gestão para comunidades Discord.</p>
        </div>
        <span>
          NEXO NETWORK®
          <br />
          SYSTEMS / 2026
        </span>
      </div>

      <div className="home-footer__grid">
        <div>
          <p className="home-footer__label">Produtos</p>
          {items.map((product) => (
            <a key={product.id} href={product.url} target="_blank" rel="noreferrer">
              {product.title}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>
        <div>
          <p className="home-footer__label">Navegação</p>
          <a href="#por-que">Por que NEXO</a>
          <a href="#clientes">Clientes</a>
          <Link to="/login">Entrar</Link>
        </div>
        <div>
          <p className="home-footer__label">Contato</p>
          <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
            Discord
            <ArrowUpRight aria-hidden="true" />
          </a>
          <a href={siteConfig.supportUrl} target="_blank" rel="noreferrer">
            Suporte
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="home-footer__bottom">
        <p>{siteConfig.copyright}</p>
        <p>
          CORE / ONLINE <i />
        </p>
        <a href="#top" aria-label="Voltar ao topo">
          Topo ↑
        </a>
      </div>
    </footer>
  );
}
