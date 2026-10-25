import { describe, it, expect, vi } from "vitest";
import { parseProblem, type Domain } from "../../../../utils/problem-parser/core/parse";

const VALID = "(define (problem p) (:objects a - t))";

const makeDomain = (overrides: Partial<Domain<string>> = {}) => {
    const domain: Domain<string> = {
        build: vi.fn(() => "built"),
        validate: vi.fn(),
        ...overrides,
    };
    return domain;
};

describe("parseProblem", () => {

    it("returns the built data when the parsing is successful", () => {
        const domain = makeDomain();
        const result = parseProblem(VALID, domain);

        expect(result).toEqual({ data: "built", issues: [] });
        expect(domain.build).toHaveBeenCalledOnce();
        expect(domain.validate).toHaveBeenCalledWith("built", expect.anything());
    });

    it("passes the parsed problem to build", () => {
        const domain = makeDomain();
        parseProblem(VALID, domain);

        const [problem] = vi.mocked(domain.build).mock.calls[0];
        expect(problem.objects.map((o) => o.id)).toEqual(["a"]);
    });

    it("stops after sexpr errors", () => {
        const domain = makeDomain();
        const result = parseProblem("(define", domain);

        expect(result.data).toBeNull();
        expect(result.issues.map((i) => i.code)).toEqual(["UNCLOSED_PAREN"]);
        expect(domain.build).not.toHaveBeenCalled();
        expect(domain.validate).not.toHaveBeenCalled();
    });

    it("stops after readProblem errors", () => {
        const domain = makeDomain();
        const result = parseProblem("(foo)", domain);

        expect(result.data).toBeNull();
        expect(result.issues.map((i) => i.code)).toEqual(["NO_DEFINE"]);
        expect(domain.build).not.toHaveBeenCalled();
    });

    it("stops after build errors", () => {
        const domain = makeDomain({
            build: vi.fn((_p, issues) => {
                issues.error("BUILD_ERROR", "build error");
                return "";
            }),
        });
        const result = parseProblem(VALID, domain);

        expect(result.data).toBeNull();
        expect(result.issues.map((i) => i.code)).toEqual(["BUILD_ERROR"]);
        expect(domain.validate).not.toHaveBeenCalled();
    });

    it("stops after validate error", () => {
        const domain = makeDomain({
            validate: vi.fn((_d, issues) => issues.error("VALIDATE_ERROR", "invalid")),
        });
        const result = parseProblem(VALID, domain);

        expect(result.data).toBeNull();
        expect(result.issues.map((i) => i.code)).toEqual(["VALIDATE_ERROR"]);
    });

})
