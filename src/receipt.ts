import type { Verdict, VerdictStatus } from "./types.js";

const MARK: Record<VerdictStatus, string> = { verified: "✅", refuted: "❌", unverified: "⚠️" };

export interface ReceiptSummary {
  total: number;
  verified: number;
  refuted: number;
  unverified: number;
}

export function summarize(vs: Verdict[]): ReceiptSummary {
  const s: ReceiptSummary = { total: vs.length, verified: 0, refuted: 0, unverified: 0 };
  for (const v of vs) s[v.status]++;
  return s;
}

const cell = (s: string): string => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

/** A PR-comment-ready receipt. Honest: it never claims to confirm what it didn't check. */
export function renderMarkdown(vs: Verdict[]): string {
  const s = summarize(vs);
  const out: string[] = ["## claimcheck receipt", ""];
  if (vs.length === 0) {
    out.push("_No factual claims detected in this PR._");
    return out.join("\n");
  }
  out.push("| | claim | result |", "|---|---|---|");
  for (const v of vs) {
    const detail = v.detail + (v.measured ? ` (${v.measured})` : "");
    out.push(`| ${MARK[v.status]} | ${cell(v.claim.raw)} | ${cell(detail)} |`);
  }
  out.push("", `**${s.total} claim(s) — ${s.verified} verified · ${s.refuted} refuted · ${s.unverified} unverified.**`);
  if (s.unverified > 0) {
    out.push(
      "",
      "> ⚠️ Unverified claims are **not** auto-confirmed — they need a benchmark/coverage run or human judgement. claimcheck only confirms what is checkable from the diff."
    );
  }
  return out.join("\n");
}

export function renderJson(vs: Verdict[]): string {
  return JSON.stringify({ summary: summarize(vs), verdicts: vs }, null, 2);
}
