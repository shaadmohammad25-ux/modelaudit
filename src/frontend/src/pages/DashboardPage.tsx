import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ChevronRight, FilePlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { RiskBadge } from "../components/RiskBadge";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { StatusBadge } from "../components/StatusBadge";
import {
  useActivityFeed,
  useAudits,
  useDashboardStats,
} from "../hooks/useAudit";
import type {
  ActivityEvent,
  AuditSummary,
  DashboardStats,
} from "../types/audit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Number(ts / BigInt(1_000_000))));
}

function formatActivityTime(ts: bigint): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(Number(ts / BigInt(1_000_000))));
}

function getScoreColor(score: number): string {
  if (score < 30) return "text-secondary";
  if (score <= 60) return "text-primary";
  return "text-destructive";
}

function getActivityAccent(eventType: string): string {
  if (eventType === "created") return "border-secondary";
  if (eventType === "started" || eventType === "processing")
    return "border-primary";
  if (eventType === "complete" || eventType === "completed")
    return "border-[oklch(0.55_0.15_145)]";
  if (eventType === "failed") return "border-destructive";
  return "border-border";
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  index: number;
}

function StatCard({ label, value, valueClassName, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className="border border-border bg-card p-4 flex flex-col gap-2 min-w-0"
      data-ocid={`stat.card.${index + 1}`}
    >
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`font-mono text-3xl font-bold tabular-nums leading-none ${valueClassName ?? "text-foreground"}`}
      >
        {value}
      </span>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="border border-border bg-card p-4 flex flex-col gap-2"
      data-ocid="stat.loading_state"
    >
      <Skeleton className="h-3 w-24 bg-muted/40" />
      <Skeleton className="h-9 w-16 bg-muted/40" />
    </div>
  );
}

interface StatCardsRowProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
}

