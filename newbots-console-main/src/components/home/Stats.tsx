import { useEffect, useRef, useState } from "react";
import { stats } from "@/data/stats";

export function Stats() {
  return (
    <section className="home-stats" aria-label="Indicadores NEXO NETWORK">
      <div className="home-stats__header" data-reveal="1">
        <span>Operational metrics</span>
        <span>Live overview / BR—01</span>
      </div>
      <div className="home-stats__grid">
        {stats.map((stat, index) => (
          <article key={stat.label} className="home-stat" data-reveal={String(index + 1)}>
            <span className="home-stat__index">0{index + 1}</span>
            <AnimatedMetric value={stat.value} duration={1450 + index * 150} />
            <p>{stat.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnimatedMetric({ value, duration }: { value: string; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  const countable = Boolean(match) && !value.includes("/");
  const prefix = match?.[1] ?? "";
  const end = Number(match?.[2] ?? 0);
  const suffix = match?.[3] ?? "";
  const decimals = match?.[2]?.includes(".") ? (match[2].split(".")[1]?.length ?? 0) : 0;
  const [display, setDisplay] = useState(
    countable ? `${prefix}${(0).toFixed(decimals)}${suffix}` : value,
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !countable) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        const start = performance.now();
        const animateCounter = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = end * eased;
          setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
          if (progress < 1) frame = window.requestAnimationFrame(animateCounter);
        };
        frame = window.requestAnimationFrame(animateCounter);
      },
      { threshold: 0.45 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [countable, decimals, duration, end, prefix, suffix, value]);

  return (
    <strong ref={ref} className={`home-stat__value ${countable ? "" : "home-stat__value--static"}`}>
      {display}
    </strong>
  );
}
