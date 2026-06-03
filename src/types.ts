/** The category of a factual claim made in a PR. */
export type ClaimKind = "perf" | "coverage" | "fixes" | "size" | "compat";

/**
 * How a claim could be verified:
 * - deterministic: checkable from the diff / repo metadata (no execution)
 * - reproduction: needs running something (a benchmark / coverage tool)
 * - manual: requires human judgement
 */
export type Verifiability = "deterministic" | "reproduction" | "manual";

/** A single factual claim extracted from a PR's title/body. */
export interface Claim {
  kind: ClaimKind;
  /** The exact text that was matched. */
  raw: string;
  /** Numeric magnitude when the claim carries one (e.g. 24 for "24% faster"). */
  value?: number;
  /** Unit for `value`: "%", "x", "ms", "s", "files", "lines", "dependencies". */
  unit?: string;
  /** Issue number for `fixes` claims. */
  issue?: number;
  verifiability: Verifiability;
}

/** Diff statistics for the PR under review. */
export interface DiffStats {
  filesChanged: number;
  additions: number;
  deletions: number;
  /** Paths touched by the PR (used to detect test files). */
  files: string[];
}

/** The facts a verifier needs to check deterministic claims. */
export interface PrFacts {
  diff: DiffStats;
  /** Issue numbers that exist in the repository, or null if not checked. */
  existingIssues: number[] | null;
  /** Runtime dependencies the PR adds (0 = none), or null if not determined. */
  addedRuntimeDeps: number | null;
}

export type VerdictStatus = "verified" | "refuted" | "unverified";

export interface Verdict {
  claim: Claim;
  status: VerdictStatus;
  detail: string;
  /** The measured reality, when available (e.g. "8 files"). */
  measured?: string;
}

/** Offline input for the CLI: a PR plus the facts to check it against. */
export interface PullRequestInput {
  title?: string;
  body: string;
  facts: PrFacts;
}
