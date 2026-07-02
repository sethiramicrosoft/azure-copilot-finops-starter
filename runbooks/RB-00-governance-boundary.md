# RB-00 Governance Boundary (Non-Negotiable)

## Policy

This starter is recommendation-first and human-governed.

The following are never automatic:

1. resizing/shutdowns
2. budget/policy edits
3. reservation/savings-plan purchases
4. infrastructure mutations

## Required approvals

For any consequential action, capture:

- approver identity
- explicit decision (`approve`/`reject`/`needsMoreEvidence`)
- timestamp
- rationale

## Enforcement points

1. Recommendation schema enforces `approvalRequired=true`
2. Approval plane stores decision artifact
3. Router blocks unauthorized writes
4. Ledger records all decisions and outcomes

## Audit expectation

No action is considered valid unless it is represented in the action ledger with traceable evidence.
