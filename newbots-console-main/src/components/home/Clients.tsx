import { showcaseClients } from "@/data/clients";

export function Clients() {
  if (showcaseClients.length === 0) return null;
  const row = [...showcaseClients, ...showcaseClients];

  return (
    <section id="clientes" className="border-t border-border/60 py-20">
      <div className="mx-auto w-full max-w-[1240px] px-5">
        <p className="label-kicker text-center">Utilizado por</p>
      </div>
      <div className="relative mt-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="marquee flex w-max items-center gap-4">
          {row.map((c, i) => (
            <a
              key={`${c.name}-${i}`}
              href={c.url ?? "#clientes"}
              target={c.url ? "_blank" : undefined}
              rel="noreferrer"
              className="flex h-16 min-w-[190px] items-center justify-center rounded-[2px] border border-border bg-surface px-6 transition-colors hover:border-brand/60"
            >
              {c.logo ? (
                <img
                  src={c.logo}
                  alt={c.name}
                  loading="lazy"
                  className="max-h-8 w-auto opacity-70"
                />
              ) : (
                <span className="font-display text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {c.name}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
