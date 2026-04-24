// Re-export backend enums and interfaces
export { AuditStatus, RiskTier } from "../backend";
export type {
  AuditId,
  AuditInput,
  AuditRecord,
  AuditSummary,
  AuditResults,
  DashboardStats,
  ActivityEvent,
  ApiKeyRecord,
} from "../backend";

// ─── Parsed JSON result types ──────────────────────────────────────────────

export interface BiasExample {
  text: string;
  context?: string;
}

export interface BiasResult {
  dimension: string;
  score: number; // 0–10
  severity: "low" | "medium" | "high" | "critical";
  disparityMetric?: string;
  examples: BiasExample[];
  remediation: string;
}

export interface BiasResultsJson {
  dimensions: BiasResult[];
}

export interface SafetyResult {
  category: string;
  score: number; // 0–100
  severity: "low" | "medium" | "high" | "critical";
  flaggedExamples: string[];
  riskDescription: string;
}

export interface SafetyResultsJson {
  checks: SafetyResult[];
}

export type ComplianceStatus = "compliant" | "partial" | "non-compliant";

export interface RegulatoryResult {
  framework: string;
  article: string;
  status: ComplianceStatus;
  notes: string;
  articleSummary?: string;
}

export interface RegulatoryResultsJson {
  results: RegulatoryResult[];
}

export type Priority = "P1" | "P2" | "P3";

export interface Recommendation {
  priority: Priority;
  problem: string;
  rootCause: string;
  fix: string;
  verificationMethod: string;
  effortEstimate: string;
}

export interface RecommendationsJson {
  items: Recommendation[];
}

// ─── Wizard form state ─────────────────────────────────────────────────────

export interface AuditWizardStep1 {
  modelName: string;
  modelVersion: string;
  modelProvider: string;
  deploymentContext: string;
  intendedPopulation: string;
  jurisdiction: string;
}

export interface AuditWizardStep2 {
  inputText: string;
  inputCsvUrl: string;
  selectedBiasDimensions: string[];
  selectedSafetyChecks: string[];
}

export interface AuditWizardStep3 {
  reportTitle: string;
  summaryTone: string;
  selectedFrameworks: string[];
}
