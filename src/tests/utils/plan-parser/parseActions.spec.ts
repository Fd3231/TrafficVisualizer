import { describe, it, expect } from "vitest";
import { parseActionLine, parseActions } from "../../../utils/plan-parser/parseActions";
import { PlanErrors } from "../../../utils/plan-parser/errors";

describe("parseActionLine", () => {

    it("parses name, args and time", () => {
        expect(parseActionLine("41.0:(changeConfiguration wrac1_stage4 wrac1 wrac1_conf_1 wrac1_conf_2)"))
        .toEqual({time: 41, name: "changeConfiguration", args: ["wrac1_stage4", "wrac1", "wrac1_conf_1", "wrac1_conf_2"]})
    });

    it("accepts actions without args", () => {
        expect(parseActionLine("5.0:(reset)")).toEqual({ time: 5.0, name: "reset", args: [] });
    });

    it.each([
        "",
        "Aibr Preprocessing",
        "Plan End at: 1907.0",
        "Time: 0 -> (greentime wrac1)=1.0 (time)=0",
        "(active wrac1_stage1)=true",
    ])("returns null for non-action line %j", (line) => {
        expect(parseActionLine(line)).toBeNull();
    });

});

describe("parseActions", () => {

    it("builds changeConfigurations keyed by time", () => {
        const { changeConfigurations } = parseActions([
            "41.0:(changeConfiguration wrac1_stage4 wrac1 conf_wrac1_1 conf_wrac1_2)",
            "44.0:(changeConfiguration wrcc1_stage6 wrcc1 conf_wrcc1_1 conf_wrcc1_2)"
        ]);
        expect(Object.keys(changeConfigurations).map(Number)).toEqual([41, 44]);
        expect(changeConfigurations[41]).toMatchObject({ time: 41, fromConf: "conf_wrac1_1", toConf: "conf_wrac1_2" });
        expect(changeConfigurations[44]).toMatchObject({ time: 44, fromConf: "conf_wrcc1_1", toConf: "conf_wrcc1_2" });
    });

    it("ignores unknown actions and non-action lines", () => {
        expect(parseActions(["7.0:(test a b)", "action"]).changeConfigurations).toEqual({});
    });

    it("returns empty results for no lines", () => {
        expect(parseActions([]).changeConfigurations).toEqual({});
    });

    it.each([
        "41.0:(changeConfiguration wrac1_stage4)",
        "41.0:(changeConfiguration wrac1_stage4 wrac1 conf_wrac1_1)",
    ])("records an error for invalid changeConfiguration: %s", (line) => {
        const errors = new PlanErrors();
        const { changeConfigurations } = parseActions([line], errors);

        expect(changeConfigurations).toEqual({});
        expect(errors.list).toEqual([
            expect.objectContaining({ code: "INVALID_CHANGE_CONFIGURATION" }),
        ]);
    });
    
})