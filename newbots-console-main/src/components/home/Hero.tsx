import { HeroAvatar } from "@/components/home/HeroAvatar";

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__layout">
        <div className="home-hero__copy">
          <p className="home-eyebrow home-hero-enter home-hero-enter--1">
            <i /> Automation engine / 2026
          </p>
          <h1 id="home-hero-title" className="home-hero__title" data-parallax="0.018">
            <span className="home-hero-enter home-hero-enter--2">Bots feitos para</span>
            <span className="home-hero-enter home-hero-enter--3 home-hero__title-accent">
              automatizar
            </span>
            <span className="home-hero-enter home-hero-enter--4">seu servidor.</span>
          </h1>

          <div className="home-hero__support home-hero-enter home-hero-enter--5">
            <p>
              Sistemas completos para Discord, criados para organizar equipes, eliminar processos
              manuais e transformar operação em escala.
            </p>
          </div>
        </div>

        <HeroAvatar />
      </div>

      <div className="home-hero__footer home-hero-enter home-hero-enter--6">
        <span>Scroll to explore</span>
        <span className="home-hero__footer-line" />
        <span>Core / Ready</span>
        <span>Latency / 21ms</span>
      </div>
    </section>
  );
}
