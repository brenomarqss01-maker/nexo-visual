import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NexoLogo } from "@/components/brand/NexoLogo";
import { siteConfig } from "@/config/site";

const links = [
  { href: "#produtos", label: "Produtos" },
  { href: "#por-que", label: "Por que NEXO" },
  { href: "#clientes", label: "Clientes" },
  { href: "#suporte", label: "Suporte" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`home-header ${scrolled || open ? "is-scrolled" : ""}`}>
      <div className="home-header__inner">
        <Link to="/" className="home-header__brand" aria-label="NEXO NETWORK — início">
          <NexoLogo className="home-header__logo" />
        </Link>

        <div className="home-header__status" aria-hidden="true">
          <span /> CORE / ONLINE
        </div>

        <nav className="home-header__nav" aria-label="Navegação principal">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="home-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="home-header__actions">
          <a
            href={siteConfig.discordUrl}
            target="_blank"
            rel="noreferrer"
            className="home-header__discord"
          >
            Discord
          </a>
          <Link to="/login" className="home-access-button">
            <span>Entrar</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="home-menu-button"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className={`home-mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Navegação móvel">
          {links.map((link, index) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>
              {link.label}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
          <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
            <span>05</span>
            Discord
            <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
