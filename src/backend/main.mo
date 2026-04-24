import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Types "types/audit";
import AuditLib "lib/audit";
import AuditMixin "mixins/audit-api";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let audits = List.empty<Types.AuditRecord>();
  let activities = List.empty<Types.ActivityEvent>();
  let apiKeys = Map.empty<Principal, List.List<Types.ApiKeyRecord>>();
  let idCounter = { var count : Nat = 0 };

  include AuditMixin(accessControlState, audits, activities, apiKeys, idCounter);
};
