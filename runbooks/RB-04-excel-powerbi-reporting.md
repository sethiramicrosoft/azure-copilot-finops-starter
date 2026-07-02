# RB-04 Excel and Power BI Reporting for Copilot-First FinOps

## Purpose

Define how to produce detailed Excel and Power BI reports using Azure Cost Management datafiles and this starter's governance ledger.

## What Azure Copilot provides vs what reporting stack provides

- **Azure Copilot provides:** analysis narratives, ranked options, confidence/uncertainty framing.
- **Reporting stack provides:** durable tabular datasets and the tooling path to build workbook/dashboard files (Excel/Power BI) and recurring report generation.

## Data sources for reports

1. **Cost source**
   - Azure Cost Management Exports (CSV/Parquet/FOCUS) to Azure Storage.
2. **Governance source**
   - Action ledger output (`data/action-ledger.jsonl` or durable equivalent).
3. **Optional dimensions**
   - Tag mapping, org hierarchy, budget metadata, owner catalog.

## Report outputs to maintain

### Weekly operator pack (Excel)

Required tabs:

1. `Anomalies`
2. `Decisions`
3. `OwnerQueue`
4. `ExpectedVsRealized`
5. `Escalations`

### Monthly governance pack (Excel + Power BI)

Required sections:

1. Actual vs Forecast vs Budget
2. Top recurring drivers
3. Commitment options and downside risk
4. Decision quality metrics
5. Control effectiveness metrics

### Executive dashboard (Power BI)

Required pages:

1. Spend trend and forecast
2. Driver decomposition
3. Action lifecycle and closure
4. Realized impact
5. Escalation and risk status

## Build path A: Power BI direct connector (where supported)

1. In Power BI Desktop, use **Get Data -> Azure -> Azure Cost Management**.
2. Connect at required scope.
3. Build model and visuals.
4. Publish and set refresh policy.

Use this when agreement/scope support is confirmed in your tenant.

## Build path B: Export-based datafiles (recommended baseline)

1. Configure Cost Management Exports to Azure Storage.
2. Export required datasets (actual/amortized/usage/FOCUS as needed).
3. Load exported files into Excel Power Query or Power BI.
4. Load action ledger data as a second source.
5. Join cost and action/outcome views by shared dimensions (scope/date/workload/resource where available).
6. Publish weekly/monthly report artifacts.

## Join model guidance

At minimum, align on:

- date (day/week/month),
- scope identifier,
- workload/service grouping,
- owner mapping key.

Do not block reporting on perfect joins; publish with explicit confidence notes and known gaps.

## Copilot prompt set for report authoring

1. "Generate a weekly FinOps narrative from this table: top deltas, risks, decisions needed."
2. "Generate a monthly variance narrative: actual vs forecast vs budget with confidence notes."
3. "Summarize unresolved high-risk items and recommended escalation path."
4. "Draft executive summary with top 3 financial risks and required decisions."

## Quality checks before publishing reports

- Data freshness timestamp is visible.
- Scope and period are explicit.
- Confidence/uncertainty notes are included.
- Expected vs realized impact is separated.
- Escalations are clearly listed.
- Report references traceable evidence.

## Governance reminder

Reports are decision-support artifacts.  
No report output authorizes automatic budget/policy/infra/commitment mutation.
