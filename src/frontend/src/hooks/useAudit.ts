import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  ActivityEvent,
  AuditId,
  AuditInput,
  AuditRecord,
  AuditSummary,
  DashboardStats,
} from "../types/audit";

function useBackend() {
  return useActor(createActor);
}

// ─── Query hooks ───────────────────────────────────────────────────────────

export function useAudits() {
  const { actor, isFetching } = useBackend();
  return useQuery<AuditSummary[]>({
    queryKey: ["audits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAudits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAudit(id: AuditId | undefined) {
  const { actor, isFetching } = useBackend();
  return useQuery<AuditRecord | null>({
    queryKey: ["audit", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAudit(id);
    },
    enabled: !!actor && !isFetching && !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "pending" || data?.status === "processing") {
        return 3000;
      }
      return false;
    },
  });
}

export function useDashboardStats() {
  const { actor, isFetching } = useBackend();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) {
        return {
          totalAudits: BigInt(0),
          avgRiskScore: 0,
          openIssues: BigInt(0),
          reportsGenerated: BigInt(0),
        };
      }
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActivityFeed() {
  const { actor, isFetching } = useBackend();
  return useQuery<ActivityEvent[]>({
    queryKey: ["activityFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listActivityFeed();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutation hooks ────────────────────────────────────────────────────────

export function useCreateAudit() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation<AuditId, Error, AuditInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createAudit(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useRunAudit() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation<void, Error, AuditId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.runAudit(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["audit", id] });
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
  });
}
