import { scenarios } from "../../lib/question-catalog";
import type { InterviewTurnRequest, ProviderId, ProviderMessage } from "../../lib/provider-types";

const supportedProviders = new Set<ProviderId>(["openai", "anthropic", "gemini", "antigravity"]);
const neutralCodingReply = "Reason from the work your current approach repeats and the guarantees in the input. What information could you retain, or what work could you safely discard, to justify a tighter solution?";
const codingPatterns = [
  /two pointers?/i,
  /sliding window/i,
  /dynamic programming|\bdp\b/i,
  /binary search/i,
  /monotonic (?:stack|queue)/i,
  /priority queue|\bheap\b/i,
  /backtracking/i,
  /topological sort/i,
  /union[ -]?find/i,
  /dijkstra/i,
  /prefix (?:sum|tree)/i,
  /\btrie\b/i,
];

type ProviderPayload = {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

class ProviderRequestError extends Error {
  constructor(provider: string, status: number) {
    super(`${provider} rejected the request (${status}). Check the API key, model, and provider quota.`);
  }
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function normalizeMessages(messages: ProviderMessage[]) {
  const normalized = messages
    .filter((message) => message.role !== "system" && message.text.trim())
    .slice(-20)
    .map((message) => ({
      role: message.role === "candidate" ? "user" as const : "assistant" as const,
      content: message.text.slice(0, 12_000),
    }));
  while (normalized[0]?.role === "assistant") normalized.shift();
  return normalized;
}

function buildPrompt(request: InterviewTurnRequest): ProviderPayload {
  const messages = normalizeMessages(request.messages);
  if (request.round === "coding") {
    const problem = request.problem;
    const code = request.code?.slice(0, 40_000) || "No code has been written yet.";
    return {
      system: [
        "You are conducting a discussion-based coding interview. Be demanding but constructive, and ask one focused question at a time.",
        "Accept a correct brute-force baseline, then ask the candidate to derive an improvement from repeated work, constraints, invariants, or a time-space trade-off.",
        "CRITICAL: Never name, suggest, or paraphrase a standard algorithmic pattern unless the candidate already named it. Never reveal the expected or target time complexity. Do not provide a solution or code.",
        `Candidate level: ${request.level}. Language: ${request.language || "not specified"}.`,
        `Problem: ${problem?.title || "coding exercise"} (${problem?.difficulty || "unknown difficulty"}).`,
        `Current code:\n${code}`,
      ].join("\n\n"),
      messages,
    };
  }

  const scenario = scenarios.find((item) => item.id === request.scenarioId) ?? scenarios[0];
  const canvas = request.canvas;
  return {
    system: [
      "You are Maya Chen, a principal architect conducting a discussion-based system-design interview.",
      "There is no single correct design. Assess the candidate’s reasoning, question assumptions, demand concrete trade-offs, and ask one focused question at a time. Do not give a reference architecture or take over the design.",
      "Evaluate scalability, reliability and availability, performance and latency, maintainability and simplicity, security, data and storage, communication patterns, and infrastructure choices.",
      request.sessionMode === "guided"
        ? "This is a guided learning session. Keep the candidate moving through requirements, estimates, data model and API, high-level design, deep dives, and wrap-up without handing them answers."
        : "This is a mock interview. Preserve ambiguity until the candidate asks useful clarifying questions.",
      `Candidate level: ${request.level}. Challenge: ${scenario.name}. Brief: ${scenario.brief}`,
      `When requirements are requested, use this product context: ${scenario.functionalAnswer}`,
      `When scale is requested, use this scale context: ${scenario.scaleAnswer}`,
      canvas
        ? `Current canvas evidence: ${canvas.shapes} shapes, ${canvas.connections} connections, labels: ${canvas.labels.slice(0, 20).join(", ") || "none"}.`
        : "No canvas evidence was supplied.",
    ].join("\n\n"),
    messages,
  };
}

function extractOpenAIText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  return output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
    const contentBlocks: unknown[] = item.content;
    return contentBlocks.flatMap((content) => {
      if (!content || typeof content !== "object" || !("text" in content) || typeof content.text !== "string") return [];
      return [content.text];
    });
  }).join("\n");
}

