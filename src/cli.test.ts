import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runCli } from "./cli.js";
import type { GhPr } from "./facts.js";

const facts = {
  diff: { filesChanged: 5, additions: 50, deletions: 200, files: ["src/a.ts", "src/a.test.ts"] },
  existingIssues: [123],
  addedRuntimeDeps: 0,
};

function prFile(input: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "cc-"));
  const p = join(dir, "pr.json");
  writeFileSync(p, JSON.stringify(input));
  return p;
}

test("--help and --version", () => {
  assert.equal(runCli(["--help"]).exitCode, 0);
  assert.match(runCli(["--help"]).output, /a CI receipt for the claims/);
  assert.equal(runCli(["--version"]).output.trim(), "0.1.0");
});

test("json-file mode: receipt with verified + unverified, exit 0", () => {
  const p = prFile({ body: "Fixes #123. Changes 5 files. zero dependencies. adds tests. 24% faster.", facts });
  try {
    const res = runCli([p]);
    assert.match(res.output, /## claimcheck receipt/);
    assert.match(res.output, /✅/);
    assert.match(res.output, /⚠️/);
    assert.equal(res.exitCode, 0);
  } finally {
    rmSync(dirname(p), { recursive: true, force: true });
  }
});

test("refuted claim exits 1; --no-fail exits 0", () => {
  const p = prFile({ body: "Changes 99 files.", facts });
  try {
    assert.equal(runCli([p]).exitCode, 1);
    assert.equal(runCli([p, "--no-fail"]).exitCode, 0);
  } finally {
    rmSync(dirname(p), { recursive: true, force: true });
  }
});

test("--json output parses", () => {
  const p = prFile({ body: "Fixes #123.", facts });
  try {
    const j = JSON.parse(runCli([p, "--json"]).output);
    assert.equal(j.summary.verified, 1);
  } finally {
    rmSync(dirname(p), { recursive: true, force: true });
  }
});

test("gh mode with injected fakes", () => {
  const ghPr = (_repo: string, _pr: number): GhPr => ({
    title: "Speed up",
    body: "Fixes #7. 50% faster.",
    diff: { filesChanged: 2, additions: 10, deletions: 5, files: ["x.ts"] },
  });
  const ghIssueExists = (_repo: string, n: number): boolean => n === 7;
  const res = runCli(["--repo", "o/r", "--pr", "12"], { ghPr, ghIssueExists });
  assert.match(res.output, /Issue #7 exists/);
  assert.match(res.output, /unverified/i);
});

test("missing input exits 2; missing facts exits 2", () => {
  assert.equal(runCli([]).exitCode, 2);
  const p = prFile({ body: "hi" });
  try {
    assert.equal(runCli([p]).exitCode, 2);
  } finally {
    rmSync(dirname(p), { recursive: true, force: true });
  }
});
