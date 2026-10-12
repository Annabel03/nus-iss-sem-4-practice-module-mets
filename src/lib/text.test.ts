import assert from "node:assert/strict";
import test from "node:test";
import { asciiSlug, trimEndCharacters } from "./text";

test("ASCII slugs preserve existing saved key and filename formats", () => {
  assert.equal(asciiSlug(" -- H2 Chain Rule / Quiz -- "), "h2-chain-rule-quiz");
  assert.equal(asciiSlug("../Session_01/"), "session-01");
  assert.equal(asciiSlug("a---b"), "a-b");
  assert.equal(asciiSlug("---"), "");
  assert.equal(asciiSlug(""), "");
});

test("suffix trimming preserves leading punctuation and the content before the suffix", () => {
  assert.equal(trimEndCharacters(" topic ,;:-", " ,;:-"), " topic");
  assert.equal(trimEndCharacters("math--primary-fractions-", "-"), "math--primary-fractions");
  assert.equal(trimEndCharacters(" ,;:-", " ,;:-"), "");
  assert.equal(trimEndCharacters("topic?", " ,;:-"), "topic?");
});
