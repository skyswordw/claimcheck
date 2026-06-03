#!/usr/bin/env node
import { type GhPr } from "./facts.js";
export interface CliResult {
    output: string;
    exitCode: number;
}
export interface CliDeps {
    ghPr?: (repo: string, pr: number) => GhPr;
    ghIssueExists?: (repo: string, issue: number) => boolean;
}
export declare function runCli(argv: string[], deps?: CliDeps): CliResult;
