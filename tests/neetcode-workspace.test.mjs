import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import {
  createNeetCodeWorkspaceController,
  installEmbeddedNeetCodeAuthHandler,
  isEmbeddedNeetCodeAuthRequest,
  isSecureWorkspaceNavigation,
  NEETCODE_PARTITION,
  normalizeNeetCodeUrl,
} from "../desktop/neetcode-workspace.mjs";

class FakeWebContents extends EventEmitter {
  currentUrl = "";
  openHandler = null;

  getURL() {
    return this.currentUrl;
  }

  setWindowOpenHandler(handler) {
    this.openHandler = handler;
  }
}

class FakeWindow extends EventEmitter {
  static instances = [];

  constructor(options) {
    super();
    this.options = options;
    this.webContents = new FakeWebContents();
    this.destroyed = false;
    this.focused = false;
    this.shown = false;
    FakeWindow.instances.push(this);
  }

  focus() {
    this.focused = true;
  }

  isDestroyed() {
    return this.destroyed;
  }

  async loadURL(url) {
    this.webContents.currentUrl = url;
  }

  show() {
    this.shown = true;
  }
}

test("accepts only official NeetCode workspace URLs from InterviewLab", () => {
  assert.equal(
    normalizeNeetCodeUrl("https://neetcode.io/problems/two-integer-sum/question?list=neetcode150"),
    "https://neetcode.io/problems/two-integer-sum/question?list=neetcode150",
  );
  assert.equal(normalizeNeetCodeUrl("https://www.neetcode.io/problems/two-integer-sum"), null);
  assert.equal(normalizeNeetCodeUrl("https://neetcode.io.evil.example/problems/two-integer-sum"), null);
  assert.equal(normalizeNeetCodeUrl("javascript:alert(1)"), null);
  assert.equal(isSecureWorkspaceNavigation("https://accounts.google.com/o/oauth2/v2/auth"), true);
  assert.equal(isSecureWorkspaceNavigation("https://github.com/login/oauth/authorize"), true);
  assert.equal(isSecureWorkspaceNavigation("about:blank"), true);
  assert.equal(isSecureWorkspaceNavigation("https://neetcode.io.evil.example/phishing"), false);
  assert.equal(isSecureWorkspaceNavigation("https://example.com/phishing"), false);
  assert.equal(isSecureWorkspaceNavigation("file:///etc/passwd"), false);
});

test("recognizes only trusted embedded NeetCode authentication popups", () => {
  const neetcodeReferrer = { url: "https://neetcode.io/problems/two-integer-sum/question" };

  assert.equal(isEmbeddedNeetCodeAuthRequest({
    url: "https://neetcode.io/__/auth/handler?providerId=google.com",
    referrer: { url: "" },
  }), true);
  assert.equal(isEmbeddedNeetCodeAuthRequest({
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    referrer: neetcodeReferrer,
  }), true);
  assert.equal(isEmbeddedNeetCodeAuthRequest({
    url: "https://github.com/login/oauth/authorize",
    referrer: neetcodeReferrer,
  }), true);
  assert.equal(isEmbeddedNeetCodeAuthRequest({
    url: "https://example.com/phishing",
    referrer: neetcodeReferrer,
  }), false);
  assert.equal(isEmbeddedNeetCodeAuthRequest({
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    referrer: { url: "https://interviewlab.example" },
  }), false);
});

