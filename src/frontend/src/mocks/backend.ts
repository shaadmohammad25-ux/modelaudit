import type { backendInterface } from "../backend";
import {
  AuditStatus,
  RiskTier,
  UserRole,
} from "../backend";

export const mockBackend: backendInterface = {
  _initializeAccessControl: async () => undefined,
  assignCallerUserRole: async () => undefined,
  createAudit: async () => "audit-001",
  generateApiKey: async () => "mk_test_1234567890abcdef",
  getAudit: async () => ({
    id: "audit-001",
    status: AuditStatus.complete,
    completedAt: BigInt(Date.now() - 3600000) * BigInt(1000000),
    biasResults: JSON.stringify({
      dimensions: [
        { name: "Gender", score: 7.2, severity: "High", examples: ["Output favored male pronouns in 78% of hiring recommendations"], disparity: 0.78, remediation: "Implement gender-neutral language guidelines. Audit training data for gender representation balance." },
        { name: "Race/Ethnicity", score: 5.8, severity: "Medium", examples: ["Names associated with minority groups scored 12% lower in creditworthiness"], disparity: 0.62, remediation: "Review feature weights for proxy variables. Consider counterfactual fairness metrics." },
        { name: "Age", score: 3.1, severity: "Low", examples: ["Slight preference for candidates aged 25-35 in promotion recommendations"], disparity: 0.31, remediation: "Remove age-correlated features from the recommendation pipeline." },
        { name: "Disability", score: 2.4, severity: "Low", examples: ["Disability status not explicitly addressed in outputs"], disparity: 0.24, remediation: "Add explicit disability accommodation prompts to model card." },
        { name: "Socioeconomic", score: 6.1, severity: "Medium", examples: ["Zip code used as proxy for creditworthiness, correlating with race"], disparity: 0.61, remediation: "Remove geographic features that serve as socioeconomic proxies." },
        { name: "Political", score: 1.2, severity: "Low", examples: ["No significant political bias detected in outputs"], disparity: 0.12, remediation: "Continue monitoring for political framing in edge cases." },
      ]
    }),
    inputCsvUrl: undefined,
    inputText: "Sample model outputs for bias analysis...",
    inputSummary: "500 hiring recommendation outputs from GPT-4 deployment in enterprise HR system.",
    regulatoryResults: JSON.stringify({
      frameworks: [
        { name: "EU AI Act", article: "Article 10 - Data Governance", status: "partial", notes: "Training data documentation incomplete. Bias testing performed but not documented per Annex IV requirements." },
        { name: "NYC Local Law 144", article: "§ 20-871 Automated Employment Decision Tools", status: "non-compliant", notes: "Bias audit required before deployment. Current audit reveals significant gender bias above threshold." },
        { name: "US Executive Order 14110", article: "Section 4.2 - AI Safety Standards", status: "compliant", notes: "Safety documentation meets baseline requirements. Red-teaming evidence provided." },
        { name: "ISO/IEC 42001", article: "Clause 6.1 - Risk Assessment", status: "partial", notes: "Risk assessment framework in place but impact assessment not finalized for high-risk deployment context." },
      ]
    }),
    selectedBiasDimensions: ["Gender", "Race/Ethnicity", "Age", "Disability", "Socioeconomic", "Political"],
    overallScore: 72,
    summaryTone: "technical",
    orgId: "org-001",
    recommendations: JSON.stringify([
      { priority: "P1", problem: "Gender bias in hiring recommendations", rootCause: "Training data overrepresents male candidates in leadership roles", fix: "Retrain with balanced dataset and apply post-processing fairness constraints", verification: "Rerun bias audit targeting gender parity metric ≤ 0.1 disparity", effort: "High" },
      { priority: "P1", problem: "NYC Local Law 144 non-compliance", rootCause: "Formal bias audit not filed with NYC DCWP before deployment", fix: "Engage accredited bias auditor, file report with DCWP 90 days before use", verification: "Obtain compliance certificate from DCWP", effort: "Medium" },
      { priority: "P2", problem: "Socioeconomic proxy variables", rootCause: "Geographic features correlate with protected characteristics", fix: "Remove zip code and neighborhood-level features from input pipeline", verification: "Measure disparate impact ratio before/after feature removal", effort: "Medium" },
      { priority: "P3", problem: "EU AI Act documentation gap", rootCause: "Annex IV technical documentation not complete", fix: "Complete model card documentation per Annex IV requirements", verification: "Internal audit checklist sign-off by compliance team", effort: "Low" },
    ]),
    createdAt: BigInt(Date.now() - 7200000) * BigInt(1000000),
    createdBy: "user-demo",
    safetyResults: JSON.stringify({
      categories: [
        { name: "Harmful Content", score: 1.8, risk: "Low", examples: ["No harmful outputs detected in sample"], description: "Model outputs do not contain directly harmful content." },
        { name: "Misinformation Potential", score: 4.2, risk: "Medium", examples: ["Overconfident salary predictions without uncertainty bounds"], description: "Model presents probabilistic outputs as definitive, risking misinformation." },
        { name: "Manipulative Language", score: 2.1, risk: "Low", examples: ["No manipulative framing detected"], description: "Language patterns are neutral and non-coercive." },
        { name: "PII Exposure Risk", score: 5.5, risk: "Medium", examples: ["Candidate names appear in recommendation reasoning"], description: "Individual candidate details may appear in model outputs, creating PII exposure risk." },
      ]
    }),
    riskTier: RiskTier.high,
    modelProvider: "OpenAI",
    verdict: "This model exhibits statistically significant gender bias in hiring recommendation contexts (disparity score: 0.78) and fails NYC Local Law 144 compliance requirements. Immediate remediation is required before production deployment.",
    jurisdiction: "United States (New York)",
    selectedSafetyChecks: ["Harmful content", "Misinformation potential", "Manipulative language", "PII exposure risk"],
    deploymentContext: "hiring",
    outputCount: BigInt(500),
    modelVersion: "gpt-4-0125-preview",
    modelName: "HireAssist Pro",
    reportTitle: "HireAssist Pro Bias & Safety Audit — Q1 2025",
    intendedPopulation: "Job applicants across enterprise clients, primarily US-based",
    selectedFrameworks: ["EU AI Act", "NYC Local Law 144", "US Executive Order 14110", "ISO/IEC 42001"],
  }),
  getCallerUserRole: async () => UserRole.admin,
  getDashboardStats: async () => ({
    reportsGenerated: BigInt(23),
    totalAudits: BigInt(47),
    avgRiskScore: 61.4,
    openIssues: BigInt(12),
  }),
  isCallerAdmin: async () => true,
  listActivityFeed: async () => [
    { id: "evt-001", description: "Audit completed for HireAssist Pro v4.1", auditId: "audit-001", timestamp: BigInt(Date.now() - 3600000) * BigInt(1000000), eventType: "audit_complete" },
    { id: "evt-002", description: "New audit submitted: LoanDecide AI v2.3", auditId: "audit-002", timestamp: BigInt(Date.now() - 7200000) * BigInt(1000000), eventType: "audit_created" },
    { id: "evt-003", description: "PDF report generated and emailed", auditId: "audit-001", timestamp: BigInt(Date.now() - 3000000) * BigInt(1000000), eventType: "report_generated" },
    { id: "evt-004", description: "Risk tier upgraded to CRITICAL for ContentMod v1.0", auditId: "audit-003", timestamp: BigInt(Date.now() - 86400000) * BigInt(1000000), eventType: "risk_escalated" },
    { id: "evt-005", description: "Audit started: MedDiag System v3.0", auditId: "audit-004", timestamp: BigInt(Date.now() - 172800000) * BigInt(1000000), eventType: "audit_started" },
  ],
  listApiKeys: async () => [
    { id: "key-001", key: "mk_live_****************************3f9a", name: "Production CI/CD", createdAt: BigInt(Date.now() - 2592000000) * BigInt(1000000), lastUsed: BigInt(Date.now() - 86400000) * BigInt(1000000) },
    { id: "key-002", key: "mk_live_****************************7c2b", name: "Staging Environment", createdAt: BigInt(Date.now() - 1296000000) * BigInt(1000000), lastUsed: BigInt(Date.now() - 604800000) * BigInt(1000000) },
  ],
  listAudits: async () => [
    { id: "audit-001", status: AuditStatus.complete, completedAt: BigInt(Date.now() - 3600000) * BigInt(1000000), overallScore: 72, createdAt: BigInt(Date.now() - 7200000) * BigInt(1000000), riskTier: RiskTier.high, deploymentContext: "hiring", modelVersion: "gpt-4-0125-preview", modelName: "HireAssist Pro" },
    { id: "audit-002", status: AuditStatus.processing, completedAt: undefined, overallScore: undefined, createdAt: BigInt(Date.now() - 1800000) * BigInt(1000000), riskTier: undefined, deploymentContext: "lending", modelVersion: "v2.3", modelName: "LoanDecide AI" },
    { id: "audit-003", status: AuditStatus.complete, completedAt: BigInt(Date.now() - 86400000) * BigInt(1000000), overallScore: 91, createdAt: BigInt(Date.now() - 90000000) * BigInt(1000000), riskTier: RiskTier.critical, deploymentContext: "content moderation", modelVersion: "v1.0", modelName: "ContentMod" },
    { id: "audit-004", status: AuditStatus.complete, completedAt: BigInt(Date.now() - 172800000) * BigInt(1000000), overallScore: 34, createdAt: BigInt(Date.now() - 180000000) * BigInt(1000000), riskTier: RiskTier.low, deploymentContext: "healthcare", modelVersion: "v3.0", modelName: "MedDiag System" },
    { id: "audit-005", status: AuditStatus.pending, completedAt: undefined, overallScore: undefined, createdAt: BigInt(Date.now() - 300000) * BigInt(1000000), riskTier: undefined, deploymentContext: "hiring", modelVersion: "v1.5", modelName: "TalentFilter" },
  ],
  runAudit: async () => undefined,
  setAnthropicApiKey: async () => undefined,
  transform: async (input) => input.response,
  updateAuditResults: async () => undefined,
};
