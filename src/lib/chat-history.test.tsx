import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownBody } from "@/components/markdown-body";
import { toUiMessages, type ChatHistoryItem } from "./chat-history";
import { listConversationMessages } from "./conversations";
import { getRecentChats, rememberTurn } from "./memory";
import type { MetsUIMessage } from "./ui-types";

const markdown = "## Forces\n\nFirst paragraph.\n\nSecond paragraph.\n\n- Weight downwards\n- Normal force upwards\n\n$$F = ma$$";
const message: MetsUIMessage = {
  id: "physics-response",
  role: "assistant",
  parts: [
    { type: "data-routing", data: {
      agent: "physics", subject: "physics", intent: "teaching", gradeLevel: "secondary",
      rationale: "A forces question", confidence: 1, promptVersion: "test",
    } },
    { type: "text", text: markdown },
    { type: "tool-drawPhysicsDiagram", toolCallId: "diagram-1", state: "output-available",
      input: { kind: "free-body" }, output: { kind: "free-body", forces: [] } },
    { type: "text", text: "The forces balance.\n\nThere is no acceleration." },
  ],
};

test("saved messages round-trip through persistence with Markdown, routing and diagrams intact", async () => {
  const envNames = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "OPENAI_API_KEY"];
  const previous = envNames.map((name) => process.env[name]);
  const originalFetch = globalThis.fetch;
  const rows: Record<string, unknown>[] = [];
  process.env.SUPABASE_URL = "https://history-test.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_history_test";
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.OPENAI_API_KEY;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "history-test.invalid");
    if (url.pathname.endsWith("/conversations")) {
      if (init?.method === "PATCH") return new Response(null, { status: 204 });
      return Response.json({ id: "conversation-1", title: "Forces" });
    }
    assert.ok(url.pathname.endsWith("/chat_memory"));
    assert.equal(url.searchParams.get("session_id") ?? "eq.conversation-1", "eq.conversation-1");
    if (init?.method === "POST") {
      rows.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 201 });
    }
    const select = url.searchParams.get("select") ?? "";
    const ordered = url.searchParams.get("order") === "at.desc" ? rows.slice().reverse() : rows;
    return Response.json(ordered.map((row) => Object.fromEntries(
      select.split(",").map((column) => [column, row[column]]),
    )));
  };
  try {
    await rememberTurn("conversation-1", {
      role: "user", text: "Draw the forces.\n\nExplain them.", at: "2026-10-16T00:00:00Z",
    }, undefined, "student-1");
    await rememberTurn("conversation-1", {
      role: "assistant", text: markdown, agent: "physics", at: "2026-10-16T00:00:01Z", uiMessage: message,
    }, undefined, "student-1");
    const history = await listConversationMessages("conversation-1", "student-1");
    const restored = toUiMessages(JSON.parse(JSON.stringify(history)));
    assert.equal(restored[0].parts[0].type, "text");
    assert.deepEqual(restored[0].parts[0], { type: "text", text: rows[0].text });
    assert.deepEqual(restored[1], message);
    assert.equal(rows[1].text, markdown);
    const html = renderToStaticMarkup(createElement(MarkdownBody, { text: markdown }));
    const restoredText = restored[1].parts.find((part) => part.type === "text");
    assert.equal(renderToStaticMarkup(createElement(MarkdownBody, { text: restoredText!.text })), html);
    assert.match(html, /<h2>Forces<\/h2>/);
    assert.match(html, /<p>Second paragraph\.<\/p>/);
    assert.match(html, /<ul>/);
    assert.match(html, /katex/);
    const context = await getRecentChats("conversation-1");
    assert.equal(context[1].text, markdown);
    assert.equal("uiMessage" in context[1], false);
  } finally {
    globalThis.fetch = originalFetch;
    envNames.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
});

test("legacy text-only history remains readable without inventing missing diagrams", () => {
  const legacy: ChatHistoryItem = {
    role: "assistant", text: "An older saved reply", agent: "physics", at: "2026-10-01T00:00:00Z",
    uiMessage: null,
  };
  assert.deepEqual(toUiMessages([legacy])[0].parts, [{ type: "text", text: legacy.text }]);
});
