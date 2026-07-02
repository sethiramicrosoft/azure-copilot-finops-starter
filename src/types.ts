export type ActionState =
  | "new"
  | "triaged"
  | "approved"
  | "authorized"
  | "inProgress"
  | "resolved"
  | "dismissed"
  | "closed"
  | "needsMoreEvidence";

export type Decision = "approve" | "reject" | "needsMoreEvidence";

export interface ApprovalArtifact {
  approverId: string;
  decision: Decision;
  rationale: string;
  decidedAt: string;
}

export interface Recommendation {
  recommendationId: string;
  summary: string;
  approvalRequired: true;
  risk: "low" | "medium" | "high" | "critical";
}

export interface RouterReference {
  system: "ado" | "jira" | "github" | "servicenow" | "custom";
  externalId: string;
  url?: string;
}

export interface ActionItem {
  actionId: string;
  recommendationId: string;
  summary: string;
  state: ActionState;
  ownerId?: string;
  approval?: ApprovalArtifact;
  reference?: RouterReference;
}

export interface LedgerEvent {
  eventId: string;
  occurredAt: string;
  eventType:
    | "itemCreated"
    | "itemUpdated"
    | "ownerAssigned"
    | "ownerReassigned"
    | "commentPosted"
    | "stateChanged"
    | "decisionRecorded"
    | "outcomeRecorded";
  actionId: string;
  payload: Record<string, unknown>;
}

export interface RouterAdapter {
  upsertItem(action: ActionItem): Promise<RouterReference>;
  assignOwner(action: ActionItem, ownerId: string): Promise<void>;
  postComment(action: ActionItem, comment: string): Promise<void>;
  changeState(action: ActionItem, state: ActionState): Promise<void>;
  getReference(action: ActionItem): Promise<RouterReference>;
}
