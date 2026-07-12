"use client";

import {
  Fragment,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";

type TunnelEntry = {
  id: symbol;
  node: ReactNode;
};

const emptySnapshot: ReactNode[] = [];

/**
 * React 19-safe replacement for tunnel-rat.
 *
 * Excalidraw uses tunnels to move menu items into its layer UI. The published
 * tunnel-rat package subscribes every input to a shared version counter; with
 * React 19.2 that can create an update loop before the editor mounts. This
 * implementation keeps inputs write-only and exposes one cached snapshot to
 * the output, which is the contract Excalidraw needs.
 */
export default function tunnel() {
  let entries: TunnelEntry[] = [];
  let snapshot: ReactNode[] = emptySnapshot;
  const listeners = new Set<() => void>();

  const publish = () => {
    snapshot = entries.map((entry) => entry.node);
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  function In({ children }: { children?: ReactNode }) {
    const entry = useRef<TunnelEntry>({
      id: Symbol("excalidraw-tunnel"),
      node: children,
    });

    useLayoutEffect(() => {
      const registeredEntry = entry.current;
      entries = [...entries, registeredEntry];
      publish();

      return () => {
        entries = entries.filter((candidate) => candidate.id !== registeredEntry.id);
        publish();
      };
      // Tunnel inputs are registration points. Re-registering whenever their
      // ReactNode identity changes recreates the React 19 update loop.
    }, []);

    return null;
  }

  function Out() {
    const nodes = useSyncExternalStore(
      subscribe,
      () => snapshot,
      () => emptySnapshot,
    );

    return <Fragment>{nodes}</Fragment>;
  }

  return { In, Out };
}
