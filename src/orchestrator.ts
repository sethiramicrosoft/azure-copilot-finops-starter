import type { ActionItem, ApprovalArtifact } from "./types.js";
import { ActionLedger, type LedgerStore } from "./ledger.js";
import { HumanGovernedActionService } from "./actionRouter.js";
import type {
  CopilotAgentClient,
  CopilotRecommendationRequest,
  FinOpsPersona,
  FinOpsSignal
} from "./copilot.js";
import { toRecommendation } from "./copilot.js";
import { assertGovernancePolicy } from "./policy.js";
import type { RouterAdapter } from "./types.js";

export class AzureCopilotFinOpsOrchestrator {
  readonly ledger: LedgerStore;
  readonly actionService: HumanGovernedActionService;

  constructor(
    private readonly copilotClient: CopilotAgentClient,
    adapter: RouterAdapter,
    ledger?: LedgerStore
  ) {
    this.ledger = ledger ?? new ActionLedger();
    this.actionService = new HumanGovernedActionService(adapter, this.ledger);
  }

  async draftActionFromSignal(
    signal: FinOpsSignal,
    persona: FinOpsPersona
  ): Promise<{
    action: ActionItem;
    copilotRequest: CopilotRecommendationRequest;
  }> {
    const copilotRequest: CopilotRecommendationRequest = {
      signalId: signal.signalId,
      signalType: signal.signalType,
      scope: signal.scope,
      persona,
      context: signal.summary,
      evidenceRefs: signal.evidenceRefs,
      governance: {
        approvalRequired: true,
        allowAutomaticMutation: false
      }
    };

    const recommendationResponse = await this.copilotClient.generateRecommendation(copilotRequest);
    assertGovernancePolicy(recommendationResponse);
    const recommendation = toRecommendation(recommendationResponse);
    const action = await this.actionService.createActionFromRecommendation(recommendation);

    await this.actionService.postComment(
      action,
      `Persona summary: ${recommendationResponse.personaSummary ?? "not provided"}`
    );
    await this.actionService.postComment(
      action,
      `Proposed action: ${recommendationResponse.proposedAction}`
    );

    this.ledger.append(action.actionId, "itemUpdated", {
      source: "azure-copilot",
      signalId: signal.signalId,
      persona,
      recommendationId: recommendationResponse.recommendationId,
      evidenceRefs: recommendationResponse.evidenceRefs,
      allowAutomaticMutation: recommendationResponse.allowAutomaticMutation
    });

    return { action, copilotRequest };
  }

  async approveAuthorizeAndStart(
    action: ActionItem,
    ownerId: string,
    approval: ApprovalArtifact
  ): Promise<void> {
    if (action.state === "new") {
      await this.actionService.changeState(action, "triaged");
    }

    this.actionService.recordDecision(action, approval);
    await this.actionService.assignOwner(action, ownerId);
    await this.actionService.changeState(action, "authorized");
    await this.actionService.changeState(action, "inProgress");
  }

  async rejectAction(action: ActionItem, approval: ApprovalArtifact): Promise<void> {
    if (action.state === "new") {
      await this.actionService.changeState(action, "triaged");
    }

    this.actionService.recordDecision(action, approval);
    await this.actionService.changeState(action, "dismissed");
  }

  async closeActionWithOutcome(
    action: ActionItem,
    outcomeSummary: string,
    evidenceRefs: string[]
  ): Promise<void> {
    await this.actionService.changeState(action, "resolved");
    this.actionService.recordOutcome(action, outcomeSummary, evidenceRefs);
    await this.actionService.changeState(action, "closed");
  }
}
