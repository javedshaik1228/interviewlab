"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { DesktopUpdateBridge, DesktopUpdateStatus } from "../lib/desktop-update";

function buttonLabel(status: DesktopUpdateStatus) {
  switch (status.phase) {
    case "checking": return "Checking…";
    case "available": return `Update ${status.availableVersion ?? "found"}`;
    case "downloading": return `Downloading ${status.progress ?? 0}%`;
    case "downloaded": return "Restart to update";
    case "up-to-date": return "Up to date";
    case "error": return "Retry update";
    case "development": return "Updates in installed app";
    case "unsupported": return "Get latest release";
    default: return "Check for updates";
  }
}

export function DesktopUpdateControl({ compact = false }: { compact?: boolean }) {
  const bridge: DesktopUpdateBridge | null = typeof window === "undefined"
    ? null
    : window.interviewLabDesktop ?? null;
  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null);

  useEffect(() => {
    if (!bridge) return;
    let active = true;
    bridge.getUpdateStatus().then((nextStatus) => {
      if (active) setStatus(nextStatus);
    });
    const unsubscribe = bridge.onUpdateStatus((nextStatus) => {
      if (active) setStatus(nextStatus);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [bridge]);

  if (!bridge || !status) return null;
  const busy = ["checking", "available", "downloading"].includes(status.phase);
  const unavailable = status.phase === "development";
  const installReady = status.phase === "downloaded";

  const handleClick = () => {
    if (installReady) void bridge.installUpdate();
    else void bridge.checkForUpdates();
  };

  return (
    <button
      aria-label={buttonLabel(status)}
      className={`desktop-update-button ${compact ? "compact" : ""} phase-${status.phase}`}
      disabled={busy || unavailable}
      onClick={handleClick}
      title={status.message}
      type="button"
    >
      <RefreshCw aria-hidden="true" className={busy ? "spinning" : ""} size={14} />
      <span aria-live="polite">{buttonLabel(status)}</span>
      {!compact && <small>v{status.currentVersion}</small>}
    </button>
  );
}
