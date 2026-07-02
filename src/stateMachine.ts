import type { ActionState, Decision } from "./types.js";

const allowedTransitions: Record<ActionState, ActionState[]> = {
  new: ["triaged", "dismissed"],
  triaged: ["approved", "needsMoreEvidence", "dismissed"],
  approved: ["authorized", "inProgress", "dismissed"],
  authorized: ["inProgress", "dismissed"],
  inProgress: ["resolved", "dismissed"],
  resolved: ["closed", "inProgress"],
  dismissed: [],
  closed: [],
  needsMoreEvidence: ["triaged", "dismissed"]
};

export function assertTransitionAllowed(from: ActionState, to: ActionState): void {
  const next = allowedTransitions[from];
  if (!next.includes(to)) {
    throw new Error(`Invalid state transition: ${from} -> ${to}`);
  }
}

export function decisionToNextState(current: ActionState, decision: Decision): ActionState {
  if (current !== "triaged") {
    throw new Error(`Decision can only be applied from triaged state. Current state: ${current}`);
  }

  if (decision === "approve") {
    return "approved";
  }

  if (decision === "reject") {
    return "dismissed";
  }

  return "needsMoreEvidence";
}
