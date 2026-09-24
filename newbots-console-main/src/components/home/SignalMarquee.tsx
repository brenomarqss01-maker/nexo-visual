const signals = [
  "Discord",
  "Automation",
  "Management",
  "Bots",
  "Systems",
  "Performance",
  "Nexo Network",
];

export function SignalMarquee() {
  const items = [...signals, ...signals];

  return (
    <section className="home-signal" aria-label="Tecnologias e capacidades NEXO">
      <div className="home-signal__track">
        {items.map((signal, index) => (
          <span
            key={`${signal}-${index}`}
            className="home-signal__item"
            aria-hidden={index >= signals.length}
          >
            {signal}
            <i aria-hidden="true" />
          </span>
        ))}
      </div>
    </section>
  );
}
