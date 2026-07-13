import { ChevronRight, MessageSquareText } from "lucide-react";

export function ChatDockRail({ label, onRestore }: { label: string; onRestore: () => void }) {
  return (
    <aside className="chat-dock-rail" aria-label={`Docked ${label}`}>
      <button aria-label={`Restore ${label}`} onClick={onRestore} title={`Restore ${label}`} type="button">
        <MessageSquareText size={17} />
        <span>Chat</span>
        <ChevronRight size={14} />
      </button>
    </aside>
  );
}
