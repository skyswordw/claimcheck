#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extractClaims } from "./extract.js";
import { verifyAll } from "./verify.js";
import { renderMarkdown, renderJson, summarize } from "./receipt.js";
import { ghPr as realGhPr, ghIssueExists as realGhIssueExists, ghAddedRuntimeDeps as realGhAddedRuntimeDeps, } from "./facts.js";
const VERSION = "0.1.0";
const HELP = `claimcheck ${VERSION} — a CI receipt for the claims your PR makes

Extracts a pull request's factual claims and verifies the checkable ones,
honestly flagging perf/coverage as UNVERIFIED (never overclaimed).

Usage:
  claimcheck <pr.json> [options]
  claimcheck --repo <owner/name> --pr <number> [options]

Modes:
  <pr.json>            A JSON file: { "title"?, "body", "facts": {
                         "diff": { "filesChanged", "additions", "deletions", "files": [] },
                         "existingIssues": [..] | null, "addedRuntimeDeps": n | null } }
  --repo / --pr        Fetch the PR live via the gh CLI

Options:
      --json           Output the receipt as JSON
      --fail-on-refuted  Exit non-zero if any claim is refuted (default: on)
      --no-fail        Never exit non-zero on refuted claims
  -h, --help           Show this help
  -v, --version        Show version
`;
function uniqueIssues(claims) {
    const set = new Set();
    for (const c of claims)
        if (c.kind === "fixes" && c.issue !== undefined)
            set.add(c.issue);
    return [...set];
}
export function runCli(argv, deps = {}) {
    let parsed;
    try {
        parsed = parseArgs({
            args: argv,
            allowPositionals: true,
            options: {
                repo: { type: "string" },
                pr: { type: "string" },
                json: { type: "boolean", default: false },
                "fail-on-refuted": { type: "boolean", default: true },
                "no-fail": { type: "boolean", default: false },
                help: { type: "boolean", short: "h", default: false },
                version: { type: "boolean", short: "v", default: false },
            },
        });
    }
    catch (err) {
        return { output: `error: ${err.message}\n\n${HELP}`, exitCode: 2 };
    }
    const { values, positionals } = parsed;
    if (values.help)
        return { output: HELP, exitCode: 0 };
    if (values.version)
        return { output: `${VERSION}\n`, exitCode: 0 };
    let text;
    let facts;
    try {
        if (values.repo && values.pr) {
            const ghPr = deps.ghPr ?? realGhPr;
            const ghIssueExists = deps.ghIssueExists ?? realGhIssueExists;
            const pr = ghPr(values.repo, Number(values.pr));
            text = `${pr.title}\n\n${pr.body}`;
            const ghAddedRuntimeDeps = deps.ghAddedRuntimeDeps ?? realGhAddedRuntimeDeps;
            const issues = uniqueIssues(extractClaims(text));
            const existingIssues = issues.filter((n) => ghIssueExists(values.repo, n));
            facts = { diff: pr.diff, existingIssues, addedRuntimeDeps: ghAddedRuntimeDeps(values.repo, Number(values.pr)) };
        }
        else if (positionals.length) {
            const input = JSON.parse(readFileSync(positionals[0], "utf8"));
            if (!input || typeof input.body !== "string" || !input.facts || !input.facts.diff) {
                return { output: `error: ${positionals[0]} must be { body, facts: { diff, existingIssues, addedRuntimeDeps } }`, exitCode: 2 };
            }
            text = `${input.title ?? ""}\n\n${input.body}`;
            facts = input.facts;
        }
        else {
            return { output: `error: provide a <pr.json> file or --repo <owner/name> --pr <number>\n\n${HELP}`, exitCode: 2 };
        }
    }
    catch (err) {
        return { output: `error: ${err.message}`, exitCode: 2 };
    }
    const verdicts = verifyAll(extractClaims(text), facts);
    const output = values.json ? renderJson(verdicts) : renderMarkdown(verdicts);
    const fail = values["fail-on-refuted"] && !values["no-fail"] && summarize(verdicts).refuted > 0;
    return { output, exitCode: fail ? 1 : 0 };
}
function isMain() {
    const entry = process.argv[1];
    if (!entry)
        return false;
    try {
        return realpathSync(entry) === fileURLToPath(import.meta.url);
    }
    catch {
        return false;
    }
}
if (isMain()) {
    const res = runCli(process.argv.slice(2));
    process.stdout.write(res.output.endsWith("\n") ? res.output : res.output + "\n");
    process.exit(res.exitCode);
}
