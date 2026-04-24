module {
  public type AuditId = Text;

  public type AuditStatus = {
    #pending;
    #processing;
    #complete;
    #failed;
  };

  public type RiskTier = {
    #low;
    #medium;
    #high;
    #critical;
  };

  public type AuditInput = {
    modelName : Text;
    modelVersion : ?Text;
    modelProvider : ?Text;
    deploymentContext : Text;
    intendedPopulation : Text;
    jurisdiction : Text;
    selectedBiasDimensions : [Text];
    selectedSafetyChecks : [Text];
    selectedFrameworks : [Text];
    summaryTone : Text;
    reportTitle : ?Text;
    inputText : ?Text;
    inputCsvUrl : ?Text;
    outputCount : ?Nat;
  };

  public type AuditRecord = {
    id : AuditId;
    orgId : Text;
    modelName : Text;
    modelVersion : ?Text;
    modelProvider : ?Text;
    deploymentContext : Text;
    intendedPopulation : Text;
    jurisdiction : Text;
    status : AuditStatus;
    overallScore : ?Float;
    riskTier : ?RiskTier;
    verdict : ?Text;
    biasResults : ?Text;
    safetyResults : ?Text;
    regulatoryResults : ?Text;
    recommendations : ?Text;
    inputSummary : ?Text;
    outputCount : ?Nat;
    selectedBiasDimensions : [Text];
    selectedSafetyChecks : [Text];
    selectedFrameworks : [Text];
    summaryTone : Text;
    reportTitle : ?Text;
    createdAt : Int;
    completedAt : ?Int;
    createdBy : Text;
    inputText : ?Text;
    inputCsvUrl : ?Text;
  };

  public type AuditSummary = {
    id : AuditId;
    modelName : Text;
    modelVersion : ?Text;
    deploymentContext : Text;
    status : AuditStatus;
    overallScore : ?Float;
    riskTier : ?RiskTier;
    createdAt : Int;
    completedAt : ?Int;
  };

  public type AuditResults = {
    overallScore : ?Float;
    riskTier : ?RiskTier;
    verdict : ?Text;
    biasResults : ?Text;
    safetyResults : ?Text;
    regulatoryResults : ?Text;
    recommendations : ?Text;
    inputSummary : ?Text;
  };

  public type DashboardStats = {
    totalAudits : Nat;
    avgRiskScore : Float;
    openIssues : Nat;
    reportsGenerated : Nat;
  };

  public type ActivityEvent = {
    id : Text;
    timestamp : Int;
    eventType : Text;
    description : Text;
    auditId : ?Text;
  };

  public type ApiKeyRecord = {
    id : Text;
    name : Text;
    key : Text;
    createdAt : Int;
    lastUsed : ?Int;
  };
};
