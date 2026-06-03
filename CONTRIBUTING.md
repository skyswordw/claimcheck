# Contributing to claimcheck

Thanks for helping make PR claims verifiable! New claim kinds, deterministic
checks, and a real reproducer are all welcome.

## Development setup

```bash
npm install      # project-local; never use -g
npm run check    # typecheck (no emit)
npm test         # build tests + run the node:test suite (no network)
npm run build    # emit dist/
```

Node >= 20. No runtime dependencies — keep it that way.

## Architecture

- **`extract.ts`** — natural-language → structured `Claim[]` (conservative regex).
- **`verify.ts`** — pure `verifyClaim(claim, facts)`; deterministic checks only.
- **`facts.ts`** — `gh`-backed fact gathering (the only part that touches the
  network); injected into the CLI so everything else is unit-tested offline.
- **`receipt.ts`** — markdown / JSON rendering.
- **`cli.ts`** — argument parsing + orchestration (offline `pr.json` and gh modes).

## The honesty rule (non-negotiable)

claimcheck must **never report a claim as `verified` unless it actually checked
it**, and **never `refuted` when the facts are merely unknown** — return
`unverified` instead. Perf/coverage claims stay `unverified` until a real
reproducer measures them. PRs that weaken this guarantee will not be merged.

## Adding a claim kind

1. Extend `ClaimKind` (`types.ts`) and add extraction patterns + tests in
   `extract.ts` / `extract.test.ts`.
2. Add a deterministic check in `verify.ts` (or mark it `reproduction`/`manual`)
   with positive + negative tests.

## Pull requests

- Keep the diff focused; update `CHANGELOG.md` under `[Unreleased]`.
- `npm run check` and `npm test` must be green (CI runs both).
