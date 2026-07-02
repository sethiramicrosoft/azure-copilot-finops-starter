import { assertTransitionAllowed, decisionToNextState } from "./stateMachine.js";
import type { ActionItem, ActionState, ApprovalArtifact, Recommendation, RouterAdapter } from "./types.js";
import type { LedgerStore } from "./ledger.js";

function nowIso(): string {
  return new Date().toISOString();
}

function assertApprovalIsValid(approval: ApprovalArtifact | undefined): asserts approval is ApprovalArtifact {
  if (!approval) {
    throw new Error("Approval artifact is required.");
  }

  if (!approval.approverId || !approval.rationale || !approval.decidedAt) {
    throw new Error("Approval artifact is missing required fields.");
  }
}

export class HumanGovernedActionService {
  constructor(
    private readonly adapter: RouterAdapter,
    private readonly ledger: LedgerStore
  ) {}

  async createActionFromRecommendation(recommendation: Recommendation): Promise<ActionItem> {
    if (recommendation.approvalRequired !== true) {
      throw new Error("Non-human-governed recommendations are not supported.");
    }

    const action: ActionItem = {
      actionId: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      recommendationId: recommendation.recommendationId,
      summary: recommendation.summary,
      state: "new"
    };

    const ref = await this.adapter.upsertItem(action);
    action.reference = ref;

    this.ledger.append(action.actionId, "itemCreated", {
      recommendationId: recommendation.recommendationId,
      summary: recommendation.summary,
      reference: ref,
      createdAt: nowIso()
    });

    return action;
  }

  async assignOwner(action: ActionItem, ownerId: string): Promise<void> {
    if (!ownerId) {
      throw new Error("ownerId is required.");
    }

    const eventType = action.ownerId ? "ownerReassigned" : "ownerAssigned";
    await this.adapter.assignOwner(action, ownerId);
    action.ownerId = ownerId;

    this.ledger.append(action.actionId, eventType, {
      ownerId,
      reference: action.reference
    });
  }

  recordDecision(action: ActionItem, approval: ApprovalArtifact): ActionState {
    assertApprovalIsValid(approval);
    const nextState = decisionToNextState(action.state, approval.decision);
    assertTransitionAllowed(action.state, nextState);

    action.approval = approval;
    action.state = nextState;

    this.ledger.append(action.actionId, "decisionRecorded", {
      approval,
      newState: nextState
    });

    return nextState;
  }

  async changeState(action: ActionItem, nextState: ActionState): Promise<void> {
    assertTransitionAllowed(action.state, nextState);

    const requiresApproval =
      nextState === "authorized" ||
      nextState === "inProgress";

    if (requiresApproval) {
      assertApprovalIsValid(action.approval);
      if (action.approval.decision !== "approve") {
        throw new Error(`Cannot move to ${nextState} without explicit approve decision.`);
      }
    }

    await this.adapter.changeState(action, nextState);
    const previousState = action.state;
    action.state = nextState;

    this.ledger.append(action.actionId, "stateChanged", {
      from: previousState,
      to: nextState,
      reference: action.reference
    });
  }

  async postComment(action: ActionItem, comment: string): Promise<void> {
    if (!comment) {
      throw new Error("comment is required.");
    }

    await this.adapter.postComment(action, comment);
    this.ledger.append(action.actionId, "commentPosted", {
      comment,
      reference: action.reference
    });
  }

  recordOutcome(action: ActionItem, outcomeSummary: string, evidenceRefs: string[] = []): void {
    if (!outcomeSummary) {
      throw new Error("outcomeSummary is required.");
    }

    this.ledger.append(action.actionId, "outcomeRecorded", {
      outcomeSummary,
      evidenceRefs
    });
  }
}
