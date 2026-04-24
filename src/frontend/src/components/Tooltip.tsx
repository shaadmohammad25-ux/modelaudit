import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  term: string;
  definition: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Inline tooltip that wraps a term with a hover definition.
 * If children provided, uses children as trigger; otherwise shows
 * the term with a small help icon.
 */
export function DefinitionTooltip({
  term,
  definition,
  children,
  className,
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <ShadTooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-2",
              className,
            )}
          >
            {children ?? term}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-xs bg-card border border-border text-foreground text-xs font-body leading-relaxed p-3"
          side="top"
        >
          <p className="font-semibold font-mono text-primary text-[10px] uppercase tracking-widest mb-1">
            {term}
          </p>
          <p>{definition}</p>
        </TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
  );
}
