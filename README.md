# claimcheck

[![npm](https://img.shields.io/npm/v/@skyswordw/claimcheck)](https://www.npmjs.com/package/@skyswordw/claimcheck)
[![ci](https://github.com/skyswordw/claimcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/skyswordw/claimcheck/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

**A CI receipt for the claims your PR makes.**

Pull requests assert things — *"24% faster"*, *"fixes #123"*, *"zero dependencies"*, *"adds tests"* — and reviewers rarely check them. `claimcheck` extracts those factual claims and verifies the ones that are checkable from the diff, posting an honest receipt. Crucially, it **flags performance and coverage claims as `UNVERIFIED` rather than rubber-stamping them** — it never reports a number it didn't measure.

```
## claimcheck receipt

| | claim | result |
|---|---|---|
| ✅ | Fixes #123 | Issue #123 exists. |
| ⚠️ | 24% faster | Needs a reproduction run (benchmark/coverage); no reproducer configured in v0.1. |
| ✅ | Adds unit tests | Diff touches a test file (src/tok.test.ts). |
| ✅ | Changes 5 files | PR changes 6 files. (6 files) |
| ✅ | removes 200 lines | Diff is +40/-200. |
| ✅ | Zero dependencies | No runtime dependencies added. |

**6 claim(s) — 5 verified · 0 refuted · 1 unverified.**

> ⚠️ Unverified claims are **not** auto-confirmed — they need a benchmark/coverage run or human judgement. claimcheck only confirms what is checkable from the diff.
```

## What it checks (v0.1)

| Claim | Example | Verified by | Status |
|---|---|---|---|
| `fixes #N` | "fixes #123" | the issue exists in the repo | ✅ deterministic |
| size — files | "changes 5 files" | the diff's file count | ✅ deterministic |
| size — lines | "removes 200 lines" | the diff's +/- counts | ✅ deterministic |
| dependencies | "zero dependencies" | dependency delta (when known) | ✅ deterministic |
| coverage — tests | "adds tests" | a test file appears in the diff | ✅ deterministic |
| performance | "24% faster", "2x speedup" | a benchmark run | ⚠️ **unverified** (reproducer = roadmap) |
| coverage — % | "coverage to 90%" | a coverage run | ⚠️ **unverified** |
| compatibility | "no breaking changes" | human judgement | ⚠️ **unverified** |

**Honest by default:** claimcheck never marks a perf/coverage claim `verified` unless something actually measured it. When the facts to check a claim aren't available, it returns `unverified` — never a false `refuted` or `verified`.

## Quick start

```bash
# Live PR (uses the gh CLI; needs gh authenticated)
npx @skyswordw/claimcheck --repo owner/name --pr 123

# Offline (a JSON file you provide — fully deterministic, great for tests/CI)
npx @skyswordw/claimcheck pr.json
```

Offline `pr.json` format:

```json
{
  "title": "Speed up the tokenizer",
  "body": "Makes parsing 24% faster. Fixes #123. Changes 5 files. Adds unit tests. Zero dependencies.",
  "facts": {
    "diff": { "filesChanged": 6, "additions": 40, "deletions": 200, "files": ["src/tok.ts", "src/tok.test.ts"] },
    "existingIssues": [123],
    "addedRuntimeDeps": 0
  }
}
```

`existingIssues` / `addedRuntimeDeps` may be `null` when unknown — claimcheck then returns those claims as `unverified` (never guessed).

## CI

Post a receipt on every PR with the composite action:

```yaml
# .github/workflows/claimcheck.yml
name: claimcheck
on: [pull_request]
permissions:
  pull-requests: write
jobs:
  claimcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: skyswordw/claimcheck@main
        # with:
        #   fail-on-refuted: "true"   # block the PR if a checkable claim is false
```

Or plain `npx` (see [`examples/claimcheck-workflow.yml`](./examples/claimcheck-workflow.yml)).

## Why

Existing PR-benchmark tools (github-action-benchmark, Bencher, …) verify *pre-wired* benchmarks; they never read what the PR's description actually *claims*. claimcheck starts from the prose — the claims a human will skim and trust — and either backs them with evidence or marks them unverified. It's the difference between "the benchmark we set up passed" and "the PR's own claim was checked."

## Roadmap

A pluggable **reproducer** (run the PR's benchmark/coverage in a clean container) to upgrade perf/coverage claims from `unverified` to measured `verified`/`refuted` with a `claimed X, measured Y ± noise` receipt. More claim kinds. Sticky PR comments.

## Development

```bash
npm install      # project-local; no global installs
npm run check    # typecheck
npm test         # build + run the node:test suite (no network — gh is injectable)
npm run build    # emit dist/
```

The `gh` fact-gathering is injectable, so the extractor, verifier, receipt, and CLI orchestration are all unit-tested without network access.

## Related

Part of a small set of honest-by-default QA tools for AI-assisted development:

- **[skillport](https://github.com/skyswordw/skillport)** — static cross-agent skill linter
- **[skillmatrix](https://github.com/skyswordw/skillmatrix)** — behavioral cross-agent skill testing
- **claimcheck** (this repo) — a CI receipt for the claims your PR makes

## License

MIT © skyswordw
