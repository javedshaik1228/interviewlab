import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("defines a renderable InterviewLab product demo", async () => {
  const [packageText, entry, root, demo, audioPlan, audioGenerator, audioNormalizer] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("remotion/index.ts", projectRoot), "utf8"),
    readFile(new URL("remotion/Root.tsx", projectRoot), "utf8"),
    readFile(new URL("remotion/InterviewLabDemo.tsx", projectRoot), "utf8"),
    readFile(new URL("remotion/audio-plan.ts", projectRoot), "utf8"),
    readFile(new URL("scripts/generate-product-demo-audio.mjs", projectRoot), "utf8"),
    readFile(new URL("scripts/normalize-product-demo-audio.mjs", projectRoot), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.equal(packageJson.devDependencies.remotion, "4.0.490");
  assert.equal(packageJson.devDependencies["@remotion/cli"], "4.0.490");
  assert.equal(packageJson.devDependencies["@remotion/google-fonts"], "4.0.490");
  assert.equal(packageJson.devDependencies["@remotion/media"], "4.0.490");
  assert.equal(packageJson.devDependencies.zod, "4.3.6");
  assert.match(packageJson.scripts["video:studio"], /remotion\/index\.ts/);
  assert.match(packageJson.scripts["video:render"], /InterviewLabProductDemo/);
  assert.match(packageJson.scripts["video:render"], /normalize-product-demo-audio\.mjs/);
  assert.match(packageJson.scripts["video:audio"], /generate-product-demo-audio\.mjs/);
  assert.match(entry, /registerRoot\(RemotionRoot\)/);
  assert.match(root, /id="InterviewLabProductDemo"/);
  assert.match(root, /durationInFrames=\{1200\}/);
  assert.match(root, /fps=\{30\}/);
  assert.match(root, /width=\{1920\}/);
  assert.match(root, /height=\{1080\}/);
  assert.match(demo, /useCurrentFrame/);
  assert.match(demo, /interpolate/);
  assert.match(demo, /staticFile\("og-interviewlab\.png"\)/);
  assert.match(demo, /@remotion\/google-fonts\/BodoniModa/);
  assert.match(demo, /@remotion\/media/);
  assert.match(demo, /MUSIC_FILE/);
  assert.match(demo, /VOICEOVER_SCENES/);
  assert.match(demo, /Practice the interview/);
  assert.match(demo, /System design/);
  assert.match(demo, /Coding rounds/);
  assert.match(demo, /No API key/);
  assert.doesNotMatch(demo, /@keyframes|transition\s*:/);
  assert.match(audioPlan, /interviewlab-theme\.wav/);
  assert.match(audioPlan, /voiceover\/01-hero\.mp3/);
  assert.match(audioPlan, /Meet InterviewLab/);
  assert.match(audioGenerator, /ELEVENLABS_API_KEY/);
  assert.match(audioGenerator, /eleven_multilingual_v2/);
  assert.match(audioGenerator, /FilePathSource/);
  assert.match(audioGenerator, /--from=/);
  assert.doesNotMatch(audioGenerator, /sk_[A-Za-z0-9_-]{16,}/);
  assert.match(audioNormalizer, /I=-16:TP=-1\.5:LRA=11/);
  assert.match(audioNormalizer, /"-c:v",\s*"copy"/);

  const audioAssets = [
    "public/audio/interviewlab-theme.wav",
    "public/audio/voiceover/01-hero.mp3",
    "public/audio/voiceover/02-overview.mp3",
    "public/audio/voiceover/03-setup.mp3",
    "public/audio/voiceover/04-system-design.mp3",
    "public/audio/voiceover/05-coding.mp3",
    "public/audio/voiceover/06-agents.mp3",
    "public/audio/voiceover/07-final.mp3",
  ];

  for (const asset of audioAssets) {
    const assetStats = await stat(new URL(asset, projectRoot));
    assert.ok(assetStats.size > 1000, `${asset} should contain rendered audio`);
  }
});
