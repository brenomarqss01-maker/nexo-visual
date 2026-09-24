import { cn } from "@/lib/utils";
import logoUrl from "../../../nexologo.png";

export function NexoLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-[10.4rem] shrink-0 select-none items-center justify-center overflow-hidden",
        className,
      )}
    >
      <img
        src={logoUrl}
        alt="NEXO NETWORK"
        className="pointer-events-none h-auto w-full max-w-full shrink-0 object-contain"
        draggable={false}
      />
    </span>
  );
}
