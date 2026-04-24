import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Error "mo:core/Error";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/audit";
import AuditLib "../lib/audit";

mixin (
  accessControlState : AccessControl.AccessControlState,
  audits : AuditLib.AuditStore,
  activities : AuditLib.ActivityStore,
  apiKeys : Map.Map<Principal, List.List<Types.ApiKeyRecord>>,
  idCounter : { var count : Nat },
) {
  // ─── Seeding tracker ──────────────────────────────────────────────────────
  let seededCallers = List.empty<Text>();

  /// Seed sample data for a caller if they have no audits yet
  func seedIfEmpty(caller : Principal) {
    let callerText = caller.toText();
    let alreadySeeded = seededCallers.find(func(t : Text) : Bool { t == callerText }) != null;
    if (not alreadySeeded) {
      let callerAudits = AuditLib.listForCaller(audits, caller);
      if (callerAudits.size() == 0) {
        AuditLib.seedSampleAudits(audits, activities, caller, Time.now());
        seededCallers.add(callerText);
      };
    };
  };

  // ─── Public endpoints ─────────────────────────────────────────────────────

  /// Create a new audit record with status #pending
  public shared ({ caller }) func createAudit(input : Types.AuditInput) : async Types.AuditId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in to create an audit");
    };
    let now = Time.now();
    idCounter.count += 1;
    let id = AuditLib.generateId("audit", idCounter.count, now);
    let record = AuditLib.createAuditRecord(id, input, caller, now);
    audits.add(record);
    idCounter.count += 1;
    AuditLib.logActivity(
      activities,
      AuditLib.generateId("evt", idCounter.count, now),
      now,
      "audit_created",
      "Audit created for " # input.modelName,
      ?id,
    );
    id;
  };

  /// Get full audit by ID — only accessible by owner
  public query ({ caller }) func getAudit(id : Types.AuditId) : async ?Types.AuditRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (AuditLib.findAudit(audits, id)) {
      case (?record) {
        if (record.createdBy == caller.toText() or AccessControl.isAdmin(accessControlState, caller)) {
          ?record;
        } else {
          Runtime.trap("Unauthorized: Not your audit");
        };
      };
      case null { null };
    };
  };

  /// List audit summaries for calling principal (seeds sample data on first call)
  public shared ({ caller }) func listAudits() : async [Types.AuditSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    seedIfEmpty(caller);
    AuditLib.listForCaller(audits, caller);
  };

  /// Trigger AI analysis job via Claude http-outcalls; updates status #processing → #complete
  public shared ({ caller }) func runAudit(id : Types.AuditId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let record = switch (AuditLib.findAudit(audits, id)) {
      case (?r) { r };
      case null { Runtime.trap("Audit not found") };
    };
    if (record.createdBy != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Not your audit");
    };
    if (record.status == #processing) {
      Runtime.trap("Audit is already running");
    };

    let now = Time.now();
    idCounter.count += 1;

    // Mark processing
    audits.mapInPlace(func(r : Types.AuditRecord) : Types.AuditRecord {
      if (r.id == id) { AuditLib.markProcessing(r) } else { r };
    });
    AuditLib.logActivity(
      activities,
      AuditLib.generateId("evt", idCounter.count, now),
      now,
      "audit_started",
      "Audit analysis started for " # record.modelName,
      ?id,
    );

    let claudeUrl = "https://api.anthropic.com/v1/messages";
    let authHeader : OutCall.Header = { name = "x-api-key"; value = "ANTHROPIC_API_KEY" };
    let versionHeader : OutCall.Header = { name = "anthropic-version"; value = "2023-06-01" };
    let contentHeader : OutCall.Header = { name = "Content-Type"; value = "application/json" };
    let extraHeaders = [authHeader, versionHeader, contentHeader];

    let biasPrompt = AuditLib.buildBiasPrompt(record);
    let safetyPrompt = AuditLib.buildSafetyPrompt(record);
    let regulatoryPrompt = AuditLib.buildRegulatoryPrompt(record);

    // Run bias, safety, and regulatory calls
    let biasRaw = try {
      await OutCall.httpPostRequest(claudeUrl, extraHeaders, biasPrompt, transform);
    } catch (e) {
      markAuditFailed(id, record.modelName, "Bias analysis HTTP error: " # e.message());
      return;
    };

    let safetyRaw = try {
      await OutCall.httpPostRequest(claudeUrl, extraHeaders, safetyPrompt, transform);
    } catch (e) {
      markAuditFailed(id, record.modelName, "Safety analysis HTTP error: " # e.message());
      return;
    };

    let regulatoryRaw = try {
      await OutCall.httpPostRequest(claudeUrl, extraHeaders, regulatoryPrompt, transform);
    } catch (e) {
      markAuditFailed(id, record.modelName, "Regulatory analysis HTTP error: " # e.message());
      return;
    };

    let biasJson = extractClaudeContent(biasRaw);
    let safetyJson = extractClaudeContent(safetyRaw);
    let regulatoryJson = extractClaudeContent(regulatoryRaw);

    let summaryPrompt = AuditLib.buildSummaryPrompt(record, biasJson, safetyJson, regulatoryJson);
    let summaryRaw = try {
      await OutCall.httpPostRequest(claudeUrl, extraHeaders, summaryPrompt, transform);
    } catch (e) {
      markAuditFailed(id, record.modelName, "Summary generation HTTP error: " # e.message());
      return;
    };

    let summaryJson = extractClaudeContent(summaryRaw);
    let results = AuditLib.parseClaudeResponses(biasJson, safetyJson, regulatoryJson, summaryJson);
    let completedAt = Time.now();

    audits.mapInPlace(func(r : Types.AuditRecord) : Types.AuditRecord {
      if (r.id == id) { AuditLib.applyResults(r, results, completedAt) } else { r };
    });

    idCounter.count += 1;
    let riskLabel = switch (results.riskTier) {
      case (?(#low)) { "LOW" };
      case (?(#medium)) { "MEDIUM" };
      case (?(#high)) { "HIGH" };
      case (?(#critical)) { "CRITICAL" };
      case null { "UNKNOWN" };
    };
    AuditLib.logActivity(
      activities,
      AuditLib.generateId("evt", idCounter.count, completedAt),
      completedAt,
      "audit_complete",
      "Audit completed for " # record.modelName # " - Risk: " # riskLabel,
      ?id,
    );
  };

  /// Store AI analysis results for an audit (owner only)
  public shared ({ caller }) func updateAuditResults(
    id : Types.AuditId,
    results : Types.AuditResults,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let record = switch (AuditLib.findAudit(audits, id)) {
      case (?r) { r };
      case null { Runtime.trap("Audit not found") };
    };
    if (record.createdBy != caller.toText() and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Not your audit");
    };
    let completedAt = Time.now();
    audits.mapInPlace(func(r : Types.AuditRecord) : Types.AuditRecord {
      if (r.id == id) { AuditLib.applyResults(r, results, completedAt) } else { r };
    });
  };

  /// Return dashboard statistics for calling principal
  public shared ({ caller }) func getDashboardStats() : async Types.DashboardStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    seedIfEmpty(caller);
    AuditLib.computeDashboardStats(audits, caller);
  };

  /// Return recent activity feed for calling principal
  public query ({ caller }) func listActivityFeed() : async [Types.ActivityEvent] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    AuditLib.listActivity(activities, caller);
  };

  /// Generate a new API key for CI/CD integration
  public shared ({ caller }) func generateApiKey() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let now = Time.now();
    idCounter.count += 1;
    let id = AuditLib.generateId("key", idCounter.count, now);
    let keyStr = AuditLib.generateApiKeyString(idCounter.count, now);
    let keyRecord = AuditLib.createApiKey(id, "API Key " # idCounter.count.toText(), keyStr, now);
    switch (apiKeys.get(caller)) {
      case (?existing) { existing.add(keyRecord) };
      case null {
        let newList = List.empty<Types.ApiKeyRecord>();
        newList.add(keyRecord);
        apiKeys.add(caller, newList);
      };
    };
    keyStr;
  };

  /// List all API keys for calling principal
  public query ({ caller }) func listApiKeys() : async [Types.ApiKeyRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    AuditLib.listApiKeysForCaller(apiKeys, caller);
  };

  /// Required transform callback for http-outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ─── Private helpers ───────────────────────────────────────────────────────

  func markAuditFailed(id : Types.AuditId, modelName : Text, errorMsg : Text) {
    audits.mapInPlace(func(r : Types.AuditRecord) : Types.AuditRecord {
      if (r.id == id) {
        { AuditLib.markFailed(r) with verdict = ?("Analysis failed: " # errorMsg) };
      } else { r };
    });
    idCounter.count += 1;
    let now = Time.now();
    AuditLib.logActivity(
      activities,
      AuditLib.generateId("evt", idCounter.count, now),
      now,
      "audit_failed",
      "Audit failed for " # modelName # ": " # errorMsg,
      ?id,
    );
  };

  /// Extract the text content from Claude's API response JSON wrapper.
  /// Claude returns: {"content":[{"type":"text","text":"..."}],...}
  func extractClaudeContent(raw : Text) : Text {
    let marker = "\"text\":\"";
    let parts = raw.split(#text marker).toArray();
    if (parts.size() < 2) return raw;
    let afterMarker = parts[1];
    var result = "";
    var escape = false;
    for (c in afterMarker.toIter()) {
      if (escape) {
        if (c == 'n') { result #= "\n" }
        else if (c == 't') { result #= "\t" }
        else if (c == '\"') { result #= "\"" }
        else if (c == '\\') { result #= "\\" }
        else { result #= Text.fromChar(c) };
        escape := false;
      } else if (c == '\\') {
        escape := true;
      } else if (c == '\"') {
        return result;
      } else {
        result #= Text.fromChar(c);
      };
    };
    result;
  };
};
