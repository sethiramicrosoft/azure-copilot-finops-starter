import { mkdirSync, existsSync, readFileSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import type { LedgerEvent } from "./types.js";
import type { LedgerStore } from "./ledger.js";

function nowIso(): string {
  return new Date().toISOString();
}

function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Durable append-only ledger persisted as JSONL.
 * Each line is one LedgerEvent.
 */
export class FileActionLedger implements LedgerStore {
  constructor(private readonly filePath: string) {
    const parent = dirname(this.filePath);
    if (!existsSync(parent)) {
      mkdirSync(parent, { recursive: true });
    }
    if (!existsSync(this.filePath)) {
      appendFileSync(this.filePath, "", "utf8");
    }
  }

  append(actionId: string, eventType: LedgerEvent["eventType"], payload: Record<string, unknown>): LedgerEvent {
    const event: LedgerEvent = {
      eventId: createEventId(),
      occurredAt: nowIso(),
      eventType,
      actionId,
      payload
    };

    appendFileSync(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
    return event;
  }

  list(): LedgerEvent[] {
    return this.readEvents();
  }

  listByAction(actionId: string): LedgerEvent[] {
    return this.readEvents().filter((e) => e.actionId === actionId);
  }

  private readEvents(): LedgerEvent[] {
    const raw = readFileSync(this.filePath, "utf8");
    if (!raw.trim()) {
      return [];
    }

    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.map((line) => JSON.parse(line) as LedgerEvent);
  }
}
