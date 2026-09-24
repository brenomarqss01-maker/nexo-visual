import { useEffect } from "react";

export function HomeMotion() {
  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".home-shell");
    if (!home) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealItems = [...home.querySelectorAll<HTMLElement>("[data-reveal]")];
    const parallaxItems = [...home.querySelectorAll<HTMLElement>("[data-parallax]")];
    home.classList.add("home-motion-ready");

    let observer: IntersectionObserver | undefined;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-revealed"));
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            observer?.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10%", threshold: 0.12 },
      );
      revealItems.forEach((item) => observer?.observe(item));
    }

    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      if (reducedMotion) return;
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset["parallax"] || "0.03");
        const offset = Math.max(-48, Math.min(48, window.scrollY * speed));
        item.style.setProperty("--home-parallax", `${offset.toFixed(2)}px`);
      });
    };
    const requestParallax = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", requestParallax);
      if (frame) window.cancelAnimationFrame(frame);
      home.classList.remove("home-motion-ready");
    };
  }, []);

  return null;
}
