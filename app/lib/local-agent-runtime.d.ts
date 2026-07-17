import type { LocalAgentId, LocalAgentStatus } from "./provider-types";

export type LocalAgentInvocation = {
  arguments: string[];
  executable: string;
  stdin: string | null;
};

export function resolveLocalAgentExecutable(
  agentId: LocalAgentId,
  options?: { environment?: NodeJS.ProcessEnv; platform?: NodeJS.Platform },
): Promise<string | null>;
export function buildLocalAgentInvocation(agentId: LocalAgentId, prompt: string, executable: string): LocalAgentInvocation;
export function cleanLocalAgentOutput(output: unknown): string;
export function getLocalAgentStatuses(): Promise<LocalAgentStatus[]>;
export function runLocalAgent(agentId: LocalAgentId, prompt: string): Promise<string>;
