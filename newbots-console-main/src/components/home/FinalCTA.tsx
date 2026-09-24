import { ArrowUpRight } from "lucide-react";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { siteConfig } from "@/config/site";

export function FinalCTA() {
  return (
    <section id="suporte" className="home-final">
      <div className="home-final__meta" data-reveal="1">
        <p>
          <span /> System ready
        </p>
        <p>NEXO / BR—01</p>
        <p>Response channel / Discord</p>
      </div>
      <div className="home-final__content">
        <h2 data-reveal="1">
          Seu servidor.
          <br />
          Sua operação.
          <br />
          <em>Outro nível.</em>
        </h2>
        <div data-reveal="2">
          <p>
            Entre no nosso Discord, conheça os sistemas e fale diretamente com quem constrói a
            tecnologia por trás da NEXO.
          </p>
          <a href={siteConfig.discordUrl} target="_blank" rel="noreferrer">
            <DiscordIcon aria-hidden="true" />
            <span>Entrar no Discord</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
      <span className="home-final__stamp" aria-hidden="true">
        NX
        <br />
        26
      </span>
    </section>
  );
}
