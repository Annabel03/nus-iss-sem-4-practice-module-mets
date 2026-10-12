import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("reply and tool parsing finishes on adversarial input within a bounded process", () => {
  // A separate process can be killed even if a synchronous regex blocks its event loop.
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", `
    import assert from 'node:assert/strict';
    import { normaliseMathReply } from './src/agents/math/guardrails.ts';
    import { degreesToRadians } from './src/agents/math/tools.ts';
    import { normaliseChemistryReply } from './src/agents/chemistry/guardrails.ts';
    import { normalisePhysicsReply } from './src/agents/physics/guardrails.ts';
    import { normaliseTestingReply } from './src/agents/testing/guardrails.ts';
    import { extractAssessmentTopics } from './src/agents/testing/assessment-planner.ts';
    import { notifyRecipients } from './src/agents/guardrail/notify.ts';

    const spaces = ' '.repeat(100_000);
    const ordinary = 'Working:' + spaces + 'x = 2';
    for (const normalise of [normaliseMathReply, normaliseChemistryReply, normalisePhysicsReply, normaliseTestingReply]) {
      assert.equal(normalise(ordinary), ordinary);
    }
    const malformed = '!['.repeat(50_000);
    assert.equal(normaliseMathReply(malformed), malformed);
    assert.equal(normaliseChemistryReply(malformed), malformed);
    assert.equal(normaliseMathReply('<img'.repeat(25_000)).includes('<img'), false);
    const numeric = '9'.repeat(100_000);
    assert.equal(degreesToRadians(numeric), numeric);
    assert.deepEqual(extractAssessmentTopics('Quiz me on speed' + '.'.repeat(100_000)), ['speed']);
    assert.equal(notifyRecipients('a@' + 'b.'.repeat(50_000) + '@').includes('a@' + 'b.'.repeat(50_000) + '@'), false);
    const indented = 'Note\\n' + (' '.repeat(1_000) + '\\n').repeat(100) + '1. A\\n2. B\\n3. C';
    assert.match(normaliseTestingReply(indented), /full answer key/);
  `], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 10_000,
    env: { ...process.env, METS_ADMIN_EMAILS: "", METS_PARENT_NOTIFY_EMAIL: "" },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
