import { cn } from "@/lib/utils";
import { RiskTier } from "../types/audit";

interface ScoreDisplayProps {
  score: number | undefined | null;
  riskTier?: RiskTier | null;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

const TIER_COLOR_CLASS: Record<RiskTier, string> = {
  [RiskTier.low]: "text-secondary",
  [RiskTier.medium]: "text-primary/80",
  [RiskTier.high]: "text-primary",
  [RiskTier.critical]: "text-destructive",
};

function getColorFromScore(score: number): string {
  if (score <= 30) return "text-secondary";
  if (score <= 55) return "text-primary/80";
  if (score <= 75) return "text-primary";
  return "text-destructive";
}

export function ScoreDisplay({
  score,
  riskTier,
  size = "md",
  label,
  className,
}: ScoreDisplayProps) {
  if (score == null) {
    return (
      <span
        className={cn(
          "font-mono text-muted-foreground",
          SIZE_CLASSES[size],
          className,
        )}
      >
        —
      </span>
    );
  }

  const colorClass = riskTier
    ? TIER_COLOR_CLASS[riskTier]
    : getColorFromScore(score);

  const displayScore = Math.round(score);

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <span
        className={cn(
          "font-mono font-bold tabular-nums leading-none",
          SIZE_CLASSES[size],
          colorClass,
        )}
        aria-label={`Risk score: ${displayScore}`}
      >
        {displayScore}
      </span>
      {label && (
        <span className="mt-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
