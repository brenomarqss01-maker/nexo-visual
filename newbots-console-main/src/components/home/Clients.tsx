import { showcaseClients } from "@/data/clients";

export function Clients() {
  if (showcaseClients.length === 0) return null;
  const row = [...showcaseClients, ...showcaseClients];

  return (
    <section id="clientes" className="home-clients">
      <div className="home-clients__heading" data-reveal="1">
        <p className="home-eyebrow">
          <i /> Connected communities
        </p>
        <span>{String(showcaseClients.length).padStart(2, "0")} trusted nodes</span>
      </div>
      <div className="home-clients__viewport" data-reveal="2">
        <div className="home-clients__track">
          {row.map((client, index) => (
            <a
              key={`${client.name}-${index}`}
              href={client.url ?? "#clientes"}
              target={client.url ? "_blank" : undefined}
              rel={client.url ? "noreferrer" : undefined}
              aria-hidden={index >= showcaseClients.length}
              tabIndex={index >= showcaseClients.length ? -1 : undefined}
            >
              <span>{String((index % showcaseClients.length) + 1).padStart(2, "0")}</span>
              {client.logo ? (
                <img src={client.logo} alt={client.name} loading="lazy" />
              ) : (
                <strong>{client.name}</strong>
              )}
              <i aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
