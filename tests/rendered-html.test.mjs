import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the ArchRoom onboarding experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ArchRoom — System design practice<\/title>/i);
  assert.match(html, /Think out loud/);
  assert.match(html, /Junior/);
  assert.match(html, /Senior architect/);
  assert.match(html, /Discussion-first practice/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps Excalidraw's React 19 integration loop-safe", async () => {
  const [board, tunnel, viteConfig] = await Promise.all([
    readFile(new URL("../app/components/DiagramBoard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/react19-tunnel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
  ]);

  assert.match(board, /lastSignalFingerprint/);
  assert.match(board, /fingerprint === lastSignalFingerprint\.current/);
  assert.match(tunnel, /useSyncExternalStore/);
  assert.match(tunnel, /const registeredEntry = entry\.current/);
  assert.match(viteConfig, /"tunnel-rat": fileURLToPath/);
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
