import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chemistryItems } from "./catalog/chemistry";
import { scoreAgainstScaffold } from "./score";

const balanceItem = chemistryItems.find((item) => item.id === "chem-balance");
assert.ok(balanceItem);

describe("Chemistry notation matching in scaffold phrases", () => {
  it("matches a balanced equation written with LaTeX notation", () => {
    const latexEquation = String.raw`$$
4\text{Fe} + 3\text{O}_2 \rightarrow 2\text{Fe}_2\text{O}_3
$$`;
    const result = scoreAgainstScaffold({
      item: balanceItem,
      actualText: latexEquation,
      toolCalls: ["reactionBalancer"],
    });

    assert.equal(result.passed, true);
    assert.equal(result.checks.find((check) => check.name.startsWith("must:"))?.passed, true);
  });

  it("matches a balanced equation written with ASCII subscripts and an arrow", () => {
    const result = scoreAgainstScaffold({
      item: balanceItem,
      actualText: "4Fe + 3O2 -> 2Fe2O3",
      toolCalls: ["reactionBalancer"],
    });

    assert.equal(result.passed, true);
  });

  it("normalizes multi-digit Unicode subscripts", () => {
    const result = scoreAgainstScaffold({
      item: {
        ...balanceItem,
        scaffold: {
          ...balanceItem.scaffold,
          mustInclude: ["X₁₀"],
          requiredTools: [],
        },
      },
      actualText: String.raw`X_{10}`,
      toolCalls: [],
    });

    assert.equal(result.passed, true);
  });

  it("still rejects an incorrectly balanced equation", () => {
    const result = scoreAgainstScaffold({
      item: balanceItem,
      actualText: "4Fe + 3O2 -> 2Fe2O2",
      toolCalls: ["reactionBalancer"],
    });

    assert.equal(result.passed, false);
    assert.equal(result.checks.find((check) => check.name.startsWith("must:"))?.passed, false);
  });

  it("does not apply Chemistry notation normalization to other suites", () => {
    const mathItem = {
      ...balanceItem,
      suiteId: "math" as const,
    };
    const result = scoreAgainstScaffold({
      item: mathItem,
      actualText: String.raw`$$4\text{Fe} + 3\text{O}_2 \rightarrow 2\text{Fe}_2\text{O}_3$$`,
      toolCalls: ["reactionBalancer"],
    });

    assert.equal(result.passed, false);
    assert.equal(result.checks.find((check) => check.name.startsWith("must:"))?.passed, false);
  });
});
