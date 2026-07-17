import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("defines a renderable InterviewLab product demo", async () => {
  const [packageText, entry, root, demo] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("remotion/index.ts", projectRoot), "utf8"),
    readFile(new URL("remotion/Root.tsx", projectRoot), "utf8"),
    readFile(new URL("remotion/InterviewLabDemo.tsx", projectRoot), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.equal(packageJson.devDependencies.remotion, "4.0.490");
  assert.equal(packageJson.devDependencies["@remotion/cli"], "4.0.490");
  assert.equal(packageJson.devDependencies.zod, "4.3.6");
  assert.match(packageJson.scripts["video:studio"], /remotion\/index\.ts/);
  assert.match(packageJson.scripts["video:render"], /InterviewLabProductDemo/);
  assert.match(entry, /registerRoot\(RemotionRoot\)/);
  assert.match(root, /id="InterviewLabProductDemo"/);
  assert.match(root, /durationInFrames=\{1200\}/);
  assert.match(root, /fps=\{30\}/);
  assert.match(root, /width=\{1920\}/);
  assert.match(root, /height=\{1080\}/);
  assert.match(demo, /useCurrentFrame/);
  assert.match(demo, /interpolate/);
  assert.match(demo, /staticFile\("og-interviewlab\.png"\)/);
  assert.match(demo, /Practice the interview/);
  assert.match(demo, /System design/);
  assert.match(demo, /Coding rounds/);
  assert.match(demo, /No API key/);
  assert.doesNotMatch(demo, /@keyframes|transition\s*:/);
});
