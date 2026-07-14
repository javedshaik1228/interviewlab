import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { once } from "node:events";

let appServer;
let baseUrl;
let serverOutput = "";

async function availablePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  return address.port;
}

before(async () => {
  const port = await availablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  appServer = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        SITE_URL: "http://localhost:3000",
        ALLOWED_ORIGINS: baseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  appServer.stdout.on("data", (chunk) => { serverOutput += chunk; });
  appServer.stderr.on("data", (chunk) => { serverOutput += chunk; });

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (appServer.exitCode !== null) throw new Error(`Next.js exited before startup.\n${serverOutput}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Next.js.\n${serverOutput}`);
});

after(async () => {
  if (!appServer || appServer.exitCode !== null) return;
  appServer.kill();
  await Promise.race([once(appServer, "exit"), new Promise((resolve) => setTimeout(resolve, 5000))]);
});

async function render() {
  return fetch(`${baseUrl}/`, { headers: { accept: "text/html" } });
}

test("server-renders the InterviewLab onboarding experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>InterviewLab — System design and coding practice<\/title>/i);
  assert.match(html, /og-interviewlab\.png/i);
  assert.match(html, /http:\/\/localhost:3000\/og-interviewlab\.png/i);
  assert.doesNotMatch(html, /InterviewRoom/i);
  assert.match(html, /Think out loud/);
  assert.match(html, /Junior/);
  assert.match(html, /Senior architect/);
  assert.match(html, /Discussion-first practice/);
  assert.doesNotMatch(html, />ArchRoom</);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps Excalidraw's React 19 integration loop-safe", async () => {
  const [board, tunnel, nextConfig] = await Promise.all([
    readFile(new URL("../app/components/DiagramBoard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/react19-tunnel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(board, /lastSignalFingerprint/);
  assert.match(board, /fingerprint === lastSignalFingerprint\.current/);
  assert.match(tunnel, /useSyncExternalStore/);
  assert.match(tunnel, /const registeredEntry = entry\.current/);
  assert.match(nextConfig, /"tunnel-rat": tunnelRatCompat/);
});

test("includes the guided delivery framework learning mode", async () => {
  const [app, engine, css] = await Promise.all([
    readFile(new URL("../app/components/InterviewApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/interview-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /Guided learning/);
  assert.match(app, /hellointerview\.com\/learn\/system-design\/in-a-hurry\/delivery/);
  assert.match(app, /advanceFramework/);
  assert.match(engine, /export const deliveryFramework/);
  assert.match(engine, /id: "requirements"/);
  assert.match(engine, /id: "deep-dives"/);
  assert.match(css, /\.guided-coach/);
  assert.match(css, /\.guided-strip/);
});

test("offers the full guided catalog and rubric-based mock evaluation", async () => {
  const [app, catalog, assessment, css] = await Promise.all([
    readFile(new URL("../app/components/InterviewApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/question-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/design-assessment.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.equal((catalog.match(/sourceSlug:/g) ?? []).length, 30);
  assert.match(catalog, /pickRandomScenario/);
  assert.match(app, /Random challenge from 30 problems/);
  assert.match(app, /scenario-catalog/);
  assert.match(assessment, /Scalability/);
  assert.match(assessment, /Reliability & availability/);
  assert.match(assessment, /Performance & latency/);
  assert.match(assessment, /Maintainability & simplicity/);
  assert.match(assessment, /Security/);
  assert.match(assessment, /Data & storage/);
  assert.match(assessment, /Communication/);
  assert.match(assessment, /Infrastructure/);
  assert.match(css, /\.quality-score-list/);
  assert.match(css, /\.choice-table/);
});

test("adds a NeetCode 150-only coding round with submission notes", async () => {
  const [app, codingRoom, catalog, engine, css] = await Promise.all([
    readFile(new URL("../app/components/InterviewApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CodingInterview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/neetcode-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/coding-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  const seeds = catalog.match(/\["[^"]+", "(?:Easy|Medium|Hard)", "[^"]+"\]/g) ?? [];
  assert.equal(seeds.length, 150);
  assert.match(app, /LeetCode round/);
  assert.match(app, /CodingInterview/);
  assert.match(codingRoom, /Submit & view notes/);
  assert.match(codingRoom, /Candidate input notes/);
  assert.match(codingRoom, /workspaceTab.*problem/);
  assert.match(codingRoom, /<iframe/);
  assert.match(codingRoom, /src=\{problem\.sourceUrl\}/);
  assert.match(codingRoom, /Official content stays on NeetCode and is displayed inside InterviewLab/);
  assert.match(codingRoom, /A brute-force solution is acceptable/);
  assert.match(engine, /buildCodingNotes/);
  const liveInterviewEngine = engine.split("export function buildCodingNotes")[0];
  assert.doesNotMatch(codingRoom, /problem\.(?:category|optimizationHint|targetComplexity)/);
  assert.doesNotMatch(liveInterviewEngine, /problem\.(?:category|optimizationHint|targetComplexity)/);
  assert.match(codingRoom, /Pattern hidden during interview/);
  assert.match(codingRoom, /Reference after submission/);
  assert.match(engine, /Reference pattern/);
  assert.match(css, /\.coding-workspace/);
  assert.match(css, /\.embedded-problem/);
  assert.match(css, /\.code-workspace-tabs/);
  assert.match(css, /\.coding-notes-modal/);
  assert.doesNotMatch(app, /Upload your resume|Role context|handleFile/);
  assert.doesNotMatch(css, /\.resume-drop|\.summary-label/);
});

test("requires a session-only BYO provider without a built-in fallback", async () => {
  const [app, codingRoom, providerTypes, providerRoute, providerService, interviewEngine, codingEngine, css, readme] = await Promise.all([
    readFile(new URL("../app/components/InterviewApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CodingInterview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/provider-types.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interviewer/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/interviewer-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/interview-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/coding-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  const providerServer = `${providerRoute}\n${providerService}`;

  assert.match(app, /Choose your interviewer/);
  assert.match(app, /Session-only API key/);
  assert.match(app, /providerCanStart/);
  assert.match(codingRoom, /requestInterviewerTurn/);
  assert.match(providerTypes, /"openai" \| "anthropic" \| "gemini" \| "antigravity"/);
  assert.match(providerServer, /api\.openai\.com\/v1\/responses/);
  assert.match(providerServer, /api\.anthropic\.com\/v1\/messages/);
  assert.match(providerServer, /generativelanguage\.googleapis\.com/);
  assert.match(providerServer, /guardCodingReply/);
  assert.match(providerServer, /no-store/);
  assert.match(readme, /No server-owned provider\s+credential\s+or\s+fallback exists/i);
  assert.doesNotMatch(`${app}\n${codingRoom}\n${providerTypes}\n${interviewEngine}\n${codingEngine}`, /\bbuiltin\b|built-in interviewer|createArchitectReply|createCodingReply|providerRequiresKey/i);
  assert.doesNotMatch(providerServer, /process\.env\.(?:OPENAI|ANTHROPIC|GEMINI|GOOGLE).*KEY/i);
  assert.doesNotMatch(`${app}\n${codingRoom}`, /localStorage|sessionStorage/);
  assert.match(css, /\.provider-picker/);
  assert.doesNotMatch(css, /\.provider-built-in-note/);
});

test("rejects incomplete provider requests without caching them", async () => {
  const response = await fetch(`${baseUrl}/api/interviewer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: { id: "openai", apiKey: "", model: "" } }),
    });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "Invalid provider request." });
});

test("rejects the removed built-in provider", async () => {
  const response = await fetch(`${baseUrl}/api/interviewer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: { id: "builtin", apiKey: "not-applicable", model: "local-rubric" },
      round: "system-design",
      level: "mid",
      messages: [{ role: "candidate", text: "Let us clarify requirements." }],
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "Invalid provider request." });
});

test("permits only configured origins to call the interviewer proxy", async () => {
  const allowed = await fetch(`${baseUrl}/api/interviewer`, {
    method: "OPTIONS",
    headers: {
      origin: baseUrl,
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });

  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), baseUrl);
  assert.match(allowed.headers.get("access-control-allow-methods") ?? "", /POST/);
  assert.match(allowed.headers.get("vary") ?? "", /\bOrigin\b/);

  const denied = await fetch(`${baseUrl}/api/interviewer`, {
    method: "OPTIONS",
    headers: {
      origin: "https://evil.example",
      "access-control-request-method": "POST",
    },
  });

  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("keeps interview workspaces clean with compact problems and dockable chat", async () => {
  const [app, codingRoom, css] = await Promise.all([
    readFile(new URL("../app/components/InterviewApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/CodingInterview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /chatDocked/);
  assert.match(codingRoom, /chatDocked/);
  assert.match(app, /Dock system-design chat/);
  assert.match(codingRoom, /Dock coding chat/);
  assert.match(css, /\.workspace\.chat-docked/);
  assert.match(css, /\.coding-workspace\.chat-docked/);
  assert.match(css, /\.embedded-problem iframe[^}]*transform:\s*scale\(0\.86\)/s);
});

test("ships a portable standalone deployment", async () => {
  const [packageText, nextConfig, dockerfile, dockerIgnore, compose, layout, healthRoute, readme, gitignore] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../Dockerfile", import.meta.url), "utf8"),
    readFile(new URL("../.dockerignore", import.meta.url), "utf8"),
    readFile(new URL("../compose.yaml", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.equal(packageJson.scripts.build, "npm run typecheck && next build --webpack");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(packageJson.scripts["build:sites"], undefined);
  assert.match(nextConfig, /output:\s*"standalone"/);
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.match(dockerfile, /node",\s*"server\.js"/);
  assert.match(dockerIgnore, /node_modules/);
  assert.match(compose, /interviewlab:/);
  assert.match(layout, /process\.env\.SITE_URL/);
  assert.match(layout, /await headers\(\)/);
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(healthRoute, /status:\s*"ok"/);
  assert.match(readme, /Self-host with Docker/);
  assert.match(gitignore, /!\.env\.example/);
});

test("ships a GitHub Pages frontend with a remote provider proxy", async () => {
  const [packageText, viteConfig, staticEntry, providerClient, workflow, worker, wrangler, readme] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../vite.pages.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../static/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/provider-client.ts", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../proxy/worker.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.match(packageJson.scripts["build:pages"], /vite build/);
  assert.match(packageJson.scripts["deploy:proxy"], /wrangler .*deploy/);
  assert.match(viteConfig, /NEXT_PUBLIC_INTERVIEWER_API_URL/);
  assert.match(viteConfig, /GITHUB_REPOSITORY/);
  assert.match(staticEntry, /InterviewApp/);
  assert.match(providerClient, /NEXT_PUBLIC_INTERVIEWER_API_URL/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /INTERVIEWER_API_URL/);
  assert.match(worker, /ALLOWED_ORIGINS/);
  assert.match(worker, /\/api\/health/);
  assert.match(wrangler, /interviewlab-provider-proxy/);
  assert.match(readme, /GitHub Pages \+ Cloudflare Worker/);
  assert.match(readme, /repository variable.*INTERVIEWER_API_URL/is);
});
