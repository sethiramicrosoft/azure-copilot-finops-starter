import type { RouterAdapter } from "./types.js";
import { AdoAdapter, GitHubIssuesAdapter, JiraAdapter } from "./adapters.js";
import { AzureDevOpsApiAdapter, GitHubIssuesApiAdapter, JiraApiAdapter } from "./productionAdapters.js";
import type { RuntimeConfig } from "./runtimeConfig.js";
import { readSecretFromEnv } from "./runtimeConfig.js";

export function createRouterAdapter(config: RuntimeConfig): RouterAdapter {
  switch (config.trackerMode) {
    case "memory":
      return new AdoAdapter();
    case "github": {
      if (!config.github) {
        throw new Error("TRACKER_MODE=github but GitHub runtime config is missing.");
      }
      const token = readSecretFromEnv(config.github.tokenEnvName);
      return new GitHubIssuesApiAdapter(config.github.owner, config.github.repo, token);
    }
    case "jira": {
      if (!config.jira) {
        throw new Error("TRACKER_MODE=jira but Jira runtime config is missing.");
      }
      const token = readSecretFromEnv(config.jira.tokenEnvName);
      return new JiraApiAdapter(
        config.jira.baseUrl,
        config.jira.userEmail,
        token,
        config.jira.projectKey,
        config.jira.transitionMap
      );
    }
    case "ado": {
      if (!config.ado) {
        throw new Error("TRACKER_MODE=ado but Azure DevOps runtime config is missing.");
      }
      const pat = readSecretFromEnv(config.ado.patEnvName);
      return new AzureDevOpsApiAdapter(config.ado.orgUrl, config.ado.project, pat);
    }
    default:
      return new GitHubIssuesAdapter();
  }
}
