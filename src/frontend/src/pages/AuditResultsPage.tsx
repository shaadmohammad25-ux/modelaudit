import { cn } from "@/lib/utils";
import { useParams } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { RiskBadge } from "../components/RiskBadge";
import { DefinitionTooltip } from "../components/Tooltip";
import { useAudit } from "../hooks/useAudit";
import type { AuditRecord } from "../types/audit";
import { AuditStatus, RiskTier } from "../types/audit";
import type {
  BiasResult,
  BiasResultsJson,
  ComplianceStatus,
  Priority,
  Recommendation,
  RecommendationsJson,
  RegulatoryResult,
  RegulatoryResultsJson,
  SafetyResult,
  SafetyResultsJson,
} from "../types/audit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJson<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function riskTierToVerdict(tier: RiskTier): string {
  switch (tier) {
    case RiskTier.low:
      return "PASS";
    case RiskTier.medium:
      return "WARN";
    case RiskTier.high:
      return "FAIL";
    case RiskTier.critical:
      return "CRITICAL";
  }
}

function scoreToColor(score: number): { stroke: string; text: string } {
  if (score <= 30) return { stroke: "#3A6B8A", text: "text-[#3A6B8A]" };
  if (score <= 55) return { stroke: "#E8A830", text: "text-primary" };
  if (score <= 75) return { stroke: "#d97706", text: "text-[#d97706]" };
  return { stroke: "#dc2626", text: "text-destructive" };
}

function tierColor(tier: RiskTier): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case RiskTier.low:
      return {
        bg: "bg-[#3A6B8A]/20",
        text: "text-[#3A6B8A]",
        border: "border-[#3A6B8A]/50",
      };
    case RiskTier.medium:
      return {
        bg: "bg-primary/20",
        text: "text-primary",
        border: "border-primary/50",
      };
    case RiskTier.high:
      return {
        bg: "bg-primary/30",
        text: "text-primary",
        border: "border-primary/70",
      };
    case RiskTier.critical:
      return {
        bg: "bg-destructive/20",
        text: "text-destructive",
        border: "border-destructive/60",
      };
  }
}

function severityBadge(severity: string): string {
  switch (severity) {
    case "low":
      return "bg-[#3A6B8A]/20 text-[#3A6B8A] border-[#3A6B8A]/40";
    case "medium":
      return "bg-primary/15 text-primary border-primary/40";
    case "high":
      return "bg-primary/30 text-primary border-primary/60";
    case "critical":
      return "bg-destructive/20 text-destructive border-destructive/50";
    default:
      return "bg-muted/40 text-muted-foreground border-border";
  }
}

function priorityConfig(priority: Priority): {
  label: string;
  badge: string;
  sub: string;
} {
  switch (priority) {
    case "P1":
      return {
        label: "P1",
        badge: "bg-destructive/20 text-destructive border-destructive/50",
        sub: "Immediate Action Required",
      };
    case "P2":
      return {
        label: "P2",
        badge: "bg-primary/20 text-primary border-primary/50",
        sub: "High Priority",
      };
    case "P3":
      return {
        label: "P3",
        badge: "bg-[#3A6B8A]/20 text-[#3A6B8A] border-[#3A6B8A]/40",
        sub: "When Possible",
      };
  }
}

function effortBadge(effort: string): string {
  switch (effort?.toUpperCase()) {
    case "HIGH":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "MEDIUM":
      return "bg-primary/10 text-primary border-primary/30";
    case "LOW":
      return "bg-[#3A6B8A]/10 text-[#3A6B8A] border-[#3A6B8A]/30";
    default:
      return "bg-muted/30 text-muted-foreground border-border";
  }
}

function complianceIcon(status: ComplianceStatus): {
  icon: string;
  cls: string;
} {
  switch (status) {
    case "compliant":
      return { icon: "✅", cls: "text-[oklch(0.7_0.15_145)]" };
    case "partial":
      return { icon: "⚠️", cls: "text-primary" };
    case "non-compliant":
      return { icon: "❌", cls: "text-destructive" };
  }
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-xs uppercase tracking-[0.2em] text-primary font-mono font-semibold">
        {children}
      </h2>
      <div className="flex-1 h-px bg-primary/30" />
    </div>
  );
}

