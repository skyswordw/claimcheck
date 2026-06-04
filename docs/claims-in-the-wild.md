# claimcheck in the wild (40 real PRs)

*A claimcheck run, 2026-06-04.*

I pointed [claimcheck](https://github.com/skyswordw/claimcheck)'s live `gh` mode at **40 real, recently-merged public pull requests** (found via GitHub search for claim-ish language: *faster*, *adds tests*, *reduces*, *zero dependencies*) to see how it holds up on data it has never seen.

## TL;DR

1. **The pipeline is robust:** all **40/40** PRs were fetched, parsed, and checked **without a single error**.
2. **Verifiable claims are rarer than you'd think:** even among PRs whose text matched claim-ish search terms, only **22% (9/40)** contained a claim claimcheck could extract as a structured, checkable statement. Most PR prose is descriptive, not quantified.
3. **The run found — and fixed — an honesty bug in claimcheck itself** (see below). After the fix, claimcheck **refuted nothing** on this sample: it verified what it could and was honest about the rest.

## Numbers

| | count |
|---|---|
| PRs scanned (zero errors) | 40 |
| PRs with ≥1 extractable claim | 9 (22%) |
| Total claims | 13 |
| &nbsp;&nbsp;`coverage` ("adds tests") | 9 |
| &nbsp;&nbsp;`fixes #N` | 2 |
| &nbsp;&nbsp;`compat` ("no breaking changes") | 2 |
| **Verdicts** — ✅ verified | 9 |
| ⚠️ unverified | 4 |
| ❌ refuted | 0 |

The 9 verified claims were checked against the actual diff / repository (a linked issue exists, a test file is present, file counts match). The 4 unverified are inherently fuzzy: 2 `compat` claims (human judgement) and 2 `coverage` claims where no test file was detected.

## What the run taught the tool

Two PRs said they "added tests", but the diff held only a `.txt` file named *test* and a CI workflow — no recognizable test file. claimcheck's first instinct was to **refute** them. That's wrong: test-file detection is a **naming heuristic** (it can miss CI-based tests, framework-specific test files like Terraform's `.tftest.hcl`, or tests added to an existing file), and **a heuristic miss is not proof a claim is false.**

So `claimcheck@0.2.1` now returns **`unverified`** (not `refuted`) for an "adds tests" claim with no detected test file — consistent with its core rule: *never refute on weak evidence.* The two cases above are now honestly `unverified`.

## Honest caveats

- The sample is **biased toward PRs that make claims** (they were found by searching for claim language), yet only 22% yielded a structured claim — so in the wild at large, checkable claims are rarer still.
- This validates the `gh` pipeline and the deterministic checks; it is not a statement about any individual project. Repo names are omitted on purpose.

## Reproduce

```bash
npx @skyswordw/claimcheck --repo owner/name --pr 123 --no-fail
```
