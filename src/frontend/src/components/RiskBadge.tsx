import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RiskTier } from "../types/audit";

interface RiskBadgeProps {
  tier: RiskTier | undefined | null;
  className?: string;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<RiskTier, { label: string; className: string }> = {
  [RiskTier.low]: {
    label: "LOW",
    className:
      "bg-secondary/20 text-secondary-foreground border-secondary/40 hover:bg-secondary/30",
  },
  [RiskTier.medium]: {
    label: "MEDIUM",
    className:
      "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30",
  },
  [RiskTier.high]: {
    label: "HIGH",
    className:
      "bg-primary/30 text-primary border-primary/60 hover:bg-primary/40",
  },
  [RiskTier.critical]: {
    label: "CRITICAL",
    className:
      "bg-destructive/20 text-destructive border-destructive/50 hover:bg-destructive/30",
  },
};

export function RiskBadge({ tier, className, size = "md" }: RiskBadgeProps) {
  if (!tier) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-mono border-border text-muted-foreground",
          size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs",
          className,
        )}
      >
        —
      </Badge>
    );
  }

  const config = TIER_CONFIG[tier];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono font-semibold tracking-widest border",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
