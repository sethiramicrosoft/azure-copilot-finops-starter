import type { LedgerEvent } from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class ActionLedger {
  private readonly events: LedgerEvent[] = [];

  append(actionId: string, eventType: LedgerEvent["eventType"], payload: Record<string, unknown>): LedgerEvent {
    const event: LedgerEvent = {
      eventId: createEventId(),
      occurredAt: nowIso(),
      eventType,
      actionId,
      payload
    };

    this.events.push(event);
    return event;
  }

  list(): LedgerEvent[] {
    return [...this.events];
  }

  listByAction(actionId: string): LedgerEvent[] {
    return this.events.filter((e) => e.actionId === actionId);
  }
}
