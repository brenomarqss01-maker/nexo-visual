import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { Benefits } from "@/components/home/Benefits";
import { Stats } from "@/components/home/Stats";
import { Clients } from "@/components/home/Clients";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/home/Footer";

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
    <div className="relative min-h-screen scroll-smooth">
      <div className="pointer-events-none fixed inset-0 tech-grid opacity-60" aria-hidden="true" />
      <Navbar />
      <main className="relative">
        <Hero />
        <Stats />
        <ProductCarousel />
        <Benefits />
        <Clients />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
