import assert from "node:assert/strict";
import test from "node:test";
import { stripLineEndWhitespace, stripModelImageMarkup } from "./reply-text";

test("line repair only removes spaces and tabs immediately before a newline", () => {
  assert.equal(stripLineEndWhitespace(" x \t\n\ty\nlast \t"), " x\n\ty\nlast \t");
  assert.equal(stripLineEndWhitespace("x\v\n"), "x\v\n");
});

test("image scanning preserves text, links and the specialist's truncation policy", () => {
  assert.equal(stripModelImageMarkup("A ![diagram](url) B <IMG src='url'> C"), "A  B  C");
  assert.equal(stripModelImageMarkup("See [example](url)."), "See [example](url).");
  assert.equal(stripModelImageMarkup("A ![unfinished](url"), "A ![unfinished](url");
  assert.equal(stripModelImageMarkup("A ![unfinished](url", { truncated: true }), "A ");
  assert.equal(stripModelImageMarkup("A <img src='url'"), "A <img src='url'");
  assert.equal(stripModelImageMarkup("A <img src='url'", { truncated: true }), "A ");
});

test("Math graph markup, data URIs and preceding spaces are removed", () => {
  const options = { truncated: true, graphs: true, leadingSpaces: true };
  assert.equal(stripModelImageMarkup("A <SVG><path/></SVG> B", options), "A B");
  assert.equal(stripModelImageMarkup("İ <SVG><path/></SVG> B", options), "İ B");
  assert.equal(stripModelImageMarkup("A <jsxgraph points='cut off", options), "A");
  assert.equal(stripModelImageMarkup("A <jsxgraph /> B", options), "A B");
  assert.equal(stripModelImageMarkup("A data:image/png;base64,abc= B", options), "A B");
  assert.equal(stripModelImageMarkup("A data:image/png;other B", options), "A data:image/png;other B");
});

test("malformed repeated markers do not hide valid later images", () => {
  assert.equal(stripModelImageMarkup("![bad ![bad <img src='url'> end"), "![bad ![bad  end");
  assert.equal(stripModelImageMarkup("![bad] text ![ok](url) end"), "![bad] text  end");
  assert.equal(stripModelImageMarkup("<img <img unfinished"), "<img <img unfinished");
});
