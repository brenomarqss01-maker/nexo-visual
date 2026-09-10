import { cn } from "@/lib/utils";
import logoUrl from "../../../nexologo.png";

export function NexoLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block h-8 w-[10.4rem] shrink-0 select-none overflow-hidden",
        className,
      )}
    >
      <img
        src={logoUrl}
        alt="NEXO NETWORK"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[550%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
        draggable={false}
      />
    </span>
  );
}
