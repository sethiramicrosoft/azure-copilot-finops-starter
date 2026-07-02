# Action Router Contract (Tool-Agnostic)

The router translates internal actions into external system operations.

## Supported external operations

1. Create/update action item
2. Assign/reassign owner
3. Post status comment
4. Change workflow state
5. Return external references for ledger persistence

## Adapter interface

Each adapter (ADO/Jira/GitHub/custom) implements:

- `upsertItem(action)`
- `assignOwner(action, owner)`
- `postComment(action, comment)`
- `changeState(action, state)`
- `getReference(action)`

## Required behavior

- idempotent writes where possible
- explicit error propagation (no silent fallback)
- external ID + URL returned for every successful write
- every mutation mirrored into action ledger

## Approval enforcement

Router must reject any operation requiring approval when:

- approval decision is missing, or
- approver identity is missing, or
- decision is not `approve`

## Minimum telemetry fields

- actionId
- externalSystem
- externalId
- operation
- actorId
- timestamp
- success/failure
- errorCode (if failed)
