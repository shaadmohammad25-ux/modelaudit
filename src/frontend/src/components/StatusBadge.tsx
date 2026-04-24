import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AuditStatus } from "../types/audit";

interface StatusBadgeProps {
  status: AuditStatus | undefined | null;
  className?: string;
}

const STATUS_CONFIG: Record<
  AuditStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  [AuditStatus.pending]: {
    label: "PENDING",
    className: "bg-muted/40 text-muted-foreground border-border",
  },
  [AuditStatus.processing]: {
    label: "PROCESSING",
    className: "bg-primary/15 text-primary border-primary/40",
    pulse: true,
  },
  [AuditStatus.complete]: {
    label: "COMPLETE",
    className:
      "bg-[oklch(0.45_0.12_145/0.2)] text-[oklch(0.75_0.15_145)] border-[oklch(0.45_0.12_145/0.5)]",
  },
  [AuditStatus.failed]: {
    label: "FAILED",
    className: "bg-destructive/15 text-destructive border-destructive/40",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-mono text-xs text-muted-foreground border-border",
          className,
        )}
      >
        UNKNOWN
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs font-semibold tracking-widest border",
        config.className,
        className,
      )}
    >
      {config.pulse && (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      )}
      {config.label}
    </Badge>
  );
}
