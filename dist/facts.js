import { execFileSync } from "node:child_process";
function gh(args) {
    return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}
/** Fetch a PR's title, body, and diff stats via the `gh` CLI. Not unit-tested (needs gh + network). */
export function ghPr(repo, pr) {
    const view = JSON.parse(gh(["pr", "view", String(pr), "--repo", repo, "--json", "title,body,files"]));
    const files = view.files ?? [];
    const diff = {
        filesChanged: files.length,
        additions: files.reduce((n, f) => n + (f.additions ?? 0), 0),
        deletions: files.reduce((n, f) => n + (f.deletions ?? 0), 0),
        files: files.map((f) => f.path),
    };
    return { title: view.title ?? "", body: view.body ?? "", diff };
}
/** Whether an issue exists/is accessible in the repo. */
export function ghIssueExists(repo, issue) {
    try {
        gh(["issue", "view", String(issue), "--repo", repo, "--json", "number"]);
        return true;
    }
    catch {
        return false;
    }
}
function pkgAt(repo, ref) {
    try {
        return JSON.parse(gh(["api", "-H", "Accept: application/vnd.github.raw", `repos/${repo}/contents/package.json?ref=${encodeURIComponent(ref)}`]));
    }
    catch {
        return null;
    }
}
/**
 * Count runtime dependencies the PR adds to the root package.json (0 = none),
 * or null if it can't be determined — never guessed.
 */
export function ghAddedRuntimeDeps(repo, pr) {
    try {
        const meta = JSON.parse(gh(["pr", "view", String(pr), "--repo", repo, "--json", "baseRefName,headRefOid,files"]));
        const touchesPkg = (meta.files ?? []).some((f) => f.path === "package.json");
        if (!touchesPkg)
            return 0; // root package.json unchanged -> no runtime deps added
        if (!meta.baseRefName || !meta.headRefOid)
            return null;
        const head = pkgAt(repo, meta.headRefOid);
        if (!head)
            return null;
        const baseDeps = new Set(Object.keys(pkgAt(repo, meta.baseRefName)?.dependencies ?? {}));
        return Object.keys(head.dependencies ?? {}).filter((k) => !baseDeps.has(k)).length;
    }
    catch {
        return null;
    }
}
