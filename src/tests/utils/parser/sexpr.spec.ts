import { describe, it, expect } from "vitest";
import { headOf, isAtom, isList, readSExprs, tokenize } from "../../../utils/parser/core/sexpr";
import { Issues } from "../../../utils/parser/core/issues";

describe("tokenize", () => {
    
    it("splits parens and atoms", () => {
        expect(tokenize("(a b)").map((t) => t.text)).toEqual(["(", "a", "b", ")"])
    });

    it("strips comments", () => {
        expect(tokenize("(a b) ; comment").map((t) => t.text)).toEqual(["(", "a", "b", ")"])
    })

    it("tracks line numbers", () => {
        expect(tokenize("a\r\nb\nc")).toEqual([
            { text: "a", line: 1 },
            { text: "b", line: 2 },
            { text: "c", line: 3 },
        ]);
    });

    it("returns to tokens for empty", () => {
        expect(tokenize("")).toEqual([])
    })

})

describe("parse", () => {
    
    it("parses atoms with a lowercase copy", () => {
        const issues = new Issues();
        expect(readSExprs("Foo", issues)).toEqual([
            { kind: "atom", value: "Foo", lower: "foo", line: 1 },
        ]);
        expect(issues.list).toEqual([]);
    });

    it("parses nested lists", () => {
        const issues = new Issues();
        const [root] = readSExprs("(a (b c))", issues);

        expect(root).toMatchObject({
            kind: "list",
            items: [{ value: "a" }, { kind: "list", items: [{ value: "b" }, { value: "c" }] }],
        });
        expect(issues.hasErrors).toBe(false);
    });

    it("reports an unexpected ')'", () => {
        const issues = new Issues();
        const result = readSExprs(") a", issues);

        expect(issues.list).toEqual([
            { severity: "error", code: "UNEXPECTED_CLOSE_PAREN", message: "Unexpected ')'", line: 1 },
        ]);
        expect(result).toHaveLength(1);
    });
    
    it("reports each unclosed '('", () => {
        const issues = new Issues();
        readSExprs("(a\n(b", issues);

        expect(issues.list.map((i) => [i.code, i.line])).toEqual([
            ["UNCLOSED_PAREN", 2],
            ["UNCLOSED_PAREN", 1],
        ]);
        expect(issues.hasErrors).toBe(true);
    });

})

describe("helpers", () => {
    const issues = new Issues();
    const [list] = readSExprs("(define x)", issues);
    const [atom] = readSExprs("x", issues);

    it("isList", () => {
        expect(isList(list)).toBe(true);
        expect(isList(atom)).toBe(false);
    });

    it("isAtom", () => {
        expect(isAtom(atom)).toBe(true);
        expect(isAtom(undefined)).toBe(false);
    });

    it("headOf returns the lowercase first atom, else ''", () => {
        expect(headOf(list)).toBe("define");
        expect(headOf(atom)).toBe("");
        expect(headOf(undefined)).toBe("");
        expect(headOf(readSExprs("((a) b)", issues)[0])).toBe("");
    });
});