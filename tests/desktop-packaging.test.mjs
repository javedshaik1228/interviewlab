import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { test } from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

async function availablePort() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  return address.port;
}

test("defines self-contained desktop installers for Windows, macOS, and Linux", async () => {
  const [packageText, launcher, preparer, afterPacker, builderConfig, workflow, readme, gitignore, npmrc] = await Promise.all([
    readFile(path.join(projectRoot, "package.json"), "utf8"),
    readFile(path.join(projectRoot, "desktop/main.mjs"), "utf8"),
    readFile(path.join(projectRoot, "scripts/prepare-desktop.mjs"), "utf8"),
    readFile(path.join(projectRoot, "desktop/after-pack.cjs"), "utf8"),
    readFile(path.join(projectRoot, "electron-builder.yml"), "utf8"),
    readFile(path.join(projectRoot, ".github/workflows/desktop.yml"), "utf8"),
    readFile(path.join(projectRoot, "README.md"), "utf8"),
    readFile(path.join(projectRoot, ".gitignore"), "utf8"),
    readFile(path.join(projectRoot, ".npmrc"), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);

  assert.equal(packageJson.main, "desktop/main.mjs");
  assert.match(packageJson.scripts["desktop:prepare"], /prepare-desktop\.mjs/);
  assert.match(packageJson.scripts["desktop:run"], /electron \./);
  assert.match(packageJson.scripts["desktop:dist"], /electron-builder/);
  assert.match(packageJson.devDependencies.electron, /^43\./);
  assert.match(packageJson.devDependencies["electron-builder"], /^26\./);

  assert.match(launcher, /ELECTRON_RUN_AS_NODE/);
  assert.match(launcher, /INTERVIEWLAB_PORT/);
  assert.match(launcher, /INTERVIEWLAB_SMOKE_TEST/);
  assert.match(launcher, /127\.0\.0\.1/);
  assert.match(launcher, /\/api\/health/);
  assert.match(launcher, /nodeIntegration:\s*false/);
  assert.match(launcher, /contextIsolation:\s*true/);
  assert.match(launcher, /sandbox:\s*true/);
  assert.match(launcher, /setWindowOpenHandler/);
  assert.match(preparer, /path\.join\(projectRoot, "\.next", "static"\)/);
  assert.match(preparer, /public/);
  assert.match(afterPacker, /getResourcesDir/);
  assert.match(afterPacker, /node_modules/);
  assert.match(afterPacker, /"next",\s*"package\.json"/);

  assert.match(builderConfig, /target:\s*nsis/);
  assert.match(builderConfig, /target:\s*portable/);
  assert.match(builderConfig, /target:\s*dmg/);
  assert.match(builderConfig, /target:\s*zip/);
  assert.match(builderConfig, /target:\s*AppImage/);
  assert.match(builderConfig, /target:\s*deb/);
  assert.match(builderConfig, /afterPack:\s*desktop\/after-pack\.cjs/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /macos-15-intel/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /\.npmrc/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /dist-desktop\/\*\.exe/);
  assert.match(workflow, /dist-desktop\/\*\.dmg/);
  assert.match(workflow, /dist-desktop\/\*\.AppImage/);
  assert.doesNotMatch(workflow, /^\s*path:\s*dist-desktop\/\*\s*$/m);
  assert.match(workflow, /gh release create/);
  assert.match(readme, /Desktop executables/);
  assert.match(readme, /Windows.*macOS.*Linux/is);
  assert.match(gitignore, /dist-desktop/);
  assert.match(npmrc, /^legacy-peer-deps=true\s*$/m);
});

test("the prepared standalone runtime serves the local desktop application", async (t) => {
  const standaloneRoot = path.join(projectRoot, ".next", "standalone");
  const serverPath = path.join(standaloneRoot, "server.js");
  await Promise.all([
    access(serverPath),
    access(path.join(standaloneRoot, ".next", "static")),
    access(path.join(standaloneRoot, "public", "og-interviewlab.png")),
  ]);

  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  let output = "";
  const child = spawn(process.execPath, [serverPath], {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      PORT: String(port),
      SITE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  t.after(async () => {
    if (child.exitCode !== null) return;
    child.kill();
    await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 5000))]);
  });

  let healthy = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Standalone server exited early.\n${output}`);
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) {
        healthy = true;
        break;
      }
    } catch {
      // The embedded server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.equal(healthy, true, `Standalone server did not become healthy.\n${output}`);

  const [page, image] = await Promise.all([
    fetch(origin),
    fetch(`${origin}/og-interviewlab.png`),
  ]);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /InterviewLab/);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type") ?? "", /^image\/png/i);
});
