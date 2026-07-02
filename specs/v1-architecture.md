# V1 Architecture — Azure Copilot FinOps Starter

## Goal

Deliver a high-capability FinOps loop with strict human governance:

- Broad recommendations across cost, anomaly, budget, forecast, and commitment opportunities
- Zero autonomous infrastructure/cost mutation
- Explicit human approval/authorization for all consequential actions

## Core principles

1. Recommendation-first, human-authorized execution
2. Tool-agnostic workflow (ADO/Jira/GitHub/custom)
3. Deterministic evidence + auditable AI narrative
4. Full decision/outcome ledger
5. Re-check loop to measure impact

## V1 system components

1. **Cost Data Ingestor**
   - Pulls Cost Management and related metadata
   - Normalizes scope, service, and owner dimensions

2. **Analytics Engine**
   - Anomaly detection
   - Budget risk checks
   - Forecast and what-if simulation wrappers

3. **Recommendation Engine**
   - Emits `FinOpsRecommendation` documents
   - Includes evidence references and impact estimate
   - Always sets `approvalRequired = true`

4. **Approval Plane**
   - Human approve/reject/needsMoreEvidence
   - Captures rationale and approver identity

5. **Action Router**
   - Creates/updates work items in customer tooling
   - Assigns/reassigns owners
   - Posts status comments
   - Transitions workflow states

6. **Action Ledger**
   - Append-only event stream (`ActionLedgerEvent`)
   - Durable audit trail for recommendation -> decision -> outcome

7. **Impact Re-checker**
   - Re-evaluates cost behavior after action resolution
   - Records outcome evidence

## Architecture diagram

```mermaid
flowchart LR
    A[Azure Cost Management + Metadata] --> B[Cost Data Ingestor]
    B --> C[Analytics Engine\nAnomaly + Budget Risk + Forecast + What-if]
    C --> D[Recommendation Engine\nFinOpsRecommendation approvalRequired=true]

    D --> E[Approval Plane\nHuman approve/reject/needsMoreEvidence]
    E --> F[Action Router\nADO/Jira/GitHub/Custom]
    F --> G[External Work Item System]

    D --> H[Action Ledger\nAppend-only audit events]
    E --> H
    F --> H

    G --> I[Impact Re-checker]
    I --> C
    I --> H

    J[Governance Boundary\nNo automatic infra/cost mutation] -.enforced at.-> D
    J -.enforced at.-> E
    J -.enforced at.-> F
```

## State model

`new -> triaged -> approved/authorized -> inProgress -> resolved -> closed`

Alternative paths:

- `new -> dismissed`
- `triaged -> needsMoreEvidence -> triaged`

## Non-goals (hard boundary)

V1 does not auto-execute:

- resource resizing/shutdowns
- budget/policy edits
- reservation/savings-plan purchases
- any infrastructure mutation

## Success metrics

1. Time-to-insight reduction
2. Recommendation acceptance rate
3. Action closure rate
4. Measured post-action impact coverage
5. Audit completeness (100% action events logged)
