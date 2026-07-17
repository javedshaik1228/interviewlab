/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

const channels = {
  check: "interviewlab:update:check",
  getStatus: "interviewlab:update:get-status",
  install: "interviewlab:update:install",
  status: "interviewlab:update:status",
  openNeetCode: "interviewlab:neetcode:open",
};

contextBridge.exposeInMainWorld("interviewLabDesktop", Object.freeze({
  checkForUpdates: () => ipcRenderer.invoke(channels.check),
  getUpdateStatus: () => ipcRenderer.invoke(channels.getStatus),
  installUpdate: () => ipcRenderer.invoke(channels.install),
  openNeetCodeWorkspace: (url) => ipcRenderer.invoke(channels.openNeetCode, url),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on(channels.status, listener);
    return () => ipcRenderer.removeListener(channels.status, listener);
  },
}));