function extractAnthropicText(data: Record<string, unknown>) {
  const content = Array.isArray(data.content) ? data.content : [];
  return content.flatMap((item) => {
    if (!item || typeof item !== "object" || !("text" in item) || typeof item.text !== "string") return [];
    return [item.text];
  }).join("\n");
}

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 8 || value == null) return [];
  if (typeof value === "string") return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item, depth + 1));
  if (typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => {
    if ((key === "text" || key === "output_text") && typeof item === "string") return [item];
    return collectText(item, depth + 1);
  });
}

async function providerFetch(provider: string, url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new ProviderRequestError(provider, response.status);
  return response.json() as Promise<Record<string, unknown>>;
}

async function callProvider(request: InterviewTurnRequest, prompt: ProviderPayload) {
  const { id, apiKey, model } = request.provider;
  if (id === "openai") {
    const data = await providerFetch("OpenAI", "https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions: prompt.system, input: prompt.messages, max_output_tokens: 700, store: false }),
    });
    return extractOpenAIText(data);
  }

  if (id === "anthropic") {
    const data = await providerFetch("Claude", "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, system: prompt.system, messages: prompt.messages, max_tokens: 700 }),
    });
    return extractAnthropicText(data);
  }

  if (id === "gemini") {
    const data = await providerFetch(
      "Gemini",
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: prompt.messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
          generationConfig: { maxOutputTokens: 700 },
        }),
      },
    );
    return collectText(data).join("\n");
  }

  const transcript = prompt.messages.map((message) => `${message.role === "user" ? "Candidate" : "Interviewer"}: ${message.content}`).join("\n\n");
  const data = await providerFetch("Antigravity", "https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
    body: JSON.stringify({ agent: model, input: `${prompt.system}\n\nInterview transcript:\n${transcript}`, environment: "remote" }),
  });
  return collectText(data).join("\n");
}

export function guardCodingReply(reply: string, candidateText: string) {
  const leakedPattern = codingPatterns.some((pattern) => pattern.test(reply) && !pattern.test(candidateText));
  const leakedComplexity = /\bO\s*\([^)]+\)/i.test(reply) && !/\bO\s*\([^)]+\)/i.test(candidateText);
  return leakedPattern || leakedComplexity ? neutralCodingReply : reply;
}

function validateRequest(value: unknown): value is InterviewTurnRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<InterviewTurnRequest>;
  return Boolean(
    request.provider
    && supportedProviders.has(request.provider.id as ProviderId)
    && typeof request.provider.apiKey === "string"
    && request.provider.apiKey.length >= 8
    && request.provider.apiKey.length <= 512
    && typeof request.provider.model === "string"
    && request.provider.model.length >= 2
    && request.provider.model.length <= 120
    && (request.round === "system-design" || request.round === "coding")
    && Array.isArray(request.messages)
    && request.messages.length > 0
    && request.messages.length <= 40
    && request.messages.every((message) => Boolean(
      message
      && typeof message === "object"
      && (message.role === "interviewer" || message.role === "candidate" || message.role === "system")
      && typeof message.text === "string"
      && message.text.length > 0
      && message.text.length <= 12_000
    ))
    && (request.level === "junior" || request.level === "mid" || request.level === "architect")
  );
}

export async function POST(httpRequest: Request) {
  try {
    const contentLength = Number(httpRequest.headers.get("content-length") || 0);
    if (contentLength > 250_000) return json({ error: "Provider request is too large." }, 413);
    const request = await httpRequest.json();
    if (JSON.stringify(request).length > 250_000) return json({ error: "Provider request is too large." }, 413);
    if (!validateRequest(request)) return json({ error: "Invalid provider request." }, 400);

    const prompt = buildPrompt(request);
    const providerReply = (await callProvider(request, prompt)).trim();
    if (!providerReply) return json({ error: "The selected provider returned an empty response." }, 502);

    const candidateText = request.messages.filter((message) => message.role === "candidate").map((message) => message.text).join(" ");
    const text = request.round === "coding" ? guardCodingReply(providerReply, candidateText) : providerReply;
    return json({ text });
  } catch (error) {
    const message = error instanceof ProviderRequestError ? error.message : "The selected provider is temporarily unavailable.";
    return json({ error: message }, 502);
  }
}
