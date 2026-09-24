import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { Benefits } from "@/components/home/Benefits";
import { Stats } from "@/components/home/Stats";
import { Clients } from "@/components/home/Clients";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/home/Footer";
import { HomeMotion } from "@/components/home/HomeMotion";
import { SignalMarquee } from "@/components/home/SignalMarquee";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXO NETWORK — Bots e sistemas para Discord" },
      {
        name: "description",
        content:
          "Sistemas completos para Discord: registro, tickets, ponto e vendas. Automatize processos e gerencie tudo pela Área do Cliente NEXO NETWORK.",
      },
      { property: "og:title", content: "NEXO NETWORK — Bots e sistemas para Discord" },
      {
        property: "og:description",
        content:
          "Automação, gestão e performance para o seu servidor Discord. Conheça os sistemas NEXO NETWORK.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div id="top" className="home-shell relative min-h-screen scroll-smooth">
      <HomeMotion />
      <div className="home-backdrop" aria-hidden="true" />
      <Navbar />
      <main className="relative">
        <Hero />
        <Stats />
        <ProductCarousel />
        <SignalMarquee />
        <Benefits />
        <Clients />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
