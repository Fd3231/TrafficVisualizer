import { describe, it, expect } from "vitest";
import { buildStep, parseSteps } from "../../../utils/plan-parser/parseSteps";
import type { Token } from "../../../utils/plan-parser/tokenize";

const block = (time: number, text: string) => ({ time, text });
const tok = (kind: string, args: string[], value: string) => ({ kind, args, value }) as Token;

const VALID = [
    tok("occupancy", ["wrac1_y_wrbc1"], "1.0"),
    tok("greentime", ["wrac1"], "3.0"),
];
const VALID_TEXT = "(occupancy wrac1_y_wrbc1)=1 (greentime wrac1)=3";

describe("parseSteps", () => {
    
    it("builds links, junctions, stages and configurations", () => {
        const [step] = parseSteps([
            block(
              1,
              "Time: 1 -> (occupancy wrac1_y_wrbc1)=20.5 (counter wrac1_y_wrbc1)=0.3 " +
                "(greentime wrac1)=14.0 (intertime wrac1)=0.0 (countcycle wrac1)=2 (time)=1\n" +
                "(active wrac1_stage1)=true (inter wrac1_stage1)=false (activeconf wrac1 conf_wrac1_1)=true"
            ),
        ]);

        expect(step.timestamp).toBe(1);
        expect(step.links[0]).toMatchObject({ id: "wrac1_y_wrbc1", occupancy: 20.5, counter: 0.3, source: "wrac1", destination: "wrbc1" });
        expect(step.junctions[0]).toMatchObject({ id: "wrac1", greentime: 14, intertime: 0, countcycle: 2 });
        expect(step.stages[0]).toMatchObject({ id: "wrac1_stage1", active: true, inter: false });
        expect(step.configurations[0]).toMatchObject({ id: "conf_wrac1_1", active: true });
    });

    it("returns an empty array for no blocks", () => {
        expect(parseSteps([])).toEqual([]);
    });


    it("skips consecutive blocks with the same timestamp", () => {
        const steps = parseSteps([block(1, VALID_TEXT), block(1, VALID_TEXT), block(2, VALID_TEXT)]);
        expect(steps.map((s) => s.timestamp)).toEqual([1, 2]);
    }); 

    it("drops blocks that don't produce a valid step", () => {
        const steps = parseSteps([block(1, "nothing"), block(2, VALID_TEXT)]);
        expect(steps.map((s) => s.timestamp)).toEqual([2]);
    });

});

describe("buildStep", () => {

    it("returns null when there are no links", () => {
        expect(buildStep(1, [tok("greentime", ["wrac1"], "3.0")])).toBeNull();
    });

    it("returns null when there are no junctions", () => {
        expect(buildStep(1, [tok("occupancy", ["wrac1_y_wrbc1"], "1.0")])).toBeNull();
    });

    it.each(["occupancy", "counter"])("ignores %s tokens with wrong link id", (kind) => {
        const step = buildStep(1, [...VALID, tok(kind, ["outside"], "5")]);
        expect(step!.links).toHaveLength(1);
    });

    it("merges tokens for the same type into one object", () => {
        const step = buildStep(1, [
            ...VALID,
            tok("counter", ["wrac1_y_wrbc1"], "0.5"),
            tok("intertime", ["wrac1"], "2.0'"),
        ]);

        expect(step!.links).toHaveLength(1);
        expect(step!.links[0]).toMatchObject({ occupancy: 1, counter: 0.5 });
        expect(step!.junctions).toHaveLength(1);
        expect(step!.junctions[0]).toMatchObject({ greentime: 3, intertime: 2 });
    });

    it.each([
        ["true", true],
        ["TRUE", true],
        ["false", false],
    ])("parses boolean %s as %s", (raw, expected) => {
        const step = buildStep(1, [...VALID, tok("active", ["wrac1_stage1"], raw)]);
        expect(step!.stages[0].active).toBe(expected);
    });

    it("ignores unknown token kinds", () => {
        const step = buildStep(1, [...VALID, tok("time", [], "1")]);
        expect(step).not.toBeNull();
        expect(step!.stages).toHaveLength(0);
        expect(step!.configurations).toHaveLength(0);
    });


})