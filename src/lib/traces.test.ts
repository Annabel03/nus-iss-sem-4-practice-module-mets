import assert from "node:assert/strict";
import test from "node:test";
import { newLogId } from "./traces";

test("trace IDs use distinct cryptographic UUIDs with the existing log prefix", () => {
  const ids = Array.from({ length: 100 }, () => newLogId());
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^log_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});
