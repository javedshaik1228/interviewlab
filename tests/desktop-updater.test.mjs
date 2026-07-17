import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createUpdateController } from "../desktop/update-controller.mjs";
import { releaseVersionFromTag, synchronizeReleaseVersion } from "../scripts/set-release-version.mjs";

test("drives a manual update from check through restart", async () => {
  const updater = new EventEmitter();
  const states = [];
  let installed = false;
  updater.checkForUpdates = async () => {
    updater.emit("checking-for-update");
    updater.emit("update-available", { version: "1.3.0" });
    updater.emit("download-progress", { percent: 42.6 });
    updater.emit("update-downloaded", { version: "1.3.0" });
  };
  updater.quitAndInstall = (silent, runAfter) => {
    assert.equal(silent, false);
    assert.equal(runAfter, true);
    installed = true;
  };

  const controller = createUpdateController({
    currentVersion: "1.2.0",
    isPackaged: true,
    isPortable: false,
    notify: (status) => states.push(status),
    updater,
  });

  assert.equal(controller.getStatus().phase, "idle");
  assert.equal(updater.autoDownload, true);
  assert.equal(updater.autoInstallOnAppQuit, true);
  await controller.checkForUpdates();
  assert.deepEqual(states.map(({ phase }) => phase), [
    "checking",
    "checking",
    "available",
    "downloading",
    "downloaded",
  ]);
  assert.equal(controller.getStatus().availableVersion, "1.3.0");
  assert.equal(controller.getStatus().progress, 100);
  assert.equal(controller.installUpdate(), true);
  assert.equal(installed, true);
});

test("keeps updater calls out of development and portable builds", async () => {
  for (const options of [
    { isPackaged: false, isPortable: false, phase: "development" },
    { isPackaged: true, isPortable: true, phase: "unsupported" },
  ]) {
    let checks = 0;
    let releaseLinks = 0;
    const updater = new EventEmitter();
    updater.checkForUpdates = async () => { checks += 1; };
    updater.quitAndInstall = () => {};
    const controller = createUpdateController({
      currentVersion: "1.2.0",
      isPackaged: options.isPackaged,
      isPortable: options.isPortable,
      notify: () => {},
      openLatestRelease: async () => { releaseLinks += 1; },
      updater,
    });

    assert.equal(controller.getStatus().phase, options.phase);
    await controller.checkForUpdates();
    assert.equal(checks, 0);
    assert.equal(releaseLinks, options.isPortable ? 1 : 0);
    assert.equal(controller.installUpdate(), false);
  }
});

test("synchronizes package versions from a validated release tag", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "interviewlab-version-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  await mkdir(path.join(root, "desktop"));
  for (const relativePath of ["package.json", "desktop/package.json"]) {
    await writeFile(path.join(root, relativePath), `${JSON.stringify({ name: "interviewlab", version: "0.1.0" }, null, 2)}\n`);
  }
  for (const relativePath of ["package-lock.json", "desktop/package-lock.json"]) {
    await writeFile(path.join(root, relativePath), `${JSON.stringify({
      name: "interviewlab",
      version: "0.1.0",
      packages: { "": { name: "interviewlab", version: "0.1.0" } },
    }, null, 2)}\n`);
  }

  assert.equal(releaseVersionFromTag("v1.4.0-beta.2"), "1.4.0-beta.2");
  assert.throws(() => releaseVersionFromTag("release-latest"), /semantic version tag/);
  await synchronizeReleaseVersion(root, "v1.4.0-beta.2");

  for (const relativePath of ["package.json", "package-lock.json", "desktop/package.json", "desktop/package-lock.json"]) {
    const document = JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
    assert.equal(document.version, "1.4.0-beta.2");
    if (document.packages) assert.equal(document.packages[""].version, "1.4.0-beta.2");
  }
});
