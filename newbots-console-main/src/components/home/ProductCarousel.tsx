import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeProducts } from "@/data/products";
import { PRODUCT_AUTOPLAY_INTERVAL } from "@/config/site";

export function ProductCarousel() {
  const items = useMemo(() => activeProducts(), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (items.length < 2) return;
      setPhase("out");
      window.setTimeout(() => {
        setIndex(((next % items.length) + items.length) % items.length);
        setPhase("in");
      }, 260);
    },
    [items.length],
  );

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = window.setInterval(() => go(index + 1), PRODUCT_AUTOPLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [index, paused, items.length, go]);

  const manual = (next: number) => go(next);

  if (items.length === 0) return null;
  const product = items[index]!;

  return (
    <section id="produtos" className="relative border-t border-border/60 py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label-kicker">Produtos</p>
            <h2 className="mt-4 max-w-[22ch] text-[2rem] font-bold leading-[1.1] sm:text-[2.6rem]">
              Sistemas que levam seu servidor para <span className="text-brand">outro nível.</span>
            </h2>
          </div>
          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Produto anterior"
                onClick={() => manual(index - 1)}
                className="inline-flex size-10 items-center justify-center rounded-[2px] border border-border text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Próximo produto"
                onClick={() => manual(index + 1)}
                className="inline-flex size-10 items-center justify-center rounded-[2px] border border-border text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="panel mt-10 overflow-hidden rounded-[2px]"
        >
          <div
            className={`grid gap-10 p-8 transition-all duration-500 ease-out sm:p-12 lg:grid-cols-[1fr_1fr] ${
              phase === "in" ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
            }`}
          >
            <div className="flex flex-col">
              {product.badge && (
                <span className="mb-5 inline-flex w-fit items-center rounded-[2px] border border-brand/50 bg-brand/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brand">
                  {product.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold sm:text-3xl">{product.title}</h3>
              {product.subtitle && (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {product.subtitle}
                </p>
              )}
              <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <ul className="mt-6 space-y-2.5">
                {product.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-brand" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild className="h-11 font-mono text-[11px] uppercase tracking-[0.18em]">
                  <a href={product.url} target="_blank" rel="noreferrer">
                    Conhecer produto
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative min-h-[240px] rounded-[2px] border border-border bg-surface-2/60 tech-grid">
              {product.image ? (
                <ProductImage src={product.image} alt={`Preview do ${product.title}`} />
              ) : null}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-sm uppercase tracking-[0.3em] text-muted-foreground/50">
                {product.id}
              </span>
            </div>
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            {items.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Ir para ${p.title}`}
                onClick={() => manual(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-brand" : "w-3 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-full rounded-[2px] object-cover"
      onError={() => setFailed(true)}
    />
  );
}
