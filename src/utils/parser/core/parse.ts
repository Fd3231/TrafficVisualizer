import { Issues, type Issue } from "./issues";
import { readSExprs } from "./sexpr";
import { readProblem, type Problem } from "./read_problem";

export interface Domain<T> {
    build(problem: Problem, issues: Issues): T;
    validate(data: T, issues: Issues): void;
}

export interface ParseResult<T> { data: T | null; issues: Issue[] }

export function parseProblem<T>(src: string, domain: Domain<T>): ParseResult<T> {
    const issues = new Issues();
    const data = run(src, domain, issues);
    return { data: issues.hasErrors ? null : data, issues: issues.list };
}

function run<T>(src: string, domain: Domain<T>, issues: Issues): T | null {
    const forms = readSExprs(src, issues);
    if (issues.hasErrors) return null;

    const problem = readProblem(forms, issues);
    if (!problem || issues.hasErrors) return null;

    const data = domain.build(problem, issues);
    if (issues.hasErrors) return null;

    domain.validate(data, issues);
    if (issues.hasErrors) return null;
    
    return data;
}