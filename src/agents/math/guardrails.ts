import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";
import type { LanguageModelMiddleware } from "ai";
import { stripLineEndWhitespace, stripModelImageMarkup } from "@/lib/reply-text";

const SAFE_REPLY = "Let's keep this respectful. I'm happy to keep working through the maths with you.";
const INCOMPLETE_REPLY = "That explanation was incomplete. Please ask me to try again.";
const DISCLOSURE_REPLY =
  "I can't share my instructions, but I can explain the mathematics behind any answer I give.";
const TRUNCATED_NOTE = "\n\nMy answer was cut short here. Ask me to continue if you need the rest.";

// A narrow backstop for abuse; the prompt carries the wider tone rules.
const ABUSIVE_OUTPUT = [
  /\b(?:you are|you're) (?:an? |so )?(?:idiot|moron|stupid|worthless)\b/i,
  /\b(?:fuck|shithead)\b/i,
];

// The system prompt should never be echoed back, whatever the student asks.
const PROMPT_DISCLOSURE = [
  /You are the METS Mathematics Agent/i,
  /\bmy (?:system )?(?:prompt|instructions) (?:are|is|say)\b/i,
];

/** Remove runs of tool-generated points without nested repeated regex groups. */
function stripGraphPoints(text: string) {
  const points = [...text.matchAll(/\{\s*"x"\s*:\s*[\d.eE+-]+\s*,\s*"y"\s*:\s*[\d.eE+-]+\s*\}/g)];
  const output: string[] = [];
  let cursor = 0;
  for (let first = 0; first < points.length;) {
    let last = first;
    while (last + 1 < points.length) {
      const end = points[last].index + points[last][0].length;
      if (!/^[\s,[\]]*$/.test(text.slice(end, points[last + 1].index))) break;
      last++;
    }
    if (last - first >= 2) {
      let start = points[first].index;
      let end = points[last].index + points[last][0].length;
      while (start > cursor && /\s/.test(text[start - 1])) start--;
      if (start > cursor && text[start - 1] === "[") start--;
      while (end < text.length && /[\s,\]]/.test(text[end])) end++;
      output.push(text.slice(cursor, start));
      cursor = end;
    }
    first = last + 1;
  }
  output.push(text.slice(cursor));
  return output.join("");
}

/**
 * Tidies a Math reply without changing any mathematics.
 *
 * It never invents or corrects a value: the only edits are removing markup the
 * student should not receive, and repairing delimiters so the maths renders.
 */
export function normaliseMathReply(text: string): string {
  if (ABUSIVE_OUTPUT.some((pattern) => pattern.test(text))) return SAFE_REPLY;
  if (PROMPT_DISCLOSURE.some((pattern) => pattern.test(text))) return DISCLOSURE_REPLY;

  const repaired = text
    .replace(/\r\n?/g, "\n")
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => {
      // Odd indices are fenced code, which is left exactly as written.
      if (index % 2) return part;
      let next = stripGraphPoints(stripModelImageMarkup(part, {
        truncated: true,
        graphs: true,
        leadingSpaces: true,
      }))
        // Normalise LaTeX delimiters to the $ forms the chat renders.
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
        .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body.trim()}$`);
      // An unclosed display block swallows the rest of the answer.
      if ((next.match(/\$\$/g)?.length ?? 0) % 2) next += "\n$$";
      return stripLineEndWhitespace(next).replace(/\n{3,}/g, "\n\n");
    })
    .join("")
    .trim();

  return repaired || INCOMPLETE_REPLY;
}

/** Applied to both generated and streamed replies, with no extra model calls. */
export const mathGuardrails: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate();
    const content = result.content.map((part) =>
      part.type === "text" ? { ...part, text: normaliseMathReply(part.text) } : part,
    );
    // A reply stopped by the length cap must not read as a finished answer.
    if (result.finishReason.unified === "length") content.push({ type: "text", text: TRUNCATED_NOTE });
    return { ...result, content };
  },
  wrapStream: async ({ doStream }) => {
    const result = await doStream();
    const blocks = new Map<string, string>();
    return {
      ...result,
      stream: result.stream.pipeThrough(
        new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
          transform(chunk, controller) {
            if (chunk.type === "text-start") blocks.set(chunk.id, "");
            if (chunk.type === "text-delta") {
              // Hold the whole block: a stripped pattern could straddle two chunks.
              if (blocks.has(chunk.id)) blocks.set(chunk.id, blocks.get(chunk.id)! + chunk.delta);
              return;
            }
            if (chunk.type === "text-end" && blocks.has(chunk.id)) {
              controller.enqueue({
                type: "text-delta",
                id: chunk.id,
                delta: normaliseMathReply(blocks.get(chunk.id)!),
              });
              blocks.delete(chunk.id);
            }
            if (chunk.type === "finish" || chunk.type === "error") {
              // Never release half an explanation after an interrupted reply.
              const hadOpenBlock = blocks.size > 0;
              for (const id of blocks.keys()) {
                controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
                controller.enqueue({ type: "text-end", id });
              }
              blocks.clear();
              // A reply stopped by the length cap must not read as a finished answer.
              if (chunk.type === "finish" && chunk.finishReason.unified === "length" && !hadOpenBlock) {
                const id = "math-truncated-note";
                controller.enqueue({ type: "text-start", id });
                controller.enqueue({ type: "text-delta", id, delta: TRUNCATED_NOTE });
                controller.enqueue({ type: "text-end", id });
              }
            }
            controller.enqueue(chunk);
          },
          flush(controller) {
            for (const id of blocks.keys()) {
              controller.enqueue({ type: "text-delta", id, delta: INCOMPLETE_REPLY });
              controller.enqueue({ type: "text-end", id });
            }
            blocks.clear();
          },
        }),
      ),
    };
  },
};
