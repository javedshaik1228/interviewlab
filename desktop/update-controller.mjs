function errorMessage(error) {
  const message = error instanceof Error ? error.message : "The update check failed.";
  return message.replace(/[\r\n]+/g, " ").trim().slice(0, 240) || "The update check failed.";
}

function normalizedProgress(value) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createUpdateController({
  currentVersion,
  isPackaged,
  isPortable,
  notify,
  openLatestRelease = () => {},
  updater,
}) {
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.allowPrerelease = currentVersion.includes("-");

  let activeCheck = null;
  let status = !isPackaged
    ? {
        phase: "development",
        currentVersion,
        availableVersion: null,
        progress: null,
        message: "Update checks are available in installed InterviewLab builds.",
      }
    : isPortable
      ? {
          phase: "unsupported",
          currentVersion,
          availableVersion: null,
          progress: null,
          message: "Portable Windows builds are updated by downloading the latest release.",
        }
      : {
          phase: "idle",
          currentVersion,
          availableVersion: null,
          progress: null,
          message: `InterviewLab ${currentVersion}`,
        };

  const publish = (next) => {
    status = { ...status, ...next, currentVersion };
    notify({ ...status });
    return { ...status };
  };

  updater.on("checking-for-update", () => publish({
    phase: "checking",
    availableVersion: null,
    progress: null,
    message: "Checking GitHub Releases for a newer version…",
  }));
  updater.on("update-available", (info) => publish({
    phase: "available",
    availableVersion: info.version,
    progress: 0,
    message: `InterviewLab ${info.version} is available and will download now.`,
  }));
  updater.on("download-progress", (progress) => publish({
    phase: "downloading",
    progress: normalizedProgress(progress.percent),
    message: `Downloading InterviewLab ${status.availableVersion ?? "update"}…`,
  }));
  updater.on("update-downloaded", (info) => publish({
    phase: "downloaded",
    availableVersion: info.version,
    progress: 100,
    message: `InterviewLab ${info.version} is ready. Restart to finish the update.`,
  }));
  updater.on("update-not-available", () => publish({
    phase: "up-to-date",
    availableVersion: null,
    progress: null,
    message: `InterviewLab ${currentVersion} is the latest version.`,
  }));
  updater.on("error", (error) => publish({
    phase: "error",
    progress: null,
    message: errorMessage(error),
  }));

  return {
    getStatus() {
      return { ...status };
    },
    async checkForUpdates() {
      if (!isPackaged) return { ...status };
      if (isPortable) {
        await openLatestRelease();
        return { ...status };
      }
      if (activeCheck) return activeCheck;

      publish({
        phase: "checking",
        availableVersion: null,
        progress: null,
        message: "Checking GitHub Releases for a newer version…",
      });
      activeCheck = Promise.resolve(updater.checkForUpdates())
        .catch((error) => publish({ phase: "error", progress: null, message: errorMessage(error) }))
        .then(() => ({ ...status }))
        .finally(() => { activeCheck = null; });
      return activeCheck;
    },
    installUpdate() {
      if (status.phase !== "downloaded") return false;
      updater.quitAndInstall(false, true);
      return true;
    },
  };
}
