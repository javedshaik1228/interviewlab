import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const localAgentIds = ["codex", "claude-code", "antigravity"];
const maximumOutputBytes = 2_000_000;
const maximumArgumentPromptLength = 24_000;
const localAgentTimeoutMs = 120_000;

const executableNames = {
  codex: ["codex"],
  "claude-code": ["claude"],
  antigravity: ["agy", "antigravity"],
};

const agentLabels = {
  codex: "Codex",
  "claude-code": "Claude Code",
  antigravity: "Antigravity",
};

function assertLocalAgentId(agentId) {
  if (!localAgentIds.includes(agentId)) throw new Error("Unsupported local agent.");
}

function pathDirectories(environment, platform) {
  const pathValue = environment.PATH || environment.Path || environment.path || "";
  const delimiter = platform === "win32" ? ";" : ":";
  const home = environment.USERPROFILE || environment.HOME || os.homedir();
  return [
    ...pathValue.split(delimiter),
    home && path.join(home, ".local", "bin"),
    home && path.join(home, ".npm-global", "bin"),
    environment.APPDATA && path.join(environment.APPDATA, "npm"),
    environment.LOCALAPPDATA && path.join(environment.LOCALAPPDATA, "agy", "bin"),
    environment.LOCALAPPDATA && path.join(environment.LOCALAPPDATA, "Microsoft", "WindowsApps"),
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/Applications/Codex.app/Contents/Resources",
  ].filter(Boolean);
}

function namesForPlatform(agentId, platform) {
  const names = executableNames[agentId];
  if (platform !== "win32") return names;
  return names.flatMap((name) => [`${name}.exe`, `${name}.cmd`, `${name}.bat`, name]);
}

export async function resolveLocalAgentExecutable(
  agentId,
  { environment = process.env, platform = process.platform } = {},
) {
  assertLocalAgentId(agentId);
  const visited = new Set();
  for (const directory of pathDirectories(environment, platform)) {
    if (!directory) continue;
    for (const name of namesForPlatform(agentId, platform)) {
      const candidate = path.resolve(directory, name);
      const key = platform === "win32" ? candidate.toLowerCase() : candidate;
      if (visited.has(key)) continue;
      visited.add(key);
      try {
        if ((await stat(candidate)).isFile()) return candidate;
      } catch {
        // Keep looking through the user's executable search paths.
      }
    }
  }
  return null;
}

function isBatchExecutable(executable) {
  return /\.(?:cmd|bat)$/i.test(executable);
}

function assertSafeBatchExecutable(executable) {
  if (/[&|<>^%!\r\n]/.test(executable)) {
    throw new Error("The local agent path contains characters that cannot be launched safely.");
  }
}

export function buildLocalAgentInvocation(agentId, prompt, executable) {
  assertLocalAgentId(agentId);
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("The local agent prompt is empty.");
  if (typeof executable !== "string" || !executable) throw new Error("The local agent executable is missing.");

  if (agentId === "codex") {
    return {
      arguments: [
        "exec",
        "--ephemeral",
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--ignore-user-config",
        "--ignore-rules",
        "--disable",
        "shell_tool",
        "--disable",
        "unified_exec",
        "--config",
        "web_search=\"disabled\"",
        "--config",
        "tools.view_image=false",
        "--color",
        "never",
        "-",
      ],
      executable,
      stdin: prompt,
    };
  }

  if (agentId === "claude-code") {
    return {
      arguments: [
        "--print",
        "--output-format",
        "text",
        "--no-session-persistence",
        "--safe-mode",
        "--no-chrome",
        "--tools",
        "",
        "--permission-mode",
        "dontAsk",
      ],
      executable,
      stdin: prompt,
    };
  }

  if (isBatchExecutable(executable)) {
    throw new Error("A native Antigravity executable is required for safe one-shot prompts.");
  }
  if (prompt.length > maximumArgumentPromptLength) {
    throw new Error("The Antigravity prompt is too long for a safe one-shot invocation.");
  }
  return {
    arguments: ["--sandbox", "-p", prompt],
    executable,
    stdin: null,
  };
}

export function cleanLocalAgentOutput(output) {
  const cleaned = String(output)
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, "")
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!cleaned) throw new Error("The installed agent returned an empty response.");
  return cleaned;
}

function collectProcessOutput(child, label) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill();
      finish(new Error(`${label} took too long to respond.`));
    }, localAgentTimeoutMs);

    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(value);
    }

    function appendOutput(target, chunk) {
      outputBytes += chunk.length;
      if (outputBytes > maximumOutputBytes) {
        child.kill();
        finish(new Error(`${label} returned too much output.`));
        return target;
      }
      return target + chunk.toString("utf8");
    }

    child.stdout.on("data", (chunk) => { stdout = appendOutput(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = appendOutput(stderr, chunk); });
    child.once("error", () => finish(new Error(`${label} could not be started. Check that it is installed and signed in.`)));
    child.once("close", (code) => {
      if (code === 0) {
        try {
          finish(null, cleanLocalAgentOutput(stdout));
        } catch (error) {
          finish(error);
        }
        return;
      }
      const detail = cleanFailureDetail(stderr || stdout);
      finish(new Error(`${label} exited with code ${code ?? "unknown"}.${detail ? ` ${detail}` : " Check that it is signed in."}`));
    });
  });
}

function cleanFailureDetail(output) {
  return String(output)
    .replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-500);
}

export async function getLocalAgentStatuses() {
  return Promise.all(localAgentIds.map(async (id) => ({
    id,
    installed: Boolean(await resolveLocalAgentExecutable(id)),
  })));
}

export async function runLocalAgent(agentId, prompt) {
  assertLocalAgentId(agentId);
  const executable = await resolveLocalAgentExecutable(agentId);
  if (!executable) throw new Error(`${agentLabels[agentId]} is not installed or is not available on PATH.`);
  const invocation = buildLocalAgentInvocation(agentId, prompt, executable);
  const batch = process.platform === "win32" && isBatchExecutable(invocation.executable);
  if (batch) assertSafeBatchExecutable(invocation.executable);

  const child = spawn(invocation.executable, invocation.arguments, {
    cwd: os.tmpdir(),
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    shell: batch,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  if (invocation.stdin === null) child.stdin.end();
  else child.stdin.end(invocation.stdin, "utf8");
  return collectProcessOutput(child, agentLabels[agentId]);
}
