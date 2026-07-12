"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((module) => module.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="canvas-loading" role="status">
        <span className="canvas-loading-mark">AR</span>
        <span>Preparing your architecture canvas…</span>
      </div>
    ),
  },
);

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
  const handleChange = useCallback(
    (rawElements: readonly DiagramElement[]) => {
      const elements = rawElements.filter((element) => !element.isDeleted);
      const labels = elements
        .filter((element) => element.type === "text" && element.text)
        .map((element) => element.text?.trim() ?? "")
        .filter(Boolean);
      const labelText = labels.join(" ").toLowerCase();

      onSignals({
        shapes: elements.filter((element) => !["arrow", "line", "text", "freedraw"].includes(element.type)).length,
        connections: elements.filter((element) => element.type === "arrow" || element.type === "line").length,
        labels: labels.slice(0, 24),
        stores: (labelText.match(/db|database|store|redis|cache|sql|dynamo|kafka|queue/g) ?? []).length,
        asyncComponents: (labelText.match(/queue|event|stream|kafka|worker|async|pub.?sub/g) ?? []).length,
      });
    },
    [onSignals],
  );

  return (
    <div className="excalidraw-shell" data-testid="architecture-canvas">
      <Excalidraw
        onChange={(elements) => handleChange(elements as readonly DiagramElement[])}
        theme="light"
        name="ArchRoom system design"
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
    </div>
  );
}
