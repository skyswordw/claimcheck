import { execFileSync } from "node:child_process";
import type { DiffStats } from "./types.js";

export interface GhPr {
  title: string;
  body: string;
  diff: DiffStats;
}

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

/** Fetch a PR's title, body, and diff stats via the `gh` CLI. Not unit-tested (needs gh + network). */
export function ghPr(repo: string, pr: number): GhPr {
  const view = JSON.parse(gh(["pr", "view", String(pr), "--repo", repo, "--json", "title,body,files"])) as {
    title?: string;
    body?: string;
    files?: Array<{ path: string; additions?: number; deletions?: number }>;
  };
  const files = view.files ?? [];
  const diff: DiffStats = {
    filesChanged: files.length,
    additions: files.reduce((n, f) => n + (f.additions ?? 0), 0),
    deletions: files.reduce((n, f) => n + (f.deletions ?? 0), 0),
    files: files.map((f) => f.path),
  };
  return { title: view.title ?? "", body: view.body ?? "", diff };
}

/** Whether an issue exists/is accessible in the repo. */
export function ghIssueExists(repo: string, issue: number): boolean {
  try {
    gh(["issue", "view", String(issue), "--repo", repo, "--json", "number"]);
    return true;
  } catch {
    return false;
  }
}

function pkgAt(repo: string, ref: string): { dependencies?: Record<string, string> } | null {
  try {
    return JSON.parse(
      gh(["api", "-H", "Accept: application/vnd.github.raw", `repos/${repo}/contents/package.json?ref=${encodeURIComponent(ref)}`])
    );
  } catch {
    return null;
  }
}

/**
 * Count runtime dependencies the PR adds to the root package.json (0 = none),
 * or null if it can't be determined — never guessed.
 */
export function ghAddedRuntimeDeps(repo: string, pr: number): number | null {
  try {
    const meta = JSON.parse(
      gh(["pr", "view", String(pr), "--repo", repo, "--json", "baseRefName,headRefOid,files"])
    ) as { baseRefName?: string; headRefOid?: string; files?: Array<{ path: string }> };
    const touchesPkg = (meta.files ?? []).some((f) => f.path === "package.json");
    if (!touchesPkg) return 0; // root package.json unchanged -> no runtime deps added
    if (!meta.baseRefName || !meta.headRefOid) return null;
    const head = pkgAt(repo, meta.headRefOid);
    if (!head) return null;
    const baseDeps = new Set(Object.keys(pkgAt(repo, meta.baseRefName)?.dependencies ?? {}));
    return Object.keys(head.dependencies ?? {}).filter((k) => !baseDeps.has(k)).length;
  } catch {
    return null;
  }
}
