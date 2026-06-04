# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-06-04

Surfaced by running claimcheck over 40 real public PRs ("in the wild").

### Fixed
- An "adds tests" claim with no detected test file is now **`unverified`**, not
  `refuted`. Test detection is a naming heuristic (it can miss CI-based tests,
  framework-specific test files, or tests added to an existing file), and a
  heuristic miss is not proof the claim is false — claimcheck must never refute
  on weak evidence.

## [0.2.0] - 2026-06-04

Hardening pass (from a multi-lens audit).

### Fixed
- `TEST_FILE_RE` now recognizes standalone `test.ts`/`spec.ts`, `.cy.`/
  `.integration.`/`.snap`, `__test__` (singular), and `e2e` — so an honest
  "adds tests" claim is no longer falsely **refuted**.
- The GitHub Action posts a **sticky** receipt (edits its previous comment
  instead of spamming a new one each run), skips empty receipts, and no longer
  swallows a failed comment post.

### Added
- Multi-issue `fixes` lists: `fixes #100, #200, and #300` now yields one claim
  per issue (previously only the first was extracted).
- Negation handling: a disclaimed claim ("doesn't fix #123") is skipped instead
  of being invented and then verified/refuted.
- gh-mode now computes the real dependency delta from the PR's `package.json`
  diff, so `zero dependencies` is actually verified live (was always unverified).

## [0.1.0] - 2026-06-04

Initial release: extract a PR's factual claims and verify the checkable ones.

### Added
- Claim extraction from PR text: `fixes #N`, performance (`24% faster`, `2x`,
  `30ms`), coverage (`adds tests`, `coverage to 90%`), size (`5 files`,
  `200 lines`, `zero dependencies`), compatibility — each tagged as
  deterministic / reproduction / manual.
- Deterministic verifier: checks `fixes #N` existence, file/line counts vs the
  diff, and zero-dependency claims. Honestly returns `unverified` for
  perf/coverage/manual claims and whenever the facts are unknown — never a false
  `verified` or `refuted`.
- Markdown + JSON receipt with an honest footer.
- CLI: offline `pr.json` mode (fully deterministic) and a live `--repo/--pr`
  mode via the `gh` CLI (injectable, so the core is tested without network).
- Composite GitHub Action and example workflow.
- 20 tests on `node:test`; zero runtime dependencies.

[Unreleased]: https://github.com/skyswordw/claimcheck/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/skyswordw/claimcheck/releases/tag/v0.1.0
