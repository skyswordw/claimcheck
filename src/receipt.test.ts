import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, renderJson, summarize } from "./receipt.js";
import type { Verdict, VerdictStatus } from "./types.js";

const v = (status: VerdictStatus, raw: string, detail: string, measured?: string): Verdict => {
  const out: Verdict = { claim: { kind: "size", raw, verifiability: "deterministic" }, status, detail };
  if (measured !== undefined) out.measured = measured;
  return out;
};

test("summarize counts by status", () => {
  const s = summarize([v("verified", "a", "x"), v("refuted", "b", "y"), v("unverified", "c", "z")]);
  assert.deepEqual(s, { total: 3, verified: 1, refuted: 1, unverified: 1 });
});

test("renderMarkdown: table rows + honest footer", () => {
  const md = renderMarkdown([v("verified", "5 files", "ok", "5 files"), v("unverified", "24% faster", "needs benchmark")]);
  assert.match(md, /## claimcheck receipt/);
  assert.match(md, /✅ \| 5 files/);
  assert.match(md, /⚠️ \| 24% faster/);
  assert.match(md, /not\*\* auto-confirmed/i);
});

test("renderMarkdown: empty", () => {
  assert.match(renderMarkdown([]), /No factual claims detected/);
});

test("renderJson is valid", () => {
  const j = JSON.parse(renderJson([v("refuted", "x", "y")]));
  assert.equal(j.summary.refuted, 1);
  assert.equal(j.verdicts[0].status, "refuted");
});
