# claimcheck examples

Two offline PR fixtures you can run directly:

```bash
# A PR whose checkable claims all hold (perf stays honestly unverified)
npx @skyswordw/claimcheck examples/pr.example.json

# A PR that overclaims — refuted claims, exits non-zero
npx @skyswordw/claimcheck examples/refuted.example.json
```

## `pr.example.json`

Claims "24% faster" (→ ⚠️ unverified), `fixes #123` (exists → ✅), "changes 5
files" (diff has 6, within tolerance → ✅), "removes 200 lines" (✅), "adds unit
tests" (a `*.test.ts` is in the diff → ✅), "zero dependencies" (✅).

## `refuted.example.json`

Claims `fixes #99999` (issue absent → ❌), "adds tests" (no test file detected →
⚠️ unverified — a heuristic miss is never treated as proof), and "zero
dependencies" while the facts say 2 were added (❌). Exits `1` because of the two
refuted claims (use `--no-fail` to report without failing).

See [`claimcheck-workflow.yml`](./claimcheck-workflow.yml) for a copy-paste CI
workflow.
