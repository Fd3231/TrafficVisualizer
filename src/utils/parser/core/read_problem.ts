import type { Issues } from "./issues";
import { headOf, isAtom, isList, type Atom, type List, type SExpr } from "./sexpr";

export interface TypedName { id: string; type: string; line: number }
export interface Predicate { name: string; args: string[]; line: number }
export interface Fluent { name: string; args: string[]; value: number; line: number }

export interface Problem { objects: TypedName[]; predicates: Predicate[]; fluents: Fluent[] }

const nameOf = (x?: SExpr) => (isAtom(x) ? x.lower : "");
const argsOf = (list: List) => list.items.slice(1).map(nameOf);

export function readProblem(forms: SExpr[], issues: Issues): Problem | undefined {
    
    const define = forms[0];
      if (!isList(define) || headOf(define) !== "define") {
        issues.error("NO_DEFINE", "Expected (define ...)");
        return;
      }

    const problem: Problem = { objects: [], predicates: [], fluents: [] };
    
    for (const section of define.items) {
        if (!isList(section)) continue;
        
        const body = section.items.slice(1);
        switch (headOf(section)) {
          case ":objects": problem.objects = readTypedNames(body, issues); break;
          case ":init": readInit(body, problem, issues); break;
        }
    }

    return problem;
}


export function readTypedNames(items: SExpr[], issues: Issues): TypedName[] {
    const result: TypedName[] = [];
    let pending: Atom[] = [];

    const flush = (type: string) => {
        pending.forEach(a => result.push({ id: a.lower, type, line: a.line }));
        pending = [];
    };

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!isAtom(item)) {
            issues.error("INVALID_OBJECT", "Expected an object name", item.line);
            continue;
        }

        if (item.value === "-") {
            flush(nameOf(items[++i])); // the word after '-' is the type
        } else {
            pending.push(item);
        }
    }
    
    flush("object"); // type "object" for not-typed objects
    
    return result;
}

function readInit(items: SExpr[], problem: Problem, issues: Issues) {
    for (const item of items) {

        if (!isList(item)) {
            issues.error("INVALID_INIT", "Expected a parenthesised element in :init", item.line);
            continue;
        }
      
        if (headOf(item) === "=") {
            const fluent = readFluent(item, issues);
            if (fluent) problem.fluents.push(fluent);
        } else {
            problem.predicates.push({ name: headOf(item), args: argsOf(item), line: item.line });
        }
    }
}

export function readFluent(item: List, issues: Issues): Fluent | undefined {
    const [, term, val] = item.items;
    const value = isAtom(val) ? Number(val.value) : NaN;
    
    if (!isList(term) || !Number.isFinite(value)) {
        issues.error("INVALID_FLUENT", "Expected (= (function args...) number)", item.line);
        return;
    }
    
    return { name: headOf(term), args: argsOf(term), value, line: item.line };
}