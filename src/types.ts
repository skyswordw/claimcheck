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
