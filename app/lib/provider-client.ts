import type { InterviewTurnRequest } from "./provider-types";

const configuredApiOrigin = process.env.NEXT_PUBLIC_INTERVIEWER_API_URL?.trim().replace(/\/+$/, "");
const interviewerEndpoint = configuredApiOrigin
  ? `${configuredApiOrigin}/api/interviewer`
  : "/api/interviewer";

export async function requestInterviewerTurn(request: InterviewTurnRequest): Promise<string> {
  const response = await fetch(interviewerEndpoint, {
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
