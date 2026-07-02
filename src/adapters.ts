import type { ActionItem, ActionState, RouterAdapter, RouterReference } from "./types.js";

interface StoredActionRecord {
  action: ActionItem;
  comments: string[];
}

class InMemoryRouterAdapter implements RouterAdapter {
  private readonly records = new Map<string, StoredActionRecord>();

  constructor(private readonly system: RouterReference["system"]) {}

  async upsertItem(action: ActionItem): Promise<RouterReference> {
    const existing = this.records.get(action.actionId);
    if (existing) {
      existing.action = { ...action };
    } else {
      this.records.set(action.actionId, {
        action: { ...action },
        comments: []
      });
    }

    return this.getReference(action);
  }

  async assignOwner(action: ActionItem, ownerId: string): Promise<void> {
    const record = this.requireRecord(action.actionId);
    record.action.ownerId = ownerId;
  }

  async postComment(action: ActionItem, comment: string): Promise<void> {
    const record = this.requireRecord(action.actionId);
    record.comments.push(comment);
  }

  async changeState(action: ActionItem, state: ActionState): Promise<void> {
    const record = this.requireRecord(action.actionId);
    record.action.state = state;
  }

  async getReference(action: ActionItem): Promise<RouterReference> {
    return {
      system: this.system,
      externalId: `${this.system}-${action.actionId}`,
      url: `https://example.local/${this.system}/items/${action.actionId}`
    };
  }

  getSnapshot(actionId: string): StoredActionRecord | undefined {
    const record = this.records.get(actionId);
    if (!record) {
      return undefined;
    }

    return {
      action: { ...record.action },
      comments: [...record.comments]
    };
  }

  private requireRecord(actionId: string): StoredActionRecord {
    const record = this.records.get(actionId);
    if (!record) {
      throw new Error(`No action record found for ${actionId}. Call upsertItem first.`);
    }

    return record;
  }
}

export class AdoAdapter extends InMemoryRouterAdapter {
  constructor() {
    super("ado");
  }
}

export class JiraAdapter extends InMemoryRouterAdapter {
  constructor() {
    super("jira");
  }
}

export class GitHubIssuesAdapter extends InMemoryRouterAdapter {
  constructor() {
    super("github");
  }
}

export class ServiceNowAdapter extends InMemoryRouterAdapter {
  constructor() {
    super("servicenow");
  }
}

export class CustomAdapter extends InMemoryRouterAdapter {
  constructor() {
    super("custom");
  }
}
