import { cn } from "@/lib/utils";

export function StatusBadge({ expired, className }: { expired: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
        expired
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-success/25 bg-success/10 text-success",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", expired ? "bg-danger" : "bg-success")} />
      {expired ? "Expirado" : "Ativo"}
    </span>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {kicker ? (
          <div className="flex items-center gap-2">
            <span className="h-3 w-[3px] bg-brand" />
            <span className="label-kicker">{kicker}</span>
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[140px] items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
