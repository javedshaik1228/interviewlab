export type DesktopUpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "up-to-date"
  | "error"
  | "development"
  | "unsupported";

export type DesktopUpdateStatus = {
  phase: DesktopUpdatePhase;
  currentVersion: string;
  availableVersion: string | null;
  progress: number | null;
  message: string;
};

export interface DesktopUpdateBridge {
  checkForUpdates: () => Promise<DesktopUpdateStatus>;
  getUpdateStatus: () => Promise<DesktopUpdateStatus>;
  installUpdate: () => Promise<boolean>;
  openNeetCodeWorkspace: (url: string) => Promise<boolean>;
  onUpdateStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void;
}

declare global {
  interface Window {
    interviewLabDesktop?: DesktopUpdateBridge;
  }
}
