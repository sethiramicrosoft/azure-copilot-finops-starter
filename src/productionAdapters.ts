import type { ActionItem, ActionState, RouterAdapter, RouterReference } from "./types.js";

function toBasicAuth(username: string, secret: string): string {
  return `Basic ${Buffer.from(`${username}:${secret}`).toString("base64")}`;
}

function assertReference(action: ActionItem): RouterReference {
  if (!action.reference) {
    throw new Error("Action has no external reference. Call upsertItem first.");
  }
  return action.reference;
}

type TransitionMap = Partial<Record<ActionState, string>>;

/**
 * GitHub Issues adapter (real API calls).
 * Requires: owner, repo, token.
 */
export class GitHubIssuesApiAdapter implements RouterAdapter {
  constructor(
    private readonly owner: string,
    private readonly repo: string,
    private readonly token: string
  ) {}

  async upsertItem(action: ActionItem): Promise<RouterReference> {
    if (action.reference?.externalId) {
      await this.patchIssue(Number(action.reference.externalId), {
        title: action.summary
      });
      return action.reference;
    }

    const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        title: action.summary,
        body: `FinOps Action ID: ${action.actionId}\nRecommendation: ${action.recommendationId}`
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub create issue failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { number: number; html_url: string };
    return {
      system: "github",
      externalId: String(data.number),
      url: data.html_url
    };
  }

  async assignOwner(action: ActionItem, ownerId: string): Promise<void> {
    const ref = assertReference(action);
    const issueNumber = Number(ref.externalId);
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}/assignees`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ assignees: [ownerId] })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub assign owner failed: ${response.status} ${await response.text()}`);
    }
  }

  async postComment(action: ActionItem, comment: string): Promise<void> {
    const ref = assertReference(action);
    const issueNumber = Number(ref.externalId);
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ body: comment })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub post comment failed: ${response.status} ${await response.text()}`);
    }
  }

  async changeState(action: ActionItem, state: ActionState): Promise<void> {
    const ref = assertReference(action);
    const issueNumber = Number(ref.externalId);

    const issueState = state === "closed" || state === "dismissed" ? "closed" : "open";
    const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({
        state: issueState,
        labels: [`finops-state:${state}`]
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub change state failed: ${response.status} ${await response.text()}`);
    }
  }

  async getReference(action: ActionItem): Promise<RouterReference> {
    const ref = assertReference(action);
    return ref;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${this.token}`
    };
  }

  private async patchIssue(issueNumber: number, payload: Record<string, unknown>): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GitHub update issue failed: ${response.status} ${await response.text()}`);
    }
  }
}

/**
 * Jira adapter (real API calls).
 * Requires baseUrl, userEmail, apiToken, projectKey, transition map for state changes.
 */
export class JiraApiAdapter implements RouterAdapter {
  constructor(
    private readonly baseUrl: string,
    private readonly userEmail: string,
    private readonly apiToken: string,
    private readonly projectKey: string,
    private readonly transitionMap: TransitionMap = {}
  ) {}

