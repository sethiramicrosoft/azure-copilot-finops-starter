import { DeterministicCopilotClient } from "./copilot.js";
import { AzureCopilotFinOpsOrchestrator } from "./orchestrator.js";
import type { ApprovalArtifact, ActionItem } from "./types.js";
import { loadRuntimeConfigFromEnv } from "./runtimeConfig.js";
import { createRouterAdapter } from "./adapterFactory.js";
import { FileActionLedger } from "./fileLedger.js";

async function runDemo(): Promise<void> {
  const runtime = loadRuntimeConfigFromEnv();
  const copilot = new DeterministicCopilotClient();
  const adapter = createRouterAdapter(runtime);
  const ledger = new FileActionLedger(runtime.ledgerFilePath);
  const orchestrator = new AzureCopilotFinOpsOrchestrator(copilot, adapter, ledger);

  const signal = {
    signalId: "sig_anomaly_001",
    signalType: "anomaly" as const,
    scope: {
      scopeType: "subscription" as const,
      scopeId: "/subscriptions/00000000-0000-0000-0000-000000000000"
    },
    summary: "Compute spend increased 23% week-over-week for workload payments-api.",
    evidenceRefs: ["cost-query:sub-001:2026-07-01", "meter-breakdown:payments-api"],
    estimatedImpact: {
      currency: "USD",
      amount: 4200,
      confidence: 0.78
    },
    risk: "high" as const
  };

  const { action } = await orchestrator.draftActionFromSignal(signal, "finops");

  const approval: ApprovalArtifact = {
    approverId: "sethiramicrosoft",
    decision: "approve",
    rationale: "Proceed with owner triage and monitored remediation.",
    decidedAt: new Date().toISOString()
  };

  await orchestrator.approveAuthorizeAndStart(action, "owner:payments-team", approval);
  await orchestrator.closeActionWithOutcome(
    action as ActionItem,
    "Post-action spend stabilized within expected range over 3 days.",
    ["recheck:sub-001:2026-07-04"]
  );

  const events = orchestrator.ledger.listByAction(action.actionId);
  console.log(
    JSON.stringify(
      {
        trackerMode: runtime.trackerMode,
        ledgerFilePath: runtime.ledgerFilePath,
        actionId: action.actionId,
        eventCount: events.length,
        events
      },
      null,
      2
    )
  );
}

runDemo().catch((error: unknown) => {
  console.error(error);
  throw error;
});
