# Azure FinOps Starter

A production-oriented starter for teams that want a **human-governed FinOps operating loop** on Azure.

It helps teams move from manual spreadsheets and ad-hoc reviews to a repeatable workflow:

1. detect cost signals,
2. generate evidence-backed recommendations,
3. require explicit human decisions,
4. route approved work into existing trackers,
5. re-check and record outcomes.

## Who this is for

- **FinOps leads** who need faster triage and stronger governance
- **Engineering managers and service owners** who need clear ownership and action tracking
- **FP&A / finance teams** who need auditable decision trails and outcome evidence
- **Procurement/commercial teams** who need recommendation pipelines (not auto-execution)

## What this starter includes

- JSON contracts for recommendations and action-ledger events
- Tool-agnostic action router contract (ADO/Jira/GitHub/custom)
- Human-governed workflow core (state machine + approval enforcement)
- Append-only action ledger for auditability
- Architecture and governance runbooks

## Non-negotiable governance boundary

This project is recommendation-first and human-governed.

The following are **never automatic**:

- resizing/shutdowns
- budget or policy edits
- reservation/savings-plan purchases
- infrastructure mutations

Any consequential action requires explicit human approval/authorization.

## Universal action contract

The workflow is centered on five action types:

1. Create/update action item
2. Assign/reassign owner
3. Post status comments
4. Change workflow state
5. Persist decisions/outcomes in action ledger

## Quick start

```bash
npm install
npm run build
```

## Repo map

```text
contracts/      JSON schemas
connectors/     Tool-agnostic adapter contract
src/            TypeScript workflow core
specs/          Architecture and flow definitions
runbooks/       Governance and operational policy
```

## Architecture

See `specs/v1-architecture.md` for component flow and diagram.

## Current status

The repository currently provides the governance-first core and contracts.

Next implementation layers:

1. adapters for ADO/Jira/GitHub/custom webhook
2. approval API and persistence backend
3. ingest/analytics modules for cost, anomaly, and forecast pipelines
4. role-specific prompt/report packs
