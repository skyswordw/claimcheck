import type { Claim, PrFacts, Verdict } from "./types.js";
/**
 * Verify a single claim against the PR facts. Pure and deterministic.
 * Reproduction/manual claims are honestly returned as `unverified` — claimcheck
 * never asserts a benchmark result it did not measure.
 */
export declare function verifyClaim(claim: Claim, facts: PrFacts): Verdict;
export declare function verifyAll(claims: Claim[], facts: PrFacts): Verdict[];