// ─── Circular Risk Meter ──────────────────────────────────────────────────────

function RiskMeter({ score, tier }: { score: number; tier: RiskTier }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [strokeOffset, setStrokeOffset] = useState(314);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const colors = scoreToColor(score);
  const tc = tierColor(tier);
  const tierLabel = riskTierToVerdict(tier);

  useEffect(() => {
    const targetOffset = circumference - (score / 100) * circumference;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setAnimatedScore(score);
      setStrokeOffset(targetOffset);
      return;
    }

    let start: number | null = null;
    const startScore = 0;
    const duration = 1500;

    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - progress) ** 3;

      const current = Math.round(startScore + (score - startScore) * ease);
      setAnimatedScore(current);
      setStrokeOffset(circumference - (current / 100) * circumference);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      // reset when score changes
      void targetOffset;
    };
  }, [score, circumference]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-card border border-border rounded-sm">
      {/* SVG Meter */}
      <div className="relative flex-shrink-0">
        <svg
          width="180"
          height="180"
          viewBox="0 0 120 120"
          aria-label={`Risk score: ${score} out of 100`}
          role="img"
        >
          <title>{`Risk score: ${score} out of 100`}</title>
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="oklch(0.2 0 0)"
            strokeWidth="8"
          />
          {/* Animated arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 60 60)"
          />
          {/* Score text */}
          <text
            x="60"
            y="54"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "JetBrainsMono, monospace",
              fill: colors.stroke,
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            {animatedScore}
          </text>
          <text
            x="60"
            y="72"
            textAnchor="middle"
            style={{
              fontFamily: "JetBrainsMono, monospace",
              fill: "oklch(0.55 0 0)",
              fontSize: "9px",
            }}
          >
            / 100
          </text>
        </svg>
      </div>

      {/* Risk tier info */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <DefinitionTooltip
            term="Risk Tier"
            definition="A categorization of overall audit severity: LOW (score 0–30), MEDIUM (31–55), HIGH (56–75), CRITICAL (76–100)."
          >
            <span
              className={cn(
                "text-xs font-mono uppercase tracking-widest",
                tc.text,
              )}
            >
              Risk Tier
            </span>
          </DefinitionTooltip>
          <span
            className={cn(
              "text-3xl font-display font-bold tracking-tight",
              tc.text,
            )}
          >
            {tierLabel}
          </span>
          <span className={cn("ml-1 text-2xl", tc.text)} aria-hidden="true">
            {tier === RiskTier.low
              ? "✓"
              : tier === RiskTier.critical
                ? "✗"
                : "⚠"}
          </span>
        </div>
        <RiskBadge tier={tier} size="md" />
      </div>
    </div>
  );
}

// ─── Verdict Panel ────────────────────────────────────────────────────────────

function VerdictPanel({ verdict, tier }: { verdict: string; tier: RiskTier }) {
  const tc = tierColor(tier);
  const tierLabel = riskTierToVerdict(tier);

  return (
    <div className="relative flex gap-6 items-start p-6 bg-card border border-border rounded-sm border-l-4 border-l-primary mt-4">
      <div className="flex-1">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Audit Verdict
        </p>
        <p className="font-body italic text-lg leading-relaxed text-foreground">
          &ldquo;{verdict}&rdquo;
        </p>
      </div>
      {/* Government stamp */}
      <div
        className={cn(
          "flex-shrink-0 w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center",
          "rotate-[-12deg] select-none",
          tc.border,
          tc.bg,
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "text-[10px] font-mono font-bold uppercase tracking-widest leading-tight text-center",
            tc.text,
          )}
        >
          {tierLabel}
        </span>
        <div className={cn("w-10 h-px my-0.5 opacity-50", tc.bg)} />
        <span className={cn("text-[8px] font-mono uppercase", tc.text)}>
          ModelAudit
        </span>
      </div>
    </div>
  );
}

// ─── Bias Analysis ────────────────────────────────────────────────────────────

