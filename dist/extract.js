// Words that, appearing just before a match (same clause), negate the claim.
const NEG_RE = /\bno longer\b|\bnot\b|\bnever\b|\bwithout\b|n['’]t\b/i;
/**
 * Extract factual claims from a PR's text (title + body). Deterministic and
 * dependency-free: regex over natural language, conservative by design — it is
 * better to miss a vaguely-worded claim than to invent one. Negated claims
 * ("doesn't fix #1") are skipped so the receipt never invents a disclaimed claim.
 */
export function extractClaims(text) {
    const claims = [];
    const seen = new Set();
    const isNegated = (idx) => {
        const window = text.slice(Math.max(0, idx - 24), idx);
        const clause = window.split(/[.!?\n]/).pop() ?? window; // current clause only
        return NEG_RE.test(clause);
    };
    const add = (c) => {
        const key = `${c.kind}:${c.raw.toLowerCase().replace(/\s+/g, " ").trim()}`;
        if (seen.has(key))
            return;
        seen.add(key);
        claims.push(c);
    };
    const claim = (kind, m, verifiability, extra = {}) => {
        if (isNegated(m.index ?? 0))
            return;
        const c = { kind, raw: (extra.raw ?? m[0]).trim(), verifiability };
        if (extra.value !== undefined)
            c.value = extra.value;
        if (extra.unit !== undefined)
            c.unit = extra.unit;
        if (extra.issue !== undefined)
            c.issue = extra.issue;
        add(c);
    };
    // fixes / closes / resolves #N — including comma/"and" lists: "fixes #1, #2, and #3"
    for (const m of text.matchAll(/\b(fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+(#\d+(?:[ \t,]*(?:and[ \t]+|&[ \t]*)?#\d+)*)/gi)) {
        const kw = m[1];
        for (const im of m[2].matchAll(/#(\d+)/g)) {
            claim("fixes", m, "deterministic", { issue: Number(im[1]), raw: `${kw} #${im[1]}` });
        }
    }
    // perf
    for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*(%|x)\s*(?:faster|slower|speed-?up|quicker)\b/gi)) {
        claim("perf", m, "reproduction", { value: Number(m[1]), unit: m[2].toLowerCase() });
    }
    for (const m of text.matchAll(/\b(?:faster|slower|speed-?up|quicker|improved?)\s+by\s+(\d+(?:\.\d+)?)\s*(%|x|ms|s)\b/gi)) {
        claim("perf", m, "reproduction", { value: Number(m[1]), unit: m[2].toLowerCase() });
    }
    for (const m of text.matchAll(/\b(?:reduce[sd]?|cut[s]?|lower[sd]?|shave[sd]?)\b[^.\n]{0,40}?\bby\s+(\d+(?:\.\d+)?)\s*(%|ms|s)\b/gi)) {
        claim("perf", m, "reproduction", { value: Number(m[1]), unit: m[2].toLowerCase() });
    }
    // coverage
    for (const m of text.matchAll(/\bcoverage\s+(?:to|by|of|from\s+\d+%\s+to)\s+(\d+(?:\.\d+)?)\s*%/gi)) {
        claim("coverage", m, "reproduction", { value: Number(m[1]), unit: "%" });
    }
    for (const m of text.matchAll(/\b(?:add(?:s|ed)?|include[sd]?|with|wrote)\s+(?:new\s+|unit\s+|integration\s+|end-to-end\s+|e2e\s+)?tests?\b/gi)) {
        claim("coverage", m, "deterministic");
    }
    // size
    for (const m of text.matchAll(/\b(\d+)\s+files?\s+changed\b/gi)) {
        claim("size", m, "deterministic", { value: Number(m[1]), unit: "files" });
    }
    for (const m of text.matchAll(/\bchanges?\s+(\d+)\s+files?\b/gi)) {
        claim("size", m, "deterministic", { value: Number(m[1]), unit: "files" });
    }
    for (const m of text.matchAll(/\b(?:remove[sd]?|delete[sd]?|add(?:s|ed)?)\s+(\d+)\s+lines?\b/gi)) {
        claim("size", m, "deterministic", { value: Number(m[1]), unit: "lines" });
    }
    for (const m of text.matchAll(/\b(?:zero|no)\s+(?:new\s+|runtime\s+|external\s+)?dependencies\b/gi)) {
        claim("size", m, "deterministic", { value: 0, unit: "dependencies" });
    }
    // compat
    for (const m of text.matchAll(/\bno\s+breaking\s+changes?\b/gi)) {
        claim("compat", m, "manual");
    }
    for (const m of text.matchAll(/\b(?:backwards?[\s-]?compatible|non-breaking)\b/gi)) {
        claim("compat", m, "manual");
    }
    return claims;
}
