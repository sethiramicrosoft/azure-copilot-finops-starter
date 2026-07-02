# Azure Copilot FinOps Starter

Forkable starter for a **human-approved** FinOps operating loop using Azure Cost Management + Azure Copilot + agents.

## Non-negotiable safety boundary

This project is recommendation-first and human-governed:

- Never auto-execute resizing/shutdowns
- Never auto-edit budgets or policies
- Never auto-purchase reservations/savings plans
- Never mutate infrastructure automatically

All such actions remain recommendations requiring explicit human approval/authorization.

## What this starter does

1. Pulls and normalizes cost data
2. Detects anomalies and budget risk
3. Generates role-specific summaries
4. Creates action recommendations
5. Routes actions to customer tooling (ADO/Jira/GitHub/other)
6. Tracks decisions and outcomes in an audit ledger
7. Re-checks impact after action completion

## Universal action contract

The workflow is tool-agnostic and centered on five action types:

1. Create/update action item
2. Assign/reassign owner
3. Post status comments
4. Change workflow state
5. Persist decisions/outcomes in action ledger

## Repository structure

```text
contracts/                   JSON schemas for recommendations and action ledger
specs/                       Product and architecture specs
connectors/                  Tracker connector interfaces and adapters
runbooks/                    Operational and governance runbooks
```

## Next build steps

1. Define stable schemas for recommendation + action ledger
2. Add connector interface (ADO/Jira/GitHub + generic webhook)
3. Add approval workflow state machine
4. Add sample prompt packs per persona
5. Add reference implementation modules
