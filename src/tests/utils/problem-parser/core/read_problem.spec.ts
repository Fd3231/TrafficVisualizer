import { describe, it, expect } from "vitest";
import { Issues } from "../../../../utils/problem-parser/core/issues";
import { readProblem, readTypedNames, readFluent } from "../../../../utils/problem-parser/core/read_problem";
import { readSExprs, type List } from "../../../../utils/problem-parser/core/sexpr";

const read = (src: string) => {
    const issues = new Issues();
    const problem = readProblem(readSExprs(src, issues), issues);
    return { problem, issues };
};

// "(a b - t)" -> [a, b, -, t]
const itemsOf = (src: string) => (readSExprs(`(${src})`, new Issues())[0] as List).items;

describe("readTypedNames", () => {
    const typed = (src: string) => {
        const issues = new Issues();
        const names = readTypedNames(itemsOf(src), issues);
        return { pairs: names.map((n) => [n.id, n.type]), issues };
    };

    it("assigns the type after - to the preceding names", () => {
        const { pairs, issues } = typed("a b - t c d - u");
        expect(pairs).toEqual([
            ["a", "t"],
            ["b", "t"],
            ["c", "u"],
            ["d", "u"],
        ]);
        expect(issues.list).toEqual([]);
    });
    
    it("defaults untyped names to 'object'", () => {
        expect(typed("a b - t c").pairs).toEqual([
            ["a", "t"],
            ["b", "t"],
            ["c", "object"],
        ]);
    });

    it("lowercases names and types", () => {
        expect(typed("A - T").pairs).toEqual([["a", "t"]]);
    });

    it("reports nested lists as INVALID_OBJECT", () => {
        const { pairs, issues } = typed("A (x) - T");
        expect(pairs).toEqual([["a", "t"]]);
        expect(issues.list).toMatchObject([{ severity: "error", code: "INVALID_OBJECT", line: 1 }]);
    });

});

describe("readFluent", () => {
    
    const fluentOf = (src: string) => {
        const issues = new Issues();
        const fluent = readFluent(readSExprs(src, issues)[0] as List, issues);
        return { fluent, issues };
    };

    it("reads name, args and numeric value", () => {
        expect(fluentOf("(= (turnrate wrac1_stage1 hsac3_c_wrac1 wrac1_x_wrbc1) 0.129)").fluent).toMatchObject({
            name: "turnrate",
            args: ["wrac1_stage1", "hsac3_c_wrac1", "wrac1_x_wrbc1"],
            value: 0.129,
            line: 1,
        });
    });

    it.each(["(= (f) abc)", "(= f 5)", "(= (f))", "(= (f) (5))"])("rejects %s", (src) => {
        const { fluent, issues } = fluentOf(src);
        expect(fluent).toBeUndefined();
        expect(issues.list).toMatchObject([{ severity: "error", code: "INVALID_FLUENT", line: 1 }]);
    });

})

describe("readProblem", () => {
    
    it("errors when there is no (define ...)", () => {
        for (const src of ["", "(foo)", "atom"]) {
            const { problem, issues } = read(src);
            expect(problem).toBeUndefined();
            expect(issues.list.map((i) => i.code)).toEqual(["NO_DEFINE"]);
        }
    });

    it("reads objects, predicates and fluents", () => {
        const { problem, issues } = read(`
            (define (problem p)
            (:objects wrac1 wrbc1 - junction wrac1_y_wrbc1 - link)
            (:init
                (controllable wrac1)
                (controllable wrbc1)
                (= (capacity wrac1_y_wrbc1) 55.5)))
        `);

        expect(issues.hasErrors).toBe(false);
        expect(problem!.objects.map((o) => [o.id, o.type])).toEqual([
            ["wrac1", "junction"],
            ["wrbc1", "junction"],
            ["wrac1_y_wrbc1", "link"],
        ]);
        expect(problem!.predicates).toEqual([
            { name: "controllable", args: ["wrac1"], line: 5 },
            { name: "controllable", args: ["wrbc1"], line: 6 },
        ]);
        expect(problem!.fluents).toEqual([
            { name: "capacity", args: ["wrac1_y_wrbc1"], value: 55.5, line: 7 },
        ]);
    });

    it("reports atoms in :init", () => {
        const { problem, issues } = read("(define (:init foo (p a)))");

        expect(issues.list).toMatchObject([{ severity: "error", code: "INVALID_INIT", line: 1 }]);
        expect(problem!.predicates).toEqual([{ name: "p", args: ["a"], line: 1 }]);
    });

    it("maps non-atom arguments to empty strings", () => {
        const { problem } = read("(define (:init (p (x) a)))");

        expect(problem!.predicates).toEqual([{ name: "p", args: ["", "a"], line: 1 }]);
    });

    it("reports invalid fluents but keeps reading the rest", () => {
        const { problem, issues } = read("(define (:init (= (f) x) (p a)))");

        expect(issues.list.map((i) => i.code)).toEqual(["INVALID_FLUENT"]);
        expect(problem!.fluents).toEqual([]);
        expect(problem!.predicates).toHaveLength(1);
    });

})