import type { Recommendation } from "./types.js";

export type FinOpsPersona =
  | "engineering"
  | "engineeringManager"
  | "finops"
  | "fpAndA"
  | "procurement"
  | "executive";

export type FinOpsSignalType =
  | "anomaly"
  | "budgetRisk"
  | "forecast"
  | "commitment"
  | "rightsizing"
  | "policy"
  | "other";

export interface FinOpsScope {
  scopeType: "managementGroup" | "subscription" | "resourceGroup" | "resource" | "billingProfile";
  scopeId: string;
}

export interface FinOpsSignal {
  signalId: string;
  signalType: FinOpsSignalType;
  scope: FinOpsScope;
  summary: string;
  evidenceRefs: string[];
  estimatedImpact?: {
    currency: string;
    amount: number;
    confidence: number;
  };
  risk: "low" | "medium" | "high" | "critical";
}

export interface CopilotRecommendationRequest {
  signalId: string;
  signalType: FinOpsSignalType;
  scope: FinOpsScope;
  persona: FinOpsPersona;
  context: string;
  evidenceRefs: string[];
  governance: {
    approvalRequired: true;
    allowAutomaticMutation: false;
  };
}

export interface CopilotRecommendationResponse {
  recommendationId: string;
  summary: string;
  proposedAction: string;
  risk: "low" | "medium" | "high" | "critical";
  estimatedImpact: {
    currency: string;
    amount: number;
    confidence: number;
  };
  approvalRequired: true;
  allowAutomaticMutation: false;
  evidenceRefs: string[];
  personaSummary?: string;
}

export interface CopilotAgentClient {
  generateRecommendation(request: CopilotRecommendationRequest): Promise<CopilotRecommendationResponse>;
}

function createRecommendationId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function fallbackEstimatedImpact(signal: FinOpsSignal): { currency: string; amount: number; confidence: number } {
  if (signal.estimatedImpact) {
    return signal.estimatedImpact;
  }

  return {
    currency: "USD",
    amount: 0,
    confidence: 0.3
  };
}

function personaSummary(persona: FinOpsPersona, signal: FinOpsSignal): string {
  switch (persona) {
    case "engineering":
      return `Service-level impact and owner actions for ${signal.scope.scopeType} ${signal.scope.scopeId}.`;
    case "engineeringManager":
      return `Team ownership and delivery risk summary for ${signal.scope.scopeType} ${signal.scope.scopeId}.`;
    case "finops":
      return `Cost driver, control action, and expected impact for ${signal.signalType}.`;
    case "fpAndA":
      return `Budget/forecast implication with auditable evidence references.`;
    case "procurement":
      return `Commercial decision support for commitments and spend controls.`;
    case "executive":
      return `High-level risk and required decision for leadership review.`;
    default:
      return "Persona summary unavailable.";
  }
}

/**
 * Reference implementation that behaves like a deterministic Azure Copilot adapter.
 * Replace with a real Azure Copilot client in production.
 */
export class DeterministicCopilotClient implements CopilotAgentClient {
  async generateRecommendation(request: CopilotRecommendationRequest): Promise<CopilotRecommendationResponse> {
    const impact = fallbackEstimatedImpact({
      signalId: request.signalId,
      signalType: request.signalType,
      scope: request.scope,
      summary: request.context,
      evidenceRefs: request.evidenceRefs,
      risk: "medium"
    });

    return {
      recommendationId: createRecommendationId(),
      summary: `Investigate ${request.signalType} in ${request.scope.scopeType} ${request.scope.scopeId} and route a human-approved action.`,
      proposedAction: "Create tracked action item, assign owner, and capture approval decision before execution.",
      risk: "medium",
      estimatedImpact: impact,
      approvalRequired: true,
      allowAutomaticMutation: false,
      evidenceRefs: request.evidenceRefs,
      personaSummary: personaSummary(request.persona, {
        signalId: request.signalId,
        signalType: request.signalType,
        scope: request.scope,
        summary: request.context,
        evidenceRefs: request.evidenceRefs,
        estimatedImpact: impact,
        risk: "medium"
      })
    };
  }
}

export function toRecommendation(response: CopilotRecommendationResponse): Recommendation {
  return {
    recommendationId: response.recommendationId,
    summary: response.summary,
    approvalRequired: true,
    risk: response.risk
  };
}
