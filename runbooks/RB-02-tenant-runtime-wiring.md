# RB-02 Tenant Runtime Wiring

## Objective

Wire this solution to a real tenant runtime without committing tenant-specific information to source control.

## Required practice

1. Keep tenant/subscription IDs and secrets out of repository files.
2. Use local environment variables and/or Key Vault-backed injection.
3. Keep `.env` files untracked.

## Steps

### 1. Authenticate and select subscription

```powershell
az login
az account set --subscription <subscription-id>
az account show --output table
```

### 2. Prepare local runtime configuration

Copy `.env.example` to `.env` locally and fill placeholders.

Do **not** commit `.env`.

### 3. Export secrets locally (examples)

```powershell
$env:GITHUB_TOKEN = "<token>"
$env:AZDO_PAT = "<pat>"
$env:JIRA_API_TOKEN = "<token>"
```

### 4. Run with desired adapter mode

```powershell
$env:TRACKER_MODE = "memory"  # or github/jira/ado
npm run demo
```

### 5. Verify durable ledger output

Check the JSONL ledger file at `LEDGER_FILE_PATH` (default `data/action-ledger.jsonl`).

## Key Vault integration pattern

- Store secrets in Key Vault.
- Inject into process environment at startup (pipeline/host runtime).
- Keep secret names in config; keep secret values in Key Vault only.

## Governance reminder

No mode in this runbook enables automatic infrastructure or cost mutation.  
All consequential actions remain recommendation + explicit human approval/authorization.
