import type { DiffStats } from "./types.js";
export interface GhPr {
    title: string;
    body: string;
    diff: DiffStats;
}
/** Fetch a PR's title, body, and diff stats via the `gh` CLI. Not unit-tested (needs gh + network). */
export declare function ghPr(repo: string, pr: number): GhPr;
/** Whether an issue exists/is accessible in the repo. */
export declare function ghIssueExists(repo: string, issue: number): boolean;
