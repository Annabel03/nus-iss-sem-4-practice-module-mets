-- Preserve the streamed UI message, including Markdown, routing and tool outputs.
-- Existing text-only history remains readable; discarded data cannot be recovered.
alter table public.chat_memory
  add column if not exists ui_message jsonb;
