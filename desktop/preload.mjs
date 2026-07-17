import { contextBridge, ipcRenderer } from "electron";

const channels = {
  check: "interviewlab:update:check",
  getStatus: "interviewlab:update:get-status",
  install: "interviewlab:update:install",
  status: "interviewlab:update:status",
};

contextBridge.exposeInMainWorld("interviewLabDesktop", Object.freeze({
  checkForUpdates: () => ipcRenderer.invoke(channels.check),
  getUpdateStatus: () => ipcRenderer.invoke(channels.getStatus),
  installUpdate: () => ipcRenderer.invoke(channels.install),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on(channels.status, listener);
    return () => ipcRenderer.removeListener(channels.status, listener);
  },
}));
