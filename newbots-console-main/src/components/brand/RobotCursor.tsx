import { useEffect, useRef } from "react";

const CLICKABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[role="button"]',
  '[role="link"]',
  "[data-clickable]",
].join(",");

export function RobotCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const setState = (name: string, enabled: boolean) => {
      cursor.classList.toggle(name, enabled);
    };

    const handleMove = (event: PointerEvent) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      setState("is-visible", true);
      const target = event.target;
      setState(
        "is-interactive",
        target instanceof Element && Boolean(target.closest(CLICKABLE_SELECTOR)),
      );
    };

    const hideCursor = () => setState("is-visible", false);
    const releaseCursor = () => setState("is-pressed", false);
    const pressCursor = () => setState("is-pressed", true);

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerdown", pressCursor);
    document.addEventListener("pointerup", releaseCursor);
    document.addEventListener("pointercancel", releaseCursor);
    document.addEventListener("mouseleave", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerdown", pressCursor);
      document.removeEventListener("pointerup", releaseCursor);
      document.removeEventListener("pointercancel", releaseCursor);
      document.removeEventListener("mouseleave", hideCursor);
      window.removeEventListener("blur", hideCursor);
    };
  }, []);

  return (
    <div ref={cursorRef} className="robot-cursor" aria-hidden="true">
      <span className="robot-cursor__antenna" />
      <span className="robot-cursor__head">
        <span className="robot-cursor__eye" />
        <span className="robot-cursor__eye" />
      </span>
      <span className="robot-cursor__body" />
    </div>
  );
}
