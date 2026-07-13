import type { InterviewTurnRequest } from "./provider-types";

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
