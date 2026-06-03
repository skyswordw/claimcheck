import type { Claim, Verifiability } from "./types.js";

/**
 * Extract factual claims from a PR's text (title + body). Deterministic and
 * dependency-free: regex over natural language, conservative by design — it is
 * better to miss a vaguely-worded claim than to invent one.
 */
export function extractClaims(text: string): Claim[] {
  const claims: Claim[] = [];
  const seen = new Set<string>();

  const add = (c: Claim): void => {
    const key = `${c.kind}:${c.raw.toLowerCase().replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) return;
    seen.add(key);
    claims.push(c);
  };

  const claim = (
    kind: Claim["kind"],
    raw: string,
    verifiability: Verifiability,
    extra: { value?: number; unit?: string; issue?: number } = {}
  ): void => {
    const c: Claim = { kind, raw: raw.trim(), verifiability };
    if (extra.value !== undefined) c.value = extra.value;
    if (extra.unit !== undefined) c.unit = extra.unit;
    if (extra.issue !== undefined) c.issue = extra.issue;
    add(c);
  };

  // fixes / closes / resolves #N (GitHub closing keywords)
  for (const m of text.matchAll(/\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#(\d+)\b/gi)) {
    claim("fixes", m[0], "deterministic", { issue: Number(m[1]) });
  }

  // perf: "24% faster", "2x faster", "3x speedup"
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*(%|x)\s*(?:faster|slower|speed-?up|quicker)\b/gi)) {
    claim("perf", m[0], "reproduction", { value: Number(m[1]), unit: (m[2] as string).toLowerCase() });
  }
  // perf: "faster by 24%", "improved by 30ms"
  for (const m of text.matchAll(/\b(?:faster|slower|speed-?up|quicker|improved?)\s+by\s+(\d+(?:\.\d+)?)\s*(%|x|ms|s)\b/gi)) {
    claim("perf", m[0], "reproduction", { value: Number(m[1]), unit: (m[2] as string).toLowerCase() });
  }
  // perf: "reduces latency by 30ms", "cuts runtime by 20%"
  for (const m of text.matchAll(/\b(?:reduce[sd]?|cut[s]?|lower[sd]?|shave[sd]?)\b[^.\n]{0,40}?\bby\s+(\d+(?:\.\d+)?)\s*(%|ms|s)\b/gi)) {
    claim("perf", m[0], "reproduction", { value: Number(m[1]), unit: (m[2] as string).toLowerCase() });
  }

  // coverage: "coverage to 90%"
  for (const m of text.matchAll(/\bcoverage\s+(?:to|by|of|from\s+\d+%\s+to)\s+(\d+(?:\.\d+)?)\s*%/gi)) {
    claim("coverage", m[0], "reproduction", { value: Number(m[1]), unit: "%" });
  }
  // coverage: "adds tests", "includes unit tests"
  for (const m of text.matchAll(/\b(?:add(?:s|ed)?|include[sd]?|with|wrote)\s+(?:new\s+|unit\s+|integration\s+|end-to-end\s+|e2e\s+)?tests?\b/gi)) {
    claim("coverage", m[0], "deterministic");
  }

  // size: "5 files changed", "changes 5 files"
  for (const m of text.matchAll(/\b(\d+)\s+files?\s+changed\b/gi)) {
    claim("size", m[0], "deterministic", { value: Number(m[1]), unit: "files" });
  }
  for (const m of text.matchAll(/\bchanges?\s+(\d+)\s+files?\b/gi)) {
    claim("size", m[0], "deterministic", { value: Number(m[1]), unit: "files" });
  }
  // size: "removes 200 lines", "adds 50 lines"
  for (const m of text.matchAll(/\b(?:remove[sd]?|delete[sd]?|add(?:s|ed)?)\s+(\d+)\s+lines?\b/gi)) {
    claim("size", m[0], "deterministic", { value: Number(m[1]), unit: "lines" });
  }
  // size: "zero dependencies", "no new dependencies"
  for (const m of text.matchAll(/\b(?:zero|no)\s+(?:new\s+|runtime\s+|external\s+)?dependencies\b/gi)) {
    claim("size", m[0], "deterministic", { value: 0, unit: "dependencies" });
  }

  // compat: "no breaking changes", "backwards compatible", "non-breaking"
  for (const m of text.matchAll(/\bno\s+breaking\s+changes?\b/gi)) {
    claim("compat", m[0], "manual");
  }
  for (const m of text.matchAll(/\b(?:backwards?[\s-]?compatible|non-breaking)\b/gi)) {
    claim("compat", m[0], "manual");
  }

  return claims;
}
