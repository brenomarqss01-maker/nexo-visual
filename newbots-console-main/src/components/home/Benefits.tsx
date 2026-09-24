import { Gauge, LifeBuoy, Sliders, Workflow } from "lucide-react";

const benefits = [
  {
    icon: Gauge,
    title: "Performance",
    text: "Bots e sistemas desenvolvidos para executar de forma rápida e estável.",
  },
  {
    icon: Workflow,
    title: "Automação",
    text: "Reduza tarefas manuais e automatize processos do seu servidor.",
  },
  {
    icon: Sliders,
    title: "Configuração simples",
    text: "Configure seus sistemas diretamente pela Área do Cliente.",
  },
  {
    icon: LifeBuoy,
    title: "Suporte",
    text: "Tenha acesso à nossa equipe sempre que precisar de ajuda.",
  },
];

export function Benefits() {
  return (
    <section id="por-que" className="home-benefits">
      <div className="home-section-heading" data-reveal="1">
        <div>
          <p className="home-eyebrow">
            <i /> Why NEXO / 04 principles
          </p>
          <h2>
            Precisão no código.
            <br />
            <em>Controle</em> na operação.
          </h2>
        </div>
        <p>
          Tecnologia só é útil quando simplifica. Cada camada da NEXO existe para tornar seu
          servidor mais eficiente, previsível e fácil de gerenciar.
        </p>
      </div>

      <div className="home-benefits__list">
        {benefits.map((benefit, index) => (
          <article key={benefit.title} className="home-benefit" data-reveal={String(index + 1)}>
            <span className="home-benefit__number">0{index + 1}</span>
            <div className="home-benefit__title">
              <benefit.icon aria-hidden="true" />
              <h3>{benefit.title}</h3>
            </div>
            <p>{benefit.text}</p>
            <span className="home-benefit__signal" aria-hidden="true">
              <i />
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
