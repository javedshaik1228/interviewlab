import type { InterviewTurnRequest, LocalAgentStatus } from "./provider-types";

export type LocalAgentDetection = {
  desktop: boolean;
  agents: LocalAgentStatus[];
};

export async function detectLocalAgents(): Promise<LocalAgentDetection> {
  const response = await fetch("/api/interviewer", { cache: "no-store" });
  const payload = await response.json().catch(() => null) as LocalAgentDetection | null;
  if (!response.ok || !payload || !Array.isArray(payload.agents)) {
    throw new Error("Could not detect installed agents.");
  }
  return payload;
}

export async function requestInterviewerTurn(request: InterviewTurnRequest): Promise<string> {
  const response = await fetch("/api/interviewer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => null) as { text?: string; error?: string } | null;
  if (!response.ok || !payload?.text) {
    throw new Error(payload?.error || "The selected interviewer provider did not respond.");
  }

  return payload.text;
}
