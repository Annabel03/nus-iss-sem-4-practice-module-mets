import type { ChatMemoryItem } from "@/agents/_shared/types";
import type { MetsUIMessage } from "./ui-types";

/** Rich display history is separate from the plain-text context sent to tutors. */
export type ChatHistoryItem = ChatMemoryItem & {
  uiMessage?: MetsUIMessage | null;
};

export function toUiMessages(items: ChatHistoryItem[]): MetsUIMessage[] {
  return items.map((item, index) => {
    if (item.uiMessage) return item.uiMessage;
    return {
      id: `history-${item.at}-${index}`,
      role: item.role,
      parts: [{ type: "text", text: item.text }],
    };
  });
}
