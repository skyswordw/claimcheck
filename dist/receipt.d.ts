import type { Verdict } from "./types.js";
export interface ReceiptSummary {
    total: number;
    verified: number;
    refuted: number;
    unverified: number;
}
export declare function summarize(vs: Verdict[]): ReceiptSummary;
/** A PR-comment-ready receipt. Honest: it never claims to confirm what it didn't check. */
export declare function renderMarkdown(vs: Verdict[]): string;
export declare function renderJson(vs: Verdict[]): string;
