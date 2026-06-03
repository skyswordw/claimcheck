# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
