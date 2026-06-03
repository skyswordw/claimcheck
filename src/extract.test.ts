import { test } from "node:test";
import assert from "node:assert/strict";
import { extractClaims } from "./extract.js";
import type { Claim, ClaimKind } from "./types.js";

const find = (cs: Claim[], k: ClaimKind, pred?: (c: Claim) => boolean): Claim | undefined =>
  cs.find((c) => c.kind === k && (!pred || pred(c)));

test("extracts fixes/perf/coverage/size/compat from a realistic PR", () => {
  const body = `
## Summary
This PR makes the tokenizer 24% faster and gives a 2x speedup on large files.
It reduces latency by 30ms on the hot path.

Fixes #123. Also closes #45.

- adds unit tests for the new path
- increases coverage to 90%
- changes 5 files, removes 200 lines
- zero dependencies, no breaking changes
`;
  const cs = extractClaims(body);

  assert.deepEqual(
    cs.filter((c) => c.kind === "fixes").map((c) => c.issue).sort((a, b) => (a ?? 0) - (b ?? 0)),
    [45, 123]
  );

  const perf = cs.filter((c) => c.kind === "perf");
  assert.ok(perf.length >= 3, `expected >=3 perf claims, got ${perf.length}`);
  assert.ok(perf.every((c) => c.verifiability === "reproduction"));
  assert.ok(find(cs, "perf", (c) => c.value === 24 && c.unit === "%"));
  assert.ok(find(cs, "perf", (c) => c.value === 2 && c.unit === "x"));
  assert.ok(find(cs, "perf", (c) => c.value === 30 && c.unit === "ms"));

  assert.ok(find(cs, "coverage", (c) => c.verifiability === "deterministic")); // "adds unit tests"
  assert.ok(find(cs, "coverage", (c) => c.value === 90 && c.unit === "%" && c.verifiability === "reproduction"));

  assert.ok(find(cs, "size", (c) => c.value === 5 && c.unit === "files"));
  assert.ok(find(cs, "size", (c) => c.value === 200 && c.unit === "lines"));
  assert.ok(find(cs, "size", (c) => c.value === 0 && c.unit === "dependencies"));

  assert.ok(find(cs, "compat", (c) => c.verifiability === "manual"));
});

test("no false positives on neutral prose", () => {
  const cs = extractClaims("This refactors the parser for clarity and renames a few variables.");
  assert.equal(cs.length, 0);
});

test("dedupes repeated identical claims", () => {
  const cs = extractClaims("Fixes #7. Fixes #7 again for good measure.");
  assert.equal(cs.filter((c) => c.kind === "fixes" && c.issue === 7).length, 1);
});

test("verifiability is tagged correctly per kind", () => {
  const cs = extractClaims("adds tests; 50% faster; fixes #1; zero dependencies");
  assert.equal(find(cs, "perf")!.verifiability, "reproduction");
  assert.equal(find(cs, "fixes")!.verifiability, "deterministic");
  assert.equal(find(cs, "size")!.verifiability, "deterministic");
  assert.equal(find(cs, "coverage")!.verifiability, "deterministic");
});
