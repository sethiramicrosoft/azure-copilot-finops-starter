import type { ActionState } from "./types.js";

export type TrackerMode = "memory" | "github" | "jira" | "ado";

export interface RuntimeConfig {
  trackerMode: TrackerMode;
  ledgerFilePath: string;
  github?: {
    owner: string;
    repo: string;
    tokenEnvName: string;
  };
  jira?: {
    baseUrl: string;
    userEmail: string;
    tokenEnvName: string;
    projectKey: string;
    transitionMap: Partial<Record<ActionState, string>>;
  };
  ado?: {
    orgUrl: string;
    project: string;
    patEnvName: string;
  };
}

function parseTrackerMode(raw: string | undefined): TrackerMode {
  if (!raw) {
    return "memory";
  }
  if (raw === "memory" || raw === "github" || raw === "jira" || raw === "ado") {
    return raw;
  }
  throw new Error(`Invalid TRACKER_MODE value: ${raw}`);
}

function parseJsonMap(raw: string | undefined): Partial<Record<ActionState, string>> {
  if (!raw) {
    return {};
  }
  const value = JSON.parse(raw) as Record<string, string>;
  return value as Partial<Record<ActionState, string>>;
}

export function loadRuntimeConfigFromEnv(): RuntimeConfig {
  const trackerMode = parseTrackerMode(process.env.TRACKER_MODE);
  const ledgerFilePath = process.env.LEDGER_FILE_PATH ?? "data/action-ledger.jsonl";

  return {
    trackerMode,
    ledgerFilePath,
    github: process.env.GITHUB_OWNER && process.env.GITHUB_REPO
      ? {
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          tokenEnvName: process.env.GITHUB_TOKEN_ENV ?? "GITHUB_TOKEN"
        }
      : undefined,
    jira: process.env.JIRA_BASE_URL && process.env.JIRA_USER_EMAIL && process.env.JIRA_PROJECT_KEY
      ? {
          baseUrl: process.env.JIRA_BASE_URL,
          userEmail: process.env.JIRA_USER_EMAIL,
          tokenEnvName: process.env.JIRA_TOKEN_ENV ?? "JIRA_API_TOKEN",
          projectKey: process.env.JIRA_PROJECT_KEY,
          transitionMap: parseJsonMap(process.env.JIRA_TRANSITION_MAP_JSON)
        }
      : undefined,
    ado: process.env.ADO_ORG_URL && process.env.ADO_PROJECT
      ? {
          orgUrl: process.env.ADO_ORG_URL,
          project: process.env.ADO_PROJECT,
          patEnvName: process.env.ADO_PAT_ENV ?? "AZDO_PAT"
        }
      : undefined
  };
}

export function readSecretFromEnv(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`Missing required secret env var: ${envName}`);
  }
  return value;
}
