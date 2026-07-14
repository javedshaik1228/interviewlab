"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";

type ExcalidrawComponent = typeof import("@excalidraw/excalidraw").Excalidraw;

export type BoardSignals = {
  shapes: number;
  connections: number;
  labels: string[];
  stores: number;
  asyncComponents: number;
};

type DiagramElement = {
  type: string;
  isDeleted?: boolean;
  text?: string;
};

export function DiagramBoard({ onSignals }: { onSignals: (signals: BoardSignals) => void }) {
  const [Excalidraw, setExcalidraw] = useState<ExcalidrawComponent | null>(null);
  const lastSignalFingerprint = useRef("");

  useEffect(() => {
    let active = true;
    import("@excalidraw/excalidraw").then((module) => {
      if (active) setExcalidraw(() => module.Excalidraw);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = useCallback(
    (rawElements: readonly DiagramElement[]) => {
      const elements = rawElements.filter((element) => !element.isDeleted);
      const labels = elements
        .filter((element) => element.type === "text" && element.text)
        .map((element) => element.text?.trim() ?? "")
        .filter(Boolean);
      const labelText = labels.join(" ").toLowerCase();

      const nextSignals: BoardSignals = {
        shapes: elements.filter((element) => !["arrow", "line", "text", "freedraw"].includes(element.type)).length,
        connections: elements.filter((element) => element.type === "arrow" || element.type === "line").length,
        labels: labels.slice(0, 24),
        stores: (labelText.match(/db|database|store|redis|cache|sql|dynamo|kafka|queue/g) ?? []).length,
        asyncComponents: (labelText.match(/queue|event|stream|kafka|worker|async|pub.?sub/g) ?? []).length,
      };
      const fingerprint = JSON.stringify(nextSignals);

      // Excalidraw emits onChange after every internal app-state update, not
      // only after the scene changes. Avoid feeding identical analytics back
      // into the parent and triggering an editor update loop.
      if (fingerprint === lastSignalFingerprint.current) return;
      lastSignalFingerprint.current = fingerprint;
      onSignals(nextSignals);
    },
    [onSignals],
  );

  return (
    <div className="excalidraw-shell" data-testid="architecture-canvas">
      {Excalidraw ? (
        <Excalidraw
          onChange={(elements) => handleChange(elements as readonly DiagramElement[])}
          theme="light"
          name="InterviewLab system design"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveAsImage: true,
              toggleTheme: false,
            },
          }}
        />
      ) : (
        <div className="canvas-loading" role="status">
          <span className="canvas-loading-mark">IR</span>
          <span>Preparing your architecture canvas…</span>
        </div>
      )}
    </div>
  );
}
