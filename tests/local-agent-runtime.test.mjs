import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";

import {
  buildLocalAgentInvocation,
  cleanLocalAgentOutput,
  resolveLocalAgentExecutable,
} from "../app/lib/local-agent-runtime.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "interviewlab-agent-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

test("resolves supported native agents from PATH and Antigravity's Windows install directory", async () => {
  const bin = await temporaryDirectory();
  const localAppData = await temporaryDirectory();
  const agyBin = path.join(localAppData, "agy", "bin");
  await mkdir(agyBin, { recursive: true });
  await Promise.all([
    writeFile(path.join(bin, "codex.exe"), ""),
    writeFile(path.join(bin, "claude.exe"), ""),
    writeFile(path.join(agyBin, "agy.exe"), ""),
  ]);

  const environment = { LOCALAPPDATA: localAppData, PATH: bin };
  assert.equal(await resolveLocalAgentExecutable("codex", { environment, platform: "win32" }), path.join(bin, "codex.exe"));
  assert.equal(await resolveLocalAgentExecutable("claude-code", { environment, platform: "win32" }), path.join(bin, "claude.exe"));
  assert.equal(await resolveLocalAgentExecutable("antigravity", { environment, platform: "win32" }), path.join(agyBin, "agy.exe"));
});

test("builds non-interactive, no-write invocations without putting Codex or Claude prompts in arguments", () => {
  const prompt = "Candidate input with & shell metacharacters";
  const codex = buildLocalAgentInvocation("codex", prompt, "/usr/local/bin/codex");
  const claude = buildLocalAgentInvocation("claude-code", prompt, "/usr/local/bin/claude");

  assert.equal(codex.stdin, prompt);
  assert.equal(claude.stdin, prompt);
  assert.ok(codex.arguments.includes("--ephemeral"));
  assert.ok(codex.arguments.includes("read-only"));
  assert.ok(codex.arguments.includes("--ignore-user-config"));
  assert.ok(codex.arguments.includes("shell_tool"));
  assert.ok(codex.arguments.includes("web_search=\"disabled\""));
  assert.ok(claude.arguments.includes("--print"));
  assert.ok(claude.arguments.includes("--no-session-persistence"));
  assert.ok(claude.arguments.includes("--safe-mode"));
  assert.ok(!codex.arguments.includes(prompt));
  assert.ok(!claude.arguments.includes(prompt));
});

test("uses Antigravity's documented one-shot prompt mode only with a native executable", () => {
  const invocation = buildLocalAgentInvocation("antigravity", "Ask one focused question.", "/usr/local/bin/agy");
  assert.deepEqual(invocation.arguments, ["--sandbox", "-p", "Ask one focused question."]);
  assert.throws(
    () => buildLocalAgentInvocation("antigravity", "unsafe & prompt", "C:\\tools\\agy.cmd"),
    /native Antigravity executable/i,
  );
  assert.throws(
    () => buildLocalAgentInvocation("antigravity", "x".repeat(24_001), "/usr/local/bin/agy"),
    /too long/i,
  );
});

test("normalizes ANSI-decorated output and rejects empty replies", () => {
  assert.equal(cleanLocalAgentOutput("\u001b[32mFollow up?\u001b[0m\r\n"), "Follow up?");
  assert.throws(() => cleanLocalAgentOutput(" \r\n\t"), /empty response/i);
});
