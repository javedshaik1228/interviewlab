import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, session, shell } from "electron";

const appId = "io.github.javedshaik1228.interviewlab";
const desktopIcon = fileURLToPath(new URL("./build/icon.png", import.meta.url));
const loopbackHost = "127.0.0.1";
const smokeTest = process.env.INTERVIEWLAB_SMOKE_TEST === "1";
let appOrigin = "";
let mainWindow = null;
let serverProcess = null;
let shuttingDown = false;

function standaloneRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(app.getAppPath(), ".next", "standalone");
}

async function availablePort() {
  const probe = createServer();
  return new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, loopbackHost, () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Could not allocate a local port."));
        return;
      }
      probe.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

function configuredPort() {
  const value = process.env.INTERVIEWLAB_PORT;
  if (!value) return null;
  const port = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("INTERVIEWLAB_PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  serverProcess.kill();
  serverProcess = null;
}

async function waitForServer(origin) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (serverProcess?.exitCode !== null) {
      throw new Error(`The embedded server exited with code ${serverProcess?.exitCode ?? "unknown"}.`);
    }
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // The local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("The embedded server did not become ready within 30 seconds.");
}

async function startServer() {
  const port = configuredPort() ?? await availablePort();
  appOrigin = `http://${loopbackHost}:${port}`;
  const root = standaloneRoot();
  serverProcess = spawn(process.execPath, [path.join(root, "server.js")], {
    cwd: root,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: loopbackHost,
      INTERVIEWLAB_DESKTOP: "1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      PORT: String(port),
      SITE_URL: appOrigin,
    },
    stdio: app.isPackaged ? "ignore" : "inherit",
    windowsHide: true,
  });
  serverProcess.once("exit", (code) => {
    if (shuttingDown) return;
    dialog.showErrorBox(
      "InterviewLab stopped",
      `The local InterviewLab server exited unexpectedly (${code ?? "unknown"}).`,
    );
    app.quit();
  });
  await waitForServer(appOrigin);
}

function openExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") void shell.openExternal(parsed.href);
  } catch {
    // Ignore malformed navigation requests.
  }
}

function isAppUrl(url) {
  try {
    return new URL(url).origin === appOrigin;
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 960,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f3f1e9",
    icon: desktopIcon,
    title: "InterviewLab",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    openExternal(url);
  });
  mainWindow.once("ready-to-show", () => {
    if (!smokeTest) mainWindow?.show();
  });
  mainWindow.webContents.once("did-finish-load", () => {
    if (smokeTest) setTimeout(() => app.quit(), 5000);
  });
  mainWindow.on("closed", () => { mainWindow = null; });
  void mainWindow.loadURL(appOrigin);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setAppUserModelId(appId);
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    try {
      await startServer();
      createWindow();
    } catch (error) {
      const message = error instanceof Error ? error.message : "The local server could not start.";
      dialog.showErrorBox("InterviewLab could not start", message);
      app.quit();
    }
  });

  app.on("activate", () => {
    if (!mainWindow && appOrigin) createWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("before-quit", () => {
    shuttingDown = true;
    stopServer();
  });
}
