import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface DashboardStats {
    reportsGenerated: bigint;
    totalAudits: bigint;
    avgRiskScore: number;
    openIssues: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface AuditRecord {
    id: AuditId;
    status: AuditStatus;
    completedAt?: bigint;
    biasResults?: string;
    inputCsvUrl?: string;
    inputText?: string;
    inputSummary?: string;
    regulatoryResults?: string;
    selectedBiasDimensions: Array<string>;
    overallScore?: number;
    summaryTone: string;
    orgId: string;
    recommendations?: string;
    createdAt: bigint;
    createdBy: string;
    safetyResults?: string;
    riskTier?: RiskTier;
    modelProvider?: string;
    verdict?: string;
    jurisdiction: string;
    selectedSafetyChecks: Array<string>;
    deploymentContext: string;
    outputCount?: bigint;
    modelVersion?: string;
    modelName: string;
    reportTitle?: string;
    intendedPopulation: string;
    selectedFrameworks: Array<string>;
}
export interface AuditSummary {
    id: AuditId;
    status: AuditStatus;
    completedAt?: bigint;
    overallScore?: number;
    createdAt: bigint;
    riskTier?: RiskTier;
    deploymentContext: string;
    modelVersion?: string;
    modelName: string;
}
export type AuditId = string;
export interface ActivityEvent {
    id: string;
    description: string;
    auditId?: string;
    timestamp: bigint;
    eventType: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface AuditInput {
    inputCsvUrl?: string;
    inputText?: string;
    selectedBiasDimensions: Array<string>;
    summaryTone: string;
    modelProvider?: string;
    jurisdiction: string;
    selectedSafetyChecks: Array<string>;
    deploymentContext: string;
    outputCount?: bigint;
    modelVersion?: string;
    modelName: string;
    reportTitle?: string;
    intendedPopulation: string;
    selectedFrameworks: Array<string>;
}
export interface AuditResults {
    biasResults?: string;
    inputSummary?: string;
    regulatoryResults?: string;
    overallScore?: number;
    recommendations?: string;
    safetyResults?: string;
    riskTier?: RiskTier;
    verdict?: string;
}
export interface ApiKeyRecord {
    id: string;
    key: string;
    name: string;
    createdAt: bigint;
    lastUsed?: bigint;
}
export enum AuditStatus {
    pending = "pending",
    complete = "complete",
    processing = "processing",
    failed = "failed"
}
export enum RiskTier {
    low = "low",
    high = "high",
    critical = "critical",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAudit(input: AuditInput): Promise<AuditId>;
    generateApiKey(): Promise<string>;
    getAudit(id: AuditId): Promise<AuditRecord | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    isCallerAdmin(): Promise<boolean>;
    listActivityFeed(): Promise<Array<ActivityEvent>>;
    listApiKeys(): Promise<Array<ApiKeyRecord>>;
    listAudits(): Promise<Array<AuditSummary>>;
    runAudit(id: AuditId): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAuditResults(id: AuditId, results: AuditResults): Promise<void>;
}