function BiasSection({ audit }: { audit: AuditRecord }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const data = parseJson<BiasResultsJson>(audit.biasResults);

  const radarData =
    data?.dimensions.map((d: BiasResult) => ({
      subject:
        d.dimension.length > 12 ? `${d.dimension.slice(0, 12)}…` : d.dimension,
      score: d.score,
      fullName: d.dimension,
    })) ?? [];

  return (
    <section data-ocid="bias.section" aria-labelledby="bias-header">
      <SectionHeader>
        <span id="bias-header">Bias Analysis</span>
      </SectionHeader>

      {!data || data.dimensions.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 border border-dashed border-border rounded-sm"
          data-ocid="bias.empty_state"
        >
          <p className="text-sm text-muted-foreground font-mono">
            Analysis data unavailable
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Radar chart */}
          <div className="flex-shrink-0 w-full lg:w-[380px] h-[320px] bg-card border border-border rounded-sm p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Bias Dimensions — Score (0–10)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
              >
                <PolarGrid stroke="oklch(0.2 0 0)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: "oklch(0.55 0 0)",
                    fontSize: 9,
                    fontFamily: "JetBrainsMono, monospace",
                  }}
                />
                <Radar
                  name="Bias Score"
                  dataKey="score"
                  stroke="#E8A830"
                  fill="#E8A830"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Expandable dimension panels */}
          <div className="flex-1 flex flex-col gap-2">
            {data.dimensions.map((dim: BiasResult, idx: number) => {
              const isExpanded = expandedIndex === idx;
              const isHigh = dim.score > 5;
              const dimKey = `${dim.dimension}-${idx}`;
              return (
                <div
                  key={dimKey}
                  data-ocid={`bias.item.${idx + 1}`}
                  className={cn(
                    "border rounded-sm overflow-hidden transition-smooth",
                    isHigh
                      ? "border-l-4 border-l-primary border-border"
                      : "border-l-4 border-l-[#3A6B8A] border-border",
                  )}
                >
                  <button
                    type="button"
                    data-ocid={`bias.toggle.${idx + 1}`}
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-card/80 transition-smooth"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-body font-medium text-sm text-foreground truncate">
                        {dim.dimension}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono text-sm font-bold text-primary tabular-nums">
                        {dim.score.toFixed(1)}
                        <span className="text-muted-foreground text-xs">
                          /10
                        </span>
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm",
                          severityBadge(dim.severity),
                        )}
                      >
                        {dim.severity}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-card/50 space-y-3 border-t border-border">
                      {dim.examples.length > 0 && (
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                            Examples from submitted outputs
                          </p>
                          <div className="space-y-2">
                            {dim.examples.map((ex) => (
                              <blockquote
                                key={ex.text.slice(0, 40)}
                                className="border-l-2 border-primary pl-3 py-1"
                              >
                                <p className="font-body italic text-sm text-foreground/90">
                                  &ldquo;{ex.text}&rdquo;
                                </p>
                                {ex.context && (
                                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                                    {ex.context}
                                  </p>
                                )}
                              </blockquote>
                            ))}
                          </div>
                        </div>
                      )}

                      {dim.disparityMetric && (
                        <div className="flex items-baseline gap-2">
                          <DefinitionTooltip
                            term="Statistical Disparity"
                            definition="A quantitative measure of the difference in outcomes between demographic groups. Values above 0.2 typically indicate meaningful bias."
                          >
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              Statistical Disparity
                            </span>
                          </DefinitionTooltip>
                          <span className="font-mono text-sm text-primary font-bold">
                            {dim.disparityMetric}
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                          Remediation
                        </p>
                        <p className="font-body text-sm text-foreground/90 leading-relaxed">
                          {dim.remediation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Safety Analysis ──────────────────────────────────────────────────────────

function SafetyScoreBar({ score }: { score: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const colors = scoreToColor(score);
  return (
    <div
      ref={ref}
      className="w-full h-2 bg-muted/30 rounded-full overflow-hidden"
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: colors.stroke }}
        aria-hidden="true"
      />
    </div>
  );
}

function SafetySection({ audit }: { audit: AuditRecord }) {
  const data = parseJson<SafetyResultsJson>(audit.safetyResults);

  return (
    <section data-ocid="safety.section" aria-labelledby="safety-header">
      <SectionHeader>
        <span id="safety-header">Safety Analysis</span>
      </SectionHeader>

      {!data || data.checks.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 border border-dashed border-border rounded-sm"
          data-ocid="safety.empty_state"
        >
          <p className="text-sm text-muted-foreground font-mono">
            Analysis data unavailable
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.checks.map((check: SafetyResult, idx: number) => {
            const checkKey = `${check.category}-${idx}`;
            return (
              <div
                key={checkKey}
                data-ocid={`safety.item.${idx + 1}`}
                className="bg-card border border-border rounded-sm p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-base text-foreground leading-tight">
                    {check.category}
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm flex-shrink-0",
                      severityBadge(check.severity),
                    )}
                  >
                    {check.severity}
                  </span>
                </div>

                <div className="space-y-1">
                  <SafetyScoreBar score={check.score} />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>0</span>
                    <span className="text-primary font-bold">
                      {check.score}
                    </span>
                    <span>100</span>
                  </div>
                  <p
                    className="sr-only"
                    aria-live="polite"
                  >{`${check.category} risk score: ${check.score} out of 100`}</p>
                </div>

                {check.riskDescription && (
                  <p className="text-sm font-body text-foreground/80 leading-relaxed">
                    {check.riskDescription}
                  </p>
                )}

                {check.flaggedExamples.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                      Flagged examples
                    </p>
                    <div className="space-y-1.5">
                      {check.flaggedExamples.slice(0, 2).map((ex) => (
                        <blockquote
                          key={ex.slice(0, 40)}
                          className="border-l-2 border-primary/50 pl-2.5"
                        >
                          <p className="font-body italic text-xs text-foreground/80">
                            &ldquo;{ex}&rdquo;
                          </p>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Regulatory Compliance ────────────────────────────────────────────────────

function RegulatorySection({ audit }: { audit: AuditRecord }) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const data = parseJson<RegulatoryResultsJson>(audit.regulatoryResults);

  const toggleRow = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <section data-ocid="regulatory.section" aria-labelledby="regulatory-header">
      <SectionHeader>
        <DefinitionTooltip
          term="Regulatory Compliance"
          definition="Assessment of the audited model against applicable AI governance frameworks including EU AI Act, NYC Local Law 144, and ISO/IEC 42001."
        >
          <span id="regulatory-header">Regulatory Compliance</span>
        </DefinitionTooltip>
      </SectionHeader>

      {!data || data.results.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 border border-dashed border-border rounded-sm"
          data-ocid="regulatory.empty_state"
        >
          <p className="text-sm text-muted-foreground font-mono">
            No regulatory frameworks selected for this audit
          </p>
        </div>
      ) : (
        <div
          className="border border-border rounded-sm overflow-hidden"
          data-ocid="regulatory.table"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-1/4">
                  Framework
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-1/4">
                  Article
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-1/6">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((row: RegulatoryResult, idx: number) => {
                const isExpanded = expandedRows.has(idx);
                const compliance = complianceIcon(row.status);
                const rowKey = `${row.framework}-${row.article}-${idx}`;
                return (
                  <Fragment key={rowKey}>
                    <tr
                      data-ocid={`regulatory.item.${idx + 1}`}
                      className={cn(
                        "border-b border-border last:border-0 cursor-pointer hover:bg-card/60 transition-smooth",
                        isExpanded && "bg-card/40",
                      )}
                      onClick={() => toggleRow(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") toggleRow(idx);
                      }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                    >
                      <td className="px-4 py-3">
                        <DefinitionTooltip
                          term={row.framework}
                          definition={
                            row.articleSummary ??
                            `Regulatory framework: ${row.framework}`
                          }
                        >
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {row.framework}
                          </span>
                        </DefinitionTooltip>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {row.article}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span aria-hidden="true">{compliance.icon}</span>
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-widest",
                              compliance.cls,
                            )}
                          >
                            {row.status === "non-compliant"
                              ? "Non-Compliant"
                              : `${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-body text-xs text-foreground/80 truncate max-w-[200px]">
                            {row.notes}
                          </p>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        key={`${rowKey}-expand`}
                        className="bg-card/20 border-b border-border"
                      >
                        <td colSpan={4} className="px-4 py-3">
                          <p className="font-body text-sm text-foreground/90 leading-relaxed">
                            {row.notes}
                          </p>
                          {row.articleSummary && (
                            <p className="mt-2 text-xs text-muted-foreground font-mono leading-relaxed">
                              {row.articleSummary}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────

function AuditTrailSection({ audit }: { audit: AuditRecord }) {
  const [visibleCount, setVisibleCount] = useState(0);

  const events = [
    {
      time: formatTimestamp(audit.createdAt),
      text: `Audit submitted for ${audit.modelName}${audit.modelVersion ? ` ${audit.modelVersion}` : ""}`,
    },
    {
      time: formatTimestamp(audit.createdAt + BigInt(1_000_000_000)),
      text: `Bias analysis initiated (${audit.selectedBiasDimensions.length} dimensions)`,
    },
    {
      time: formatTimestamp(audit.createdAt + BigInt(14_000_000_000)),
      text: `Safety analysis initiated (${audit.selectedSafetyChecks.length} checks)`,
    },
    ...(audit.selectedFrameworks.length > 0
      ? [
          {
            time: formatTimestamp(audit.createdAt + BigInt(27_000_000_000)),
            text: `Regulatory mapping: ${audit.selectedFrameworks.slice(0, 2).join(", ")}${audit.selectedFrameworks.length > 2 ? ` +${audit.selectedFrameworks.length - 2} more` : ""}`,
          },
        ]
      : []),
    {
      time: formatTimestamp(audit.createdAt + BigInt(43_000_000_000)),
      text: `Executive summary generated — tone: ${audit.summaryTone}`,
    },
    ...(audit.completedAt
      ? [
          {
            time: formatTimestamp(audit.completedAt),
            text: `Audit complete. Risk tier: ${audit.riskTier?.toUpperCase() ?? "UNKNOWN"}. Score: ${audit.overallScore?.toFixed(0) ?? "—"}/100`,
          },
        ]
      : []),
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setVisibleCount(events.length);
      return;
    }

    if (visibleCount >= events.length) return;
    const delay = visibleCount === 0 ? 400 : 600;
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleCount, events.length]);

  return (
    <section data-ocid="audit-trail.section" aria-labelledby="trail-header">
      <SectionHeader>
        <span id="trail-header">Audit Trail</span>
      </SectionHeader>

      <div
        className="bg-card border border-border rounded-sm p-4 font-mono"
        data-ocid="audit-trail.list"
      >
        <div className="space-y-0">
          {events.slice(0, visibleCount).map((ev, evIdx) => (
            <div
              key={`${ev.time}-${ev.text.slice(0, 20)}`}
              data-ocid={`audit-trail.item.${evIdx + 1}`}
              className="flex items-start gap-4 py-2 border-b border-border/30 last:border-0"
            >
              <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0 pt-0.5">
                {ev.time}
              </span>
              <span className="text-[11px] text-border flex-shrink-0 pt-0.5">
                —
              </span>
              <span
                className={cn(
                  "text-xs text-foreground/90 leading-relaxed",
                  evIdx === events.length - 1
                    ? "text-primary font-semibold"
                    : "",
                )}
              >
                {ev.text}
              </span>
            </div>
          ))}
          {visibleCount < events.length && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-[10px] font-mono text-muted-foreground">
                <span className="inline-block animate-pulse">▊</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function RecommendationsSection({ audit }: { audit: AuditRecord }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const data = parseJson<RecommendationsJson>(audit.recommendations);

  const sorted =
    data?.items.slice().sort((a, b) => {
      const order: Record<Priority, number> = { P1: 0, P2: 1, P3: 2 };
      return order[a.priority] - order[b.priority];
    }) ?? [];

  return (
    <section data-ocid="recommendations.section" aria-labelledby="recs-header">
      <SectionHeader>
        <span id="recs-header">Remediation Recommendations</span>
      </SectionHeader>

      {sorted.length === 0 ? (
        <div
          className="flex items-center justify-center h-32 border border-dashed border-border rounded-sm"
          data-ocid="recommendations.empty_state"
        >
          <p className="text-sm text-muted-foreground font-mono">
            No recommendations available
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="recommendations.list">
          {sorted.map((rec: Recommendation, idx: number) => {
            const pc = priorityConfig(rec.priority);
            const isExpanded = expandedIndex === idx;
            const recKey = `${rec.priority}-${idx}`;
            return (
              <div
                key={recKey}
                data-ocid={`recommendations.item.${idx + 1}`}
                className="border border-border rounded-sm overflow-hidden"
              >
                <button
                  type="button"
                  data-ocid={`recommendations.toggle.${idx + 1}`}
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-card/80 transition-smooth"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold uppercase tracking-widest border px-2 py-0.5 rounded-sm flex-shrink-0",
                        pc.badge,
                      )}
                    >
                      {pc.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 hidden sm:inline">
                      {pc.sub}
                    </span>
                    <span className="text-sm font-body font-medium text-foreground truncate">
                      {rec.problem}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm hidden md:inline",
                        effortBadge(rec.effortEstimate),
                      )}
                    >
                      {rec.effortEstimate} effort
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-card/40 border-t border-border">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Problem", value: rec.problem },
                        { label: "Root Cause", value: rec.rootCause },
                        { label: "Fix", value: rec.fix },
                        {
                          label: "Verification",
                          value: rec.verificationMethod,
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="font-body text-sm text-foreground/90 leading-relaxed">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Effort
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm",
                          effortBadge(rec.effortEstimate),
                        )}
                      >
                        {rec.effortEstimate}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Header Bar ───────────────────────────────────────────────────────────────

function AuditHeader({ audit }: { audit: AuditRecord }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tier = audit.riskTier;
  const verdictLabel = tier ? riskTierToVerdict(tier) : "—";
  const verdictColors: Record<string, string> = {
    PASS: "text-[oklch(0.7_0.15_145)] border-[oklch(0.5_0.15_145)]",
    WARN: "text-primary border-primary",
    FAIL: "text-[#d97706] border-[#d97706]",
    CRITICAL: "text-destructive border-destructive",
  };
  const vc = verdictColors[verdictLabel] ?? "text-foreground border-border";

  return (
    <header
      data-ocid="audit-header"
      className="sticky top-0 z-20 bg-card border-b-2 border-primary/60 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex flex-col min-w-0">
        <h1 className="font-display text-xl font-bold text-foreground truncate">
          {audit.modelName}
        </h1>
        {audit.modelVersion && (
          <span className="font-mono text-xs text-muted-foreground tracking-widest">
            {`v${audit.modelVersion}`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className={cn(
            "font-mono text-sm font-bold tracking-widest border px-3 py-1 rounded-sm",
            vc,
          )}
          data-ocid="audit-header.verdict_badge"
        >
          {verdictLabel}
        </div>
        <RiskBadge tier={tier} />
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatDate(audit.createdAt)}
        </span>
        <div className="relative">
          <button
            type="button"
            data-ocid="audit-header.download_button"
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border border-border rounded-sm font-mono text-xs text-muted-foreground cursor-not-allowed opacity-60 hover:opacity-80 transition-smooth"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label="Download Report — PDF export coming soon"
            aria-disabled="true"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download Report
          </button>
          {showTooltip && (
            <div
              role="tooltip"
              className="absolute right-0 top-full mt-2 z-30 whitespace-nowrap bg-card border border-border text-xs font-body px-3 py-2 rounded-sm text-muted-foreground shadow-lg"
            >
              PDF export coming soon
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Loading / Error States ───────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
      data-ocid="audit.loading_state"
    >
      <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <div className="text-center space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Analyzing your model
        </p>
        <p className="font-body text-sm text-muted-foreground">
          Preparing audit report…
        </p>
      </div>
    </div>
  );
}

const PROCESSING_STEPS = [
  "Bias analysis",
  "Safety checks",
  "Regulatory mapping",
  "Executive summary",
] as const;

function ProcessingState({ audit }: { audit: AuditRecord }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % PROCESSING_STEPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
      data-ocid="audit.processing_state"
    >
      <div className="relative h-20 w-20">
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        <div
          className="absolute inset-3 rounded-full border-2 border-secondary/10 border-b-secondary animate-spin"
          style={{ animationDuration: "2s", animationDirection: "reverse" }}
        />
      </div>

      <div className="text-center space-y-2">
        <p className="font-display text-lg font-bold text-foreground">
          AI analysis in progress
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          {PROCESSING_STEPS[activeStep]}…
        </p>
        <p className="font-body text-sm text-muted-foreground">
          Auditing{" "}
          <span className="font-semibold text-foreground">
            {audit.modelName}
          </span>{" "}
          · This usually takes 30–60 seconds
        </p>
      </div>

      <div className="flex gap-2">
        {PROCESSING_STEPS.map((step, i) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === activeStep
                ? "w-6 bg-primary"
                : i < activeStep
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-muted/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      data-ocid="audit.error_state"
    >
      <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
        <span
          className="font-mono text-destructive font-bold"
          aria-hidden="true"
        >
          ✗
        </span>
      </div>
      <div className="text-center space-y-1.5">
        <p className="font-display text-base font-semibold text-foreground">
          Audit unavailable
        </p>
        <p className="font-body text-sm text-muted-foreground max-w-sm">
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditResultsPage() {
  const { id } = useParams({ from: "/auth/audit/$id" });
  const { data: audit, isLoading, isError, error } = useAudit(id);

  if (isLoading) return <LoadingSkeleton />;
  if (isError)
    return (
      <ErrorState
        message={(error as Error)?.message ?? "Failed to load audit."}
      />
    );
  if (!audit)
    return (
      <ErrorState message="Audit not found. It may have been deleted or the ID is invalid." />
    );

  if (
    audit.status === AuditStatus.pending ||
    audit.status === AuditStatus.processing
  ) {
    return (
      <>
        <AuditHeader audit={audit} />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <ProcessingState audit={audit} />
        </div>
      </>
    );
  }

  if (audit.status === AuditStatus.failed) {
    return (
      <>
        <AuditHeader audit={audit} />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <ErrorState message="The audit job encountered an error. Please try submitting a new audit." />
        </div>
      </>
    );
  }

  return (
    <div
      data-ocid="audit-results.page"
      className="flex flex-col min-h-screen bg-background"
    >
      <AuditHeader audit={audit} />

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <section
          data-ocid="risk-score.section"
          className="mb-8"
          aria-labelledby="risk-score-header"
        >
          <SectionHeader>
            <DefinitionTooltip
              term="Risk Tier"
              definition="An overall risk classification derived from bias, safety, and compliance scores. LOW=0–30, MEDIUM=31–55, HIGH=56–75, CRITICAL=76–100."
            >
              <span id="risk-score-header">Overall Risk Assessment</span>
            </DefinitionTooltip>
          </SectionHeader>
          <RiskMeter
            score={audit.overallScore ?? 0}
            tier={audit.riskTier ?? RiskTier.low}
          />
          {audit.verdict && (
            <VerdictPanel
              verdict={audit.verdict}
              tier={audit.riskTier ?? RiskTier.low}
            />
          )}
        </section>

        <div className="border-t border-primary/20 my-8" />

        <div className="mb-8">
          <BiasSection audit={audit} />
        </div>

        <div className="border-t border-primary/20 my-8" />

        <div className="mb-8">
          <SafetySection audit={audit} />
        </div>

        <div className="border-t border-primary/20 my-8" />

        <div className="mb-8">
          <RegulatorySection audit={audit} />
        </div>

        <div className="border-t border-primary/20 my-8" />

        <div className="mb-8">
          <AuditTrailSection audit={audit} />
        </div>

        <div className="border-t border-primary/20 my-8" />

        <div className="mb-12">
          <RecommendationsSection audit={audit} />
        </div>
      </div>
    </div>
  );
}
