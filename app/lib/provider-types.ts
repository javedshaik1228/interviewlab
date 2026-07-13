export type ProviderId = "builtin" | "openai" | "anthropic" | "gemini" | "antigravity";

export type ProviderConnection = {
  id: ProviderId;
  apiKey: string;
  model: string;
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
    id: "builtin",
    label: "InterviewLab built-in",
    shortLabel: "Built-in",
    description: "Private, instant, and key-free. Uses the local interview rubric.",
  },
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

export const defaultProviderModels: Record<ProviderId, string> = {
  builtin: "local-rubric",
  openai: "gpt-5.4-mini",
  anthropic: "claude-sonnet-4-6",
  gemini: "gemini-3.5-flash",
  antigravity: "antigravity-preview-05-2026",
};

export function providerRequiresKey(providerId: ProviderId) {
  return providerId !== "builtin";
}

export function getProviderLabel(providerId: ProviderId) {
  return providerOptions.find((option) => option.id === providerId)?.shortLabel ?? "Built-in";
}
