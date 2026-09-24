import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__coordinate home-hero-enter home-hero-enter--1" aria-hidden="true">
        <span>NEXO / NETWORK</span>
        <span>SYSTEMS FOR DISCORD</span>
        <span>BR—01</span>
      </div>

      <div className="home-hero__layout">
        <div className="home-hero__copy">
          <p className="home-eyebrow home-hero-enter home-hero-enter--2">
            <i /> Automation engine / 2026
          </p>
          <h1 id="home-hero-title" className="home-hero__title" data-parallax="0.018">
            <span className="home-hero-enter home-hero-enter--3">Bots feitos para</span>
            <span className="home-hero-enter home-hero-enter--4 home-hero__title-accent">
              automatizar
            </span>
            <span className="home-hero-enter home-hero-enter--5">seu servidor.</span>
          </h1>

          <div className="home-hero__support home-hero-enter home-hero-enter--6">
            <p>
              Sistemas completos para Discord, criados para organizar equipes, eliminar processos
              manuais e transformar operação em escala.
            </p>
            <div className="home-hero__actions">
              <a href="#produtos" className="home-primary-cta">
                <span>Explorar sistemas</span>
                <ArrowDownRight aria-hidden="true" />
              </a>
              <a
                href={siteConfig.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="home-text-link"
              >
                Falar com a NEXO
                <ArrowUpRight aria-hidden="true" />
              </a>
              <Link to="/login" className="home-text-link home-text-link--muted">
                Acessar painel
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <CoreMonitor />
      </div>

      <div className="home-hero__footer home-hero-enter home-hero-enter--7">
        <span>Scroll to explore</span>
        <span className="home-hero__footer-line" />
        <span>Core / Ready</span>
        <span>Latency / 21ms</span>
      </div>
    </section>
  );
}

function CoreMonitor() {
  return (
    <aside className="home-core home-hero-enter home-hero-enter--6" data-parallax="-0.012">
      <div className="home-core__topline">
        <span>NEXO CORE</span>
        <span className="home-core__online">
          <i /> Online
        </span>
      </div>
      <div className="home-core__index" aria-hidden="true">
        01
      </div>
      <div className="home-core__orbit" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="home-core__readout">
        <div>
          <span>Bot engine</span>
          <strong>Active</strong>
        </div>
        <div>
          <span>Discord API</span>
          <strong>Connected</strong>
        </div>
        <div>
          <span>Automation</span>
          <strong>Running</strong>
        </div>
      </div>
      <div className="home-core__code">SYS.NXO—26 / 003DC9</div>
    </aside>
  );
}