test("keeps embedded NeetCode OAuth inside a secure same-session child window", () => {
  const mainWindow = new FakeWindow({});
  const openedExternally = [];
  installEmbeddedNeetCodeAuthHandler({
    icon: "icon.png",
    openExternal: (url) => openedExternally.push(url),
    window: mainWindow,
  });

  const authPopup = mainWindow.webContents.openHandler({
    referrer: { url: "https://neetcode.io/problems/two-integer-sum/question" },
    url: "https://neetcode.io/__/auth/handler?providerId=google.com",
  });
  assert.equal(authPopup.action, "allow");
  assert.equal(authPopup.overrideBrowserWindowOptions.parent, mainWindow);
  assert.equal(authPopup.overrideBrowserWindowOptions.webPreferences.partition, undefined);
  assert.equal(authPopup.overrideBrowserWindowOptions.webPreferences.nodeIntegration, false);
  assert.equal(authPopup.outlivesOpener, false);

  const externalPopup = mainWindow.webContents.openHandler({
    referrer: { url: "https://interviewlab.example" },
    url: "https://example.com/docs",
  });
  assert.deepEqual(externalPopup, { action: "deny" });
  assert.deepEqual(openedExternally, ["https://example.com/docs"]);

  const childWindow = new FakeWindow({});
  mainWindow.webContents.emit("did-create-window", childWindow);
  assert.equal(
    childWindow.webContents.openHandler({ url: "https://accounts.google.com/o/oauth2/v2/auth" }).action,
    "allow",
  );

  let prevented = false;
  childWindow.webContents.emit(
    "will-redirect",
    { preventDefault: () => { prevented = true; } },
    "https://example.com/phishing",
  );
  assert.equal(prevented, true);
});

test("opens a persistent, sandboxed NeetCode window and reuses it", async () => {
  FakeWindow.instances = [];
  let permissionHandler = null;
  const parentWindow = { id: 7 };
  const controller = createNeetCodeWorkspaceController({
    BrowserWindow: FakeWindow,
    getParentWindow: () => parentWindow,
    getSession: (partition) => {
      assert.equal(partition, NEETCODE_PARTITION);
      return {
        setPermissionRequestHandler(handler) {
          permissionHandler = handler;
        },
      };
    },
    icon: "icon.png",
  });

  assert.equal(await controller.open("https://example.com/not-neetcode"), false);
  assert.equal(await controller.open("https://neetcode.io/problems/two-integer-sum/question"), true);
  assert.equal(FakeWindow.instances.length, 1);

  const workspace = FakeWindow.instances[0];
  assert.equal(workspace.options.parent, parentWindow);
  assert.equal(workspace.options.webPreferences.partition, NEETCODE_PARTITION);
  assert.equal(workspace.options.webPreferences.nodeIntegration, false);
  assert.equal(workspace.options.webPreferences.contextIsolation, true);
  assert.equal(workspace.options.webPreferences.sandbox, true);
  assert.equal(workspace.webContents.getURL(), "https://neetcode.io/problems/two-integer-sum/question");

  let permissionAllowed = true;
  permissionHandler(null, "notifications", (allowed) => { permissionAllowed = allowed; });
  assert.equal(permissionAllowed, false);

  assert.deepEqual(workspace.webContents.openHandler({ url: "file:///tmp/secret" }), { action: "deny" });
  const authPopup = workspace.webContents.openHandler({ url: "https://accounts.google.com/o/oauth2/v2/auth" });
  assert.equal(authPopup.action, "allow");
  assert.equal(authPopup.overrideBrowserWindowOptions.webPreferences.partition, NEETCODE_PARTITION);
  assert.equal(authPopup.overrideBrowserWindowOptions.webPreferences.nodeIntegration, false);

  let prevented = false;
  workspace.webContents.emit("will-navigate", { preventDefault: () => { prevented = true; } }, "file:///tmp/secret");
  assert.equal(prevented, true);

  let redirectPrevented = false;
  workspace.webContents.emit(
    "will-redirect",
    { preventDefault: () => { redirectPrevented = true; } },
    "https://example.com/phishing",
  );
  assert.equal(redirectPrevented, true);

  assert.equal(await controller.open("https://neetcode.io/problems/is-anagram/question"), true);
  assert.equal(FakeWindow.instances.length, 1);
  assert.equal(workspace.webContents.getURL(), "https://neetcode.io/problems/is-anagram/question");
  assert.equal(workspace.shown, true);
  assert.equal(workspace.focused, true);
});
