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
