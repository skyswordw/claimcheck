import type { Claim, PrFacts, Verdict, VerdictStatus } from "./types.js";

const TEST_FILE_RE = /(^|\/)(tests?|spec|__tests__)(\/|$)|\.(test|spec)\./i;

function verdict(claim: Claim, status: VerdictStatus, detail: string, measured?: string): Verdict {
  const v: Verdict = { claim, status, detail };
  if (measured !== undefined) v.measured = measured;
  return v;
}

/** Numbers in PR prose are approximate; accept within max(5, 10%). */
function close(claimed: number, actual: number): boolean {
  return Math.abs(claimed - actual) <= Math.max(5, claimed * 0.1);
}

/**
 * Verify a single claim against the PR facts. Pure and deterministic.
 * Reproduction/manual claims are honestly returned as `unverified` — claimcheck
 * never asserts a benchmark result it did not measure.
 */
export function verifyClaim(claim: Claim, facts: PrFacts): Verdict {
  if (claim.verifiability === "reproduction") {
    return verdict(claim, "unverified", "Needs a reproduction run (benchmark/coverage); no reproducer configured in v0.1.");
  }
  if (claim.verifiability === "manual") {
    return verdict(claim, "unverified", "Requires human judgement.");
  }

  switch (claim.kind) {
    case "fixes": {
      if (facts.existingIssues === null) {
        return verdict(claim, "unverified", `Could not check whether issue #${claim.issue} exists.`);
      }
      const exists = claim.issue !== undefined && facts.existingIssues.includes(claim.issue);
      return exists
        ? verdict(claim, "verified", `Issue #${claim.issue} exists.`)
        : verdict(claim, "refuted", `Issue #${claim.issue} was not found in the repository.`, "missing");
    }
    case "size": {
      if (claim.unit === "files") {
        const actual = facts.diff.filesChanged;
        return close(claim.value ?? 0, actual)
          ? verdict(claim, "verified", `PR changes ${actual} files.`, `${actual} files`)
          : verdict(claim, "refuted", `Claimed ${claim.value} files; PR changes ${actual}.`, `${actual} files`);
      }
      if (claim.unit === "lines") {
        const { additions, deletions } = facts.diff;
        const v = claim.value ?? 0;
        const ok = close(v, additions) || close(v, deletions) || close(v, additions + deletions);
        return ok
          ? verdict(claim, "verified", `Diff is +${additions}/-${deletions}.`, `+${additions}/-${deletions}`)
          : verdict(claim, "refuted", `Claimed ${v} lines; diff is +${additions}/-${deletions}.`, `+${additions}/-${deletions}`);
      }
      if (claim.unit === "dependencies") {
        if (facts.addedRuntimeDeps === null) {
          return verdict(claim, "unverified", "Could not determine dependency changes.");
        }
        return facts.addedRuntimeDeps === 0
          ? verdict(claim, "verified", "No runtime dependencies added.")
          : verdict(claim, "refuted", `Claimed zero dependencies; PR adds ${facts.addedRuntimeDeps}.`, `${facts.addedRuntimeDeps} added`);
      }
      return verdict(claim, "unverified", "No deterministic check for this size claim.");
    }
    case "coverage": {
      const testFile = facts.diff.files.find((f) => TEST_FILE_RE.test(f));
      return testFile
        ? verdict(claim, "verified", `Diff touches a test file (${testFile}).`, testFile)
        : verdict(claim, "refuted", "No test files found in the diff.");
    }
    default:
      return verdict(claim, "unverified", "No deterministic check available.");
  }
}

export function verifyAll(claims: Claim[], facts: PrFacts): Verdict[] {
  return claims.map((c) => verifyClaim(c, facts));
}
