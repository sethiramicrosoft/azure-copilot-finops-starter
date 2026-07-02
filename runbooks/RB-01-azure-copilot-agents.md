# RB-01 Azure Copilot Agents Integration

## Purpose

Define how Azure Copilot agent capability is used in this solution without violating governance boundaries.

## Operating stance

- Azure Copilot Agent is the primary intelligence interface for Cost Management interpretation and recommendation drafting.
- The orchestration layer is the runtime authority for policy enforcement, approval gating, routing, and audit.
- Advisory output and actuating operations are intentionally separated.

## Reality boundary

- Default integration mode is human-in-the-loop usage of Azure Copilot outputs.
- This runbook does not assume a public Azure Copilot API endpoint is generally available.
- If an organization has a supported endpoint in its tenant, it can be wired through the adapter layer.

## Agent responsibilities

1. Convert FinOps signals into recommendation drafts.
2. Produce persona-specific summaries for engineering, EM, FinOps, FP&A, procurement, and executive audiences.
3. Attach evidence references to recommendations.
4. Hand off approved actions to governed router adapters.

## Advisory vs actuating boundary

- **Advisory:** explain, summarize, prioritize, and recommend.
- **Actuating:** mutate systems, spend commitments, policy/budget changes, or infra changes.

Only the advisory side is delegated to Azure Copilot Agent.  
Actuating steps require explicit human decision artifacts and controlled router execution.

## Non-responsibilities

Azure Copilot agents must not autonomously:

- resize or shut down resources
- edit budgets or policies
- purchase reservations/savings plans
- mutate infrastructure

## Required request contract

Every request to the recommendation layer must include:

- signal type and scope
- persona
- context summary
- evidence references
- governance flags:
  - `approvalRequired=true`
  - `allowAutomaticMutation=false`

## Required response contract

Every response must include:

- recommendation ID
- summary
- proposed action
- risk
- estimated impact
- evidence references
- `approvalRequired=true`
- `allowAutomaticMutation=false`

## Approval gating

No action may move to `authorized` or `inProgress` unless:

1. decision is explicitly `approve`,
2. approver identity exists,
3. rationale and timestamp exist.

## Consequential action definition

Consequential actions include:

- resource resize/shutdown
- budget/policy edits
- reservation/savings-plan purchases
- infrastructure mutation

These are never auto-executed by the recommendation layer.

## Audit requirements

For every recommendation and routed action, ledger records must capture:

- source signal ID
- persona
- recommendation ID
- evidence references
- decision artifact
- state transitions
- outcome summary