  async upsertItem(action: ActionItem): Promise<RouterReference> {
    if (action.reference?.externalId) {
      await this.updateIssueSummary(action.reference.externalId, action.summary);
      return action.reference;
    }

    const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        fields: {
          project: { key: this.projectKey },
          summary: action.summary,
          issuetype: { name: "Task" },
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: `FinOps Action ID: ${action.actionId}` }]
              }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Jira create issue failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { key: string };
    return {
      system: "jira",
      externalId: data.key,
      url: `${this.baseUrl}/browse/${data.key}`
    };
  }

  async assignOwner(action: ActionItem, ownerId: string): Promise<void> {
    const ref = assertReference(action);
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${ref.externalId}/assignee`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ accountId: ownerId })
    });

    if (!response.ok) {
      throw new Error(`Jira assign owner failed: ${response.status} ${await response.text()}`);
    }
  }

  async postComment(action: ActionItem, comment: string): Promise<void> {
    const ref = assertReference(action);
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${ref.externalId}/comment`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: comment }]
            }
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Jira post comment failed: ${response.status} ${await response.text()}`);
    }
  }

  async changeState(action: ActionItem, state: ActionState): Promise<void> {
    const ref = assertReference(action);
    const transitionId = this.transitionMap[state];
    if (!transitionId) {
      throw new Error(`Jira transition map missing for state: ${state}`);
    }

    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${ref.externalId}/transitions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        transition: { id: transitionId }
      })
    });

    if (!response.ok) {
      throw new Error(`Jira change state failed: ${response.status} ${await response.text()}`);
    }
  }

  async getReference(action: ActionItem): Promise<RouterReference> {
    return assertReference(action);
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": toBasicAuth(this.userEmail, this.apiToken),
      "Accept": "application/json"
    };
  }

  private async updateIssueSummary(issueKey: string, summary: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({
        fields: { summary }
      })
    });
    if (!response.ok) {
      throw new Error(`Jira update issue failed: ${response.status} ${await response.text()}`);
    }
  }
}

/**
 * Azure DevOps Work Item adapter (real API calls).
 * Requires orgUrl, project, pat.
 */
export class AzureDevOpsApiAdapter implements RouterAdapter {
  constructor(
    private readonly orgUrl: string,
    private readonly project: string,
    private readonly pat: string
  ) {}

  async upsertItem(action: ActionItem): Promise<RouterReference> {
    if (action.reference?.externalId) {
      await this.patchWorkItem(Number(action.reference.externalId), [
        { op: "replace", path: "/fields/System.Title", value: action.summary }
      ]);
      return action.reference;
    }

    const response = await fetch(
      `${this.orgUrl}/${this.project}/_apis/wit/workitems/$Task?api-version=7.1-preview.3`,
      {
        method: "POST",
        headers: this.headers("application/json-patch+json"),
        body: JSON.stringify([
          { op: "add", path: "/fields/System.Title", value: action.summary },
          {
            op: "add",
            path: "/fields/System.Description",
            value: `FinOps Action ID: ${action.actionId}<br/>Recommendation: ${action.recommendationId}`
          }
        ])
      }
    );

    if (!response.ok) {
      throw new Error(`ADO create work item failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { id: number; url: string };
    return {
      system: "ado",
      externalId: String(data.id),
      url: data.url
    };
  }

  async assignOwner(action: ActionItem, ownerId: string): Promise<void> {
    const ref = assertReference(action);
    await this.patchWorkItem(Number(ref.externalId), [
      { op: "add", path: "/fields/System.AssignedTo", value: ownerId }
    ]);
  }

  async postComment(action: ActionItem, comment: string): Promise<void> {
    const ref = assertReference(action);
    await this.patchWorkItem(Number(ref.externalId), [
      { op: "add", path: "/fields/System.History", value: comment }
    ]);
  }

  async changeState(action: ActionItem, state: ActionState): Promise<void> {
    const ref = assertReference(action);
    const mapped = this.mapState(state);
    await this.patchWorkItem(Number(ref.externalId), [
      { op: "add", path: "/fields/System.State", value: mapped }
    ]);
  }

  async getReference(action: ActionItem): Promise<RouterReference> {
    return assertReference(action);
  }

  private headers(contentType = "application/json"): Record<string, string> {
    return {
      "Content-Type": contentType,
      "Authorization": toBasicAuth("", this.pat),
      "Accept": "application/json"
    };
  }

  private async patchWorkItem(id: number, operations: Array<{ op: string; path: string; value: string }>): Promise<void> {
    const response = await fetch(
      `${this.orgUrl}/${this.project}/_apis/wit/workitems/${id}?api-version=7.1-preview.3`,
      {
        method: "PATCH",
        headers: this.headers("application/json-patch+json"),
        body: JSON.stringify(operations)
      }
    );

    if (!response.ok) {
      throw new Error(`ADO patch work item failed: ${response.status} ${await response.text()}`);
    }
  }

  private mapState(state: ActionState): string {
    switch (state) {
      case "new":
      case "triaged":
      case "needsMoreEvidence":
        return "New";
      case "approved":
      case "authorized":
      case "inProgress":
        return "Active";
      case "resolved":
        return "Resolved";
      case "dismissed":
      case "closed":
        return "Closed";
      default:
        return "New";
    }
  }
}
