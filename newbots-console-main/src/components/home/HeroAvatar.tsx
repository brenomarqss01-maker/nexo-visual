import { useEffect, useRef } from "react";

const AVATAR_PATH = "/nexo-avatar-transparent.png";

export function HeroAvatar() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reducedMotion.matches || !precisePointer.matches) return;

    let frame = 0;
    let bounds = stage.getBoundingClientRect();
    let targetX = 0;
    let targetY = 0;

    const updateBounds = () => {
      bounds = stage.getBoundingClientRect();
    };

    const render = () => {
      stage.style.setProperty("--avatar-rotate-x", `${(-targetY * 3).toFixed(2)}deg`);
      stage.style.setProperty("--avatar-rotate-y", `${(targetX * 5).toFixed(2)}deg`);
      stage.style.setProperty("--avatar-move-x", `${(targetX * 6).toFixed(2)}px`);
      stage.style.setProperty("--avatar-move-y", `${(targetY * 5).toFixed(2)}px`);
      frame = 0;
    };

    const scheduleRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const handlePointerEnter = () => {
      updateBounds();
      stage.classList.add("is-interacting");
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      scheduleRender();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      stage.classList.remove("is-interacting");
      scheduleRender();
    };

    stage.addEventListener("pointerenter", handlePointerEnter);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", updateBounds, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      stage.removeEventListener("pointerenter", handlePointerEnter);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  return (
    <figure
      ref={stageRef}
      className="home-avatar home-hero-enter home-hero-enter--5"
      aria-label="Avatar oficial da NEXO"
    >
      <div className="home-avatar__geometry" aria-hidden="true">
        <span />
        <span />
        <i />
        <i />
      </div>

      <div className="home-avatar__tilt">
        <div className="home-avatar__float">
          <img
            src={AVATAR_PATH}
            alt="Robô oficial da NEXO"
            className="home-avatar__image"
            draggable={false}
          />
        </div>
      </div>
    </figure>
  );
}
