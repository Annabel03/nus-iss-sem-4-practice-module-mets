"use client";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function ConversationRail({
  items,
  activeId,
  onNew,
  onPick,
}: {
  items: ConversationItem[];
  activeId: string | null;
  onNew: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-line pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
          Chats
        </p>
        <Button type="button" variant="quiet" size="xs" onClick={onNew} className="gap-1">
          <Icon icon="newChat" size={13} />
          New
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-xs leading-5 text-ink-3">No conversations yet.</p>
      ) : (
        <div className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => onPick(item.id)}
                className={`flex w-full items-center px-2 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-inset font-medium text-ink"
                    : "text-ink-2 hover:bg-hover hover:text-ink"
                }`}
              >
                <span className="truncate">{item.title || "New chat"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
