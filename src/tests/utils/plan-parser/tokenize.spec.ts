import { describe, expect, it } from "vitest";
import { tokenize } from "../../../utils/plan-parser/tokenize";

describe("tokenize", () => {
    
    it.each([
        ["(occupancy wrac1_y_wrbc1)=1.5", [{ kind: "occupancy", args: ["wrac1_y_wrbc1"], value: "1.5" }]],
        ["(activeconf wrec1 conf_wrec1_3)=false", [{ kind: "activeconf", args: ["wrec1", "conf_wrec1_3"], value: "false" }]],
        ["(time)=0", [{ kind: "time", args: [], value: "0" }]]
    ])("parses %s", (input, expected) => {
        expect(tokenize(input)).toEqual(expected);
    });

    it("returns tokens in order", () => {
        const out = tokenize("Time: 1.0 -> (greentime wrac1)=14.0 (intertime wrac1)=0.0 (time)=1.0");
            expect(out.map(t => t.kind)).toEqual(["greentime", "intertime", "time"]);
    });

    it("ignores action lines", () => {
        expect(tokenize("41.0:(changeConfiguration wrac1_stage4 wrac1 conf_wrac1_1 conf_wrac1_2)")).toEqual([]);
    });

    it("returns an empty array for empty or non-matching input", () => {
        expect(tokenize("")).toEqual([]);
        expect(tokenize("Plan End at: 1907.0")).toEqual([]);
    });

    it("works across line breaks", () => {
        const out = tokenize("(greentime j1)=1 \n(active s1)=true");
        expect(out.map(t => t.kind)).toEqual(["greentime", "active"]);
    });

})