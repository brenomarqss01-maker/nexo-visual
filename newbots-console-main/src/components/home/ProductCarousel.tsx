import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { activeProducts } from "@/data/products";
import { PRODUCT_AUTOPLAY_INTERVAL } from "@/config/site";

export function ProductCarousel() {
  const items = useMemo(() => activeProducts(), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (items.length < 2 || phase === "out") return;
      setPhase("out");
      window.setTimeout(() => {
        setIndex(((next % items.length) + items.length) % items.length);
        setPhase("in");
      }, 260);
    },
    [items.length, phase],
  );

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = window.setInterval(() => go(index + 1), PRODUCT_AUTOPLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [go, index, items.length, paused]);

  if (items.length === 0) return null;
  const product = items[index]!;
  const number = String(index + 1).padStart(2, "0");

  return (
    <section id="produtos" className="home-products">
      <div className="home-section-heading home-section-heading--light" data-reveal="1">
        <div>
          <p className="home-eyebrow">
            <i /> Product index / {String(items.length).padStart(2, "0")}
          </p>
          <h2>
            Sistemas que transformam
            <br />
            operação em <em>escala.</em>
          </h2>
        </div>
        <p>
          Soluções desenhadas para times que precisam de controle, rastreabilidade e automação sem
          aumentar a complexidade.
        </p>
      </div>

      <div className="home-products__workspace" data-reveal="2">
        <nav className="home-product-index" aria-label="Selecionar produto">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(itemIndex)}
              className={itemIndex === index ? "is-active" : ""}
              aria-current={itemIndex === index ? "true" : undefined}
            >
              <span>{String(itemIndex + 1).padStart(2, "0")}</span>
              <strong>{item.title.replace(/^Sistema de /, "")}</strong>
              <i />
            </button>
          ))}
        </nav>

        <article
          className={`home-product ${phase === "in" ? "is-in" : "is-out"}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="home-product__content">
            <div className="home-product__meta">
              <span>Produto / {number}</span>
              {product.badge ? <b>{product.badge}</b> : <span>Status / Active</span>}
            </div>
            <div className="home-product__body">
              <div className="home-product__intro">
                <h3>{product.title}</h3>
                {product.subtitle ? (
                  <p className="home-product__subtitle">{product.subtitle}</p>
                ) : null}
                <p className="home-product__description">{product.description}</p>
              </div>
              <div className="home-product__details">
                <ul>
                  {product.features.map((feature, featureIndex) => (
                    <li key={feature}>
                      <span>0{featureIndex + 1}</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="home-product__link"
                >
                  <span>Conhecer sistema</span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </article>

        {items.length > 1 ? (
          <div className="home-product-controls">
            <span>
              {number} / {String(items.length).padStart(2, "0")}
            </span>
            <div className="home-product-controls__progress">
              {items.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir para ${item.title}`}
                  onClick={() => go(itemIndex)}
                  className={itemIndex === index ? "is-active" : ""}
                />
              ))}
            </div>
            <div>
              <button type="button" aria-label="Produto anterior" onClick={() => go(index - 1)}>
                <ArrowLeft aria-hidden="true" />
              </button>
              <button type="button" aria-label="Próximo produto" onClick={() => go(index + 1)}>
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