function StatCardsRow({ stats, isLoading, isError }: StatCardsRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-px border border-border bg-border">
        {[0, 1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div
        className="border border-border bg-card p-4 flex items-center gap-2 text-muted-foreground text-sm font-body"
        data-ocid="stat.error_state"
      >
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        Failed to load dashboard statistics.
      </div>
    );
  }

  const avgScore = stats.avgRiskScore;
  const scoreColorClass = getScoreColor(avgScore);

  const cards: StatCardProps[] = [
    { label: "Total Audits", value: stats.totalAudits.toString(), index: 0 },
    {
      label: "Avg Risk Score",
      value: avgScore.toFixed(1),
      valueClassName: scoreColorClass,
      index: 1,
    },
    { label: "Open Issues", value: stats.openIssues.toString(), index: 2 },
    {
      label: "Reports Generated",
      value: stats.reportsGenerated.toString(),
      index: 3,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-px border border-border bg-border">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

// ─── Audits Table ─────────────────────────────────────────────────────────────

const TABLE_HEADERS: { key: string; label: string }[] = [
  { key: "model", label: "Model" },
  { key: "version", label: "Version" },
  { key: "context", label: "Context" },
  { key: "tier", label: "Risk Tier" },
  { key: "score", label: "Score" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" },
  { key: "action", label: "" },
];

function TableRowSkeleton({ index }: { index: number }) {
  return (
    <tr
      className="border-t border-border"
      data-ocid={`audits.loading_state.${index}`}
    >
      {(
        [
          "model",
          "version",
          "context",
          "tier",
          "score",
          "status",
          "date",
          "action",
        ] as const
      ).map((col) => (
        <td key={col} className="px-3 py-3">
          <Skeleton className="h-3.5 w-16 bg-muted/40" />
        </td>
      ))}
    </tr>
  );
}

interface AuditRowProps {
  audit: AuditSummary;
  index: number;
}

function AuditRow({ audit, index }: AuditRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="border-t border-border hover:bg-muted/20 transition-colors duration-150"
      data-ocid={`audits.item.${index + 1}`}
    >
      <td className="px-3 py-2.5 min-w-0 max-w-[180px]">
        <span className="font-display font-semibold text-foreground text-sm truncate block">
          {audit.modelName}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className="font-mono text-xs text-muted-foreground">
          {audit.modelVersion ?? "—"}
        </span>
      </td>
      <td className="px-3 py-2.5 max-w-[140px]">
        <span className="text-xs text-muted-foreground font-body truncate block">
          {audit.deploymentContext}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <RiskBadge tier={audit.riskTier ?? null} size="sm" />
      </td>
      <td className="px-3 py-2.5">
        <ScoreDisplay
          score={audit.overallScore ?? null}
          riskTier={audit.riskTier ?? null}
          size="sm"
        />
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={audit.status} />
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(audit.createdAt)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <Link
          to="/audit/$id"
          params={{ id: audit.id }}
          className="inline-flex items-center gap-0.5 font-mono text-xs text-secondary hover:text-secondary/80 transition-colors duration-150"
          data-ocid={`audits.item.${index + 1}.link`}
        >
          View
          <ChevronRight className="h-3 w-3" />
        </Link>
      </td>
    </motion.tr>
  );
}

interface AuditsTableProps {
  audits: AuditSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

function AuditsTable({ audits, isLoading, isError }: AuditsTableProps) {
  const sorted = audits
    ? [...audits].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  return (
    <div className="border border-border bg-card" data-ocid="audits.table">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Recent Audits
        </span>
        {!isLoading && !isError && audits && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {sorted.length} record{sorted.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h.key}
                  className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground font-normal whitespace-nowrap"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [0, 1, 2, 3, 4].map((i) => (
                <TableRowSkeleton key={i} index={i} />
              ))}

            {isError && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center"
                  data-ocid="audits.error_state"
                >
                  <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-body">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    Failed to load audits.
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && !isError && sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center"
                  data-ocid="audits.empty_state"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p className="font-body text-sm text-muted-foreground">
                      No audits yet.
                    </p>
                    <Link
                      to="/audit/new"
                      className="inline-flex items-center gap-1.5 text-sm font-mono text-primary hover:text-primary/80 transition-colors duration-150"
                      data-ocid="audits.empty_state.link"
                    >
                      Run your first audit
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              sorted.map((audit, i) => (
                <AuditRow key={audit.id} audit={audit} index={i} />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

interface ActivityItemProps {
  event: ActivityEvent;
  index: number;
}

function ActivityItem({ event, index }: ActivityItemProps) {
  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`pl-3 border-l-2 py-0.5 ${getActivityAccent(event.eventType)}`}
      data-ocid={`activity.item.${index + 1}`}
    >
      <span className="font-mono text-[10px] text-muted-foreground block mb-0.5">
        {formatActivityTime(event.timestamp)}
      </span>
      <p className="font-body text-xs text-foreground/80 leading-snug">
        {event.description}
      </p>
    </motion.div>
  );
}

interface ActivityFeedProps {
  events: ActivityEvent[] | undefined;
  isLoading: boolean;
}

function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  const sorted = events
    ? [...events].sort((a, b) => Number(b.timestamp - a.timestamp)).slice(0, 20)
    : [];

  return (
    <aside
      className="flex flex-col w-80 shrink-0 border border-border bg-card"
      data-ocid="activity.panel"
    >
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
          Audit Activity
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {isLoading && (
          <div
            className="flex flex-col gap-3"
            data-ocid="activity.loading_state"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="pl-3 border-l-2 border-border py-0.5">
                <Skeleton className="h-2.5 w-20 bg-muted/40 mb-1" />
                <Skeleton className="h-3 w-full bg-muted/40" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <p
            className="text-xs font-body text-muted-foreground text-center py-6"
            data-ocid="activity.empty_state"
          >
            No recent activity.
          </p>
        )}

        <AnimatePresence initial={false}>
          {!isLoading &&
            sorted.map((event, i) => (
              <ActivityItem key={event.id} event={event} index={i} />
            ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useDashboardStats();
  const {
    data: audits,
    isLoading: auditsLoading,
    isError: auditsError,
  } = useAudits();
  const { data: feed, isLoading: feedLoading } = useActivityFeed();

  return (
    <div
      className="flex flex-col gap-6 py-6 px-6 min-h-full"
      data-ocid="dashboard.page"
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            Audit Dashboard
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            AI ethics & bias auditing — structured accountability.
          </p>
        </div>
        <Link to="/audit/new" data-ocid="dashboard.new_audit_button">
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-widest flex items-center gap-2 shrink-0"
            size="lg"
          >
            <FilePlus className="h-4 w-4" />
            New Audit
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <StatCardsRow
        stats={stats}
        isLoading={statsLoading}
        isError={statsError}
      />

      {/* Two-column body */}
      <div className="flex gap-4 items-start min-h-0">
        {/* Left: audits table */}
        <div className="flex-1 min-w-0">
          <AuditsTable
            audits={audits}
            isLoading={auditsLoading}
            isError={auditsError}
          />
        </div>

        {/* Right: activity feed */}
        <ActivityFeed events={feed} isLoading={feedLoading} />
      </div>
    </div>
  );
}
