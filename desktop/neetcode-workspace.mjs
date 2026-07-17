export const NEETCODE_PARTITION = "persist:interviewlab-neetcode";

const WORKSPACE_NAVIGATION_HOSTS = new Set([
  "accounts.google.com",
  "github.com",
  "neetcode.io",
]);

export function normalizeNeetCodeUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.origin !== "https://neetcode.io") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function isSecureWorkspaceNavigation(value) {
  if (value === "about:blank") return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && WORKSPACE_NAVIGATION_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function secureWebPreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    partition: NEETCODE_PARTITION,
    sandbox: true,
    webSecurity: true,
  };
}

function secureWindowOptions({ icon, parent }) {
  return {
    autoHideMenuBar: true,
    backgroundColor: "#101c1b",
    height: 900,
    icon,
    minHeight: 680,
    minWidth: 960,
    parent,
    title: "NeetCode Workspace - InterviewLab",
    webPreferences: secureWebPreferences(),
    width: 1280,
  };
}

function protectWorkspaceWindow(window, options) {
  const { webContents } = window;
  const blockUntrustedNavigation = (event, url) => {
    if (isSecureWorkspaceNavigation(url)) return;
    event.preventDefault();
  };
  webContents.on("will-navigate", blockUntrustedNavigation);
  webContents.on("will-redirect", blockUntrustedNavigation);
  webContents.setWindowOpenHandler(({ url }) => {
    if (!isSecureWorkspaceNavigation(url)) return { action: "deny" };
    return {
      action: "allow",
      outlivesOpener: false,
      overrideBrowserWindowOptions: secureWindowOptions({
        ...options,
        parent: window,
      }),
    };
  });
  webContents.on("did-create-window", (childWindow) => {
    protectWorkspaceWindow(childWindow, options);
  });
}

export function createNeetCodeWorkspaceController({
  BrowserWindow,
  getParentWindow,
  getSession,
  icon,
}) {
  let workspaceWindow = null;
  const workspaceSession = getSession(NEETCODE_PARTITION);
  workspaceSession.setPermissionCheckHandler?.(() => false);
  workspaceSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  return {
    async open(value) {
      const url = normalizeNeetCodeUrl(value);
      if (!url) return false;

      if (!workspaceWindow || workspaceWindow.isDestroyed()) {
        workspaceWindow = new BrowserWindow(secureWindowOptions({
          icon,
          parent: getParentWindow() ?? undefined,
        }));
        protectWorkspaceWindow(workspaceWindow, { icon });
        workspaceWindow.on("closed", () => {
          workspaceWindow = null;
        });
      }

      if (workspaceWindow.webContents.getURL() !== url) {
        await workspaceWindow.loadURL(url);
      }
      workspaceWindow.show();
      workspaceWindow.focus();
      return true;
    },
  };
}
