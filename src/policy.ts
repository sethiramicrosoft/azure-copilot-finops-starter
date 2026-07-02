import type { CopilotRecommendationResponse } from "./copilot.js";

const prohibitedPatterns = [
  /\bshutdown\b/i,
  /\bresize\b/i,
  /\bscale\s+down\b/i,
  /\bbudget\s+edit\b/i,
  /\bpolicy\s+edit\b/i,
  /\breservation\s+purchase\b/i,
  /\bsavings\s*plan\s+purchase\b/i,
  /\bdelete\b/i
];

/**
 * Enforces hard governance boundaries:
 * - no automatic mutations
 * - no mutation-shaped recommendation text crossing the wire as executable intent
 */
export function assertGovernancePolicy(response: CopilotRecommendationResponse): void {
  if (response.approvalRequired !== true) {
    throw new Error("Policy violation: approvalRequired must always be true.");
  }

  if (response.allowAutomaticMutation !== false) {
    throw new Error("Policy violation: automatic mutation must always be false.");
  }

  const actionText = response.proposedAction ?? "";
  if (prohibitedPatterns.some((pattern) => pattern.test(actionText))) {
    throw new Error(
      "Policy violation: proposedAction contains prohibited mutation intent. Keep recommendation advisory-only."
    );
  }
}
