# RB-01 Azure Copilot Agents Integration

## Purpose

Define how Azure Copilot agent capability is used in this solution without violating governance boundaries.

## Agent responsibilities

1. Convert FinOps signals into recommendation drafts.
2. Produce persona-specific summaries for engineering, EM, FinOps, FP&A, procurement, and executive audiences.
3. Attach evidence references to recommendations.
4. Route only approved actions through external tooling adapters.

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

## Audit requirements

For every recommendation and routed action, ledger records must capture:

- source signal ID
- persona
- recommendation ID
- evidence references
- decision artifact
- state transitions
- outcome summary
