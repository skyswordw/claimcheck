import type { Claim } from "./types.js";
/**
 * Extract factual claims from a PR's text (title + body). Deterministic and
 * dependency-free: regex over natural language, conservative by design — it is
 * better to miss a vaguely-worded claim than to invent one.
 */
export declare function extractClaims(text: string): Claim[];
