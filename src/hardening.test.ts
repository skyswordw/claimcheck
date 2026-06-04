import { test } from "node:test";
import assert from "node:assert/strict";
import { extractClaims } from "./extract.js";
import { verifyClaim } from "./verify.js";
import type { Claim, PrFacts } from "./types.js";

// --- extract: multi-issue fixes lists ---
test("extract: emits one fixes claim per issue in a list", () => {
  const cs = extractClaims("fixes #100, #200, and #300");
  assert.deepEqual(
    cs.filter((c) => c.kind === "fixes").map((c) => c.issue).sort((a, b) => (a ?? 0) - (b ?? 0)),
    [100, 200, 300]
  );
  assert.equal(extractClaims("fixes #100, #200").filter((c) => c.kind === "fixes").length, 2);
});

// --- extract: negation ---
test("extract: skips negated claims", () => {
  assert.equal(extractClaims("This doesn't fix #123, it documents it.").filter((c) => c.kind === "fixes").length, 0);
  assert.equal(extractClaims("This is not 24% faster.").filter((c) => c.kind === "perf").length, 0);
  // a negator in a previous sentence must NOT suppress a later claim
  assert.equal(extractClaims("This is not great. Fixes #5.").filter((c) => c.kind === "fixes").length, 1);
});

// --- verify: broadened test-file detection ---
const factsWith = (files: string[]): PrFacts => ({
  diff: { filesChanged: files.length, additions: 1, deletions: 0, files },
  existingIssues: [],
  addedRuntimeDeps: 0,
});
const addsTests: Claim = { kind: "coverage", raw: "adds tests", verifiability: "deterministic" };

test("verify: standalone test/spec files and common variants count as tests", () => {
  for (const f of ["test.ts", "spec.ts", "src/a.cy.ts", "e2e/login.ts", "src/x.integration.ts", "__test__/y.ts", "a.test.ts.snap"]) {
    assert.equal(verifyClaim(addsTests, factsWith([f])).status, "verified", `expected ${f} to count as a test file`);
  }
  assert.equal(verifyClaim(addsTests, factsWith(["src/app.ts", "README.md"])).status, "refuted");
});
