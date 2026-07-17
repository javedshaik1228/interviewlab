export type ProviderId = "openai" | "anthropic" | "gemini" | "antigravity";
export type LocalAgentId = "codex" | "claude-code" | "antigravity";

export type ApiProviderConnection = {
  mode: "api";
  id: ProviderId;
  apiKey: string;
  model: string;
};

export type LocalAgentConnection = {
  mode: "local";
  id: LocalAgentId;
};

export type ProviderConnection = ApiProviderConnection | LocalAgentConnection;

export type LocalAgentStatus = {
  id: LocalAgentId;
  installed: boolean;
};

export type ProviderMessage = {
  role: "interviewer" | "candidate" | "system";
  text: string;
};

export type InterviewTurnRequest = {
  provider: ProviderConnection;
  round: "system-design" | "coding";
  messages: ProviderMessage[];
  level: "junior" | "mid" | "architect";
  scenarioId?: string;
  sessionMode?: "mock" | "guided";
  canvas?: {
    shapes: number;
    connections: number;
    labels: string[];
  };
  problem?: {
    id: string;
    title: string;
    difficulty: string;
  };
  language?: string;
  code?: string;
};

export const providerOptions: Array<{
  id: ProviderId;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: "openai",
    label: "OpenAI / Codex models",
    shortLabel: "OpenAI",
    description: "Use an OpenAI API model for adaptive discussion and follow-ups.",
  },
  {
    id: "anthropic",
    label: "Claude",
    shortLabel: "Claude",
    description: "Use your Anthropic API key through the Claude Messages API.",
  },
  {
    id: "gemini",
    label: "Gemini",
    shortLabel: "Gemini",
    description: "Use a Gemini model for multimodal interview reasoning.",
  },
  {
    id: "antigravity",
    label: "Antigravity agent",
    shortLabel: "Antigravity",
    description: "Use Google’s managed Antigravity agent preview through the Gemini API.",
  },
];

export const localAgentOptions: Array<{
  id: LocalAgentId;
  label: string;
  description: string;
}> = [
  {
    id: "codex",
    label: "Codex",
    description: "Uses your existing Codex sign-in in a read-only, ephemeral session.",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    description: "Uses your existing Claude Code sign-in with tools disabled.",
  },
  {
    id: "antigravity",
    label: "Antigravity",
    description: "Uses your existing Antigravity CLI sign-in in one-shot mode.",
  },
];

export const defaultProviderModels: Record<ProviderId, string> = {
  openai: "gpt-5.4-mini",
  anthropic: "claude-sonnet-4-6",
  gemini: "gemini-3.5-flash",
  antigravity: "antigravity-preview-05-2026",
};

export function getProviderLabel(providerId: ProviderId | LocalAgentId) {
  return localAgentOptions.find((option) => option.id === providerId)?.label
    ?? providerOptions.find((option) => option.id === providerId)?.shortLabel
    ?? "External provider";
}

export function getProviderRecoveryHint(provider: ProviderConnection) {
  return provider.mode === "local"
    ? "Check that the CLI is installed and signed in, then try again."
    : "Check the API key, model, and quota, then try again.";
}
