import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyClaim } from "./verify.js";
import type { Claim, PrFacts } from "./types.js";

const facts = (over: Partial<PrFacts> = {}): PrFacts => ({
  diff: { filesChanged: 5, additions: 50, deletions: 200, files: ["src/a.ts", "src/a.test.ts"] },
  existingIssues: [123],
  addedRuntimeDeps: 0,
  ...over,
});

const c = (p: Partial<Claim> & Pick<Claim, "kind" | "raw" | "verifiability">): Claim => p as Claim;

test("reproduction and manual claims are honestly unverified", () => {
  assert.equal(verifyClaim(c({ kind: "perf", raw: "24% faster", value: 24, unit: "%", verifiability: "reproduction" }), facts()).status, "unverified");
  assert.equal(verifyClaim(c({ kind: "compat", raw: "no breaking changes", verifiability: "manual" }), facts()).status, "unverified");
});

test("fixes: verified / refuted / unverified-when-unknown", () => {
  assert.equal(verifyClaim(c({ kind: "fixes", raw: "fixes #123", issue: 123, verifiability: "deterministic" }), facts()).status, "verified");
  assert.equal(verifyClaim(c({ kind: "fixes", raw: "fixes #999", issue: 999, verifiability: "deterministic" }), facts()).status, "refuted");
  assert.equal(verifyClaim(c({ kind: "fixes", raw: "fixes #1", issue: 1, verifiability: "deterministic" }), facts({ existingIssues: null })).status, "unverified");
});

test("size files: verified within tolerance, else refuted", () => {
  assert.equal(verifyClaim(c({ kind: "size", raw: "5 files", value: 5, unit: "files", verifiability: "deterministic" }), facts()).status, "verified");
  assert.equal(verifyClaim(c({ kind: "size", raw: "20 files", value: 20, unit: "files", verifiability: "deterministic" }), facts()).status, "refuted");
});

test("size lines: matches additions or deletions", () => {
  assert.equal(verifyClaim(c({ kind: "size", raw: "removes 200 lines", value: 200, unit: "lines", verifiability: "deterministic" }), facts()).status, "verified");
  assert.equal(verifyClaim(c({ kind: "size", raw: "adds 50 lines", value: 50, unit: "lines", verifiability: "deterministic" }), facts()).status, "verified");
  assert.equal(verifyClaim(c({ kind: "size", raw: "1000 lines", value: 1000, unit: "lines", verifiability: "deterministic" }), facts()).status, "refuted");
});

test("size dependencies: 0 verified, >0 refuted, null unverified", () => {
  const claim = c({ kind: "size", raw: "zero dependencies", value: 0, unit: "dependencies", verifiability: "deterministic" });
  assert.equal(verifyClaim(claim, facts()).status, "verified");
  assert.equal(verifyClaim(claim, facts({ addedRuntimeDeps: 3 })).status, "refuted");
  assert.equal(verifyClaim(claim, facts({ addedRuntimeDeps: null })).status, "unverified");
});

test("coverage adds-tests: verified when a test file is in the diff", () => {
  const claim = c({ kind: "coverage", raw: "adds tests", verifiability: "deterministic" });
  assert.equal(verifyClaim(claim, facts()).status, "verified");
  assert.equal(
    verifyClaim(claim, facts({ diff: { filesChanged: 1, additions: 10, deletions: 0, files: ["src/a.ts"] } })).status,
    "unverified" // heuristic miss is not proof; never falsely refute an honest "adds tests"
  );
});
