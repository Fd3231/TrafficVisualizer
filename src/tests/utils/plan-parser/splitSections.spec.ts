import { describe, it, expect } from "vitest";
import { splitSections } from "../../../utils/plan-parser/splitSections";

const SAMPLE = [
    "Aibr Preprocessing",
    "41.0:(changeConfiguration wrac1_stage4 wrac1 conf_wrac1_1 conf_wrac1_2)",
    "Plan End at: 1907.0",
    "Time: 0 -> (greentime wrac1)=13.0 (time)=0 ",
    "(active wrac1_stage1)=true ",
    "",
    "Time: 1.0 -> (greentime wrac1)=14.0 (time)=1.0 ",
    "(active wrac1_stage1)=false ",
].join("\n");

describe("splitSections", () => {
    
    it("separates action lines from step blocks", () => {
        const { actionLines, stepBlocks } = splitSections(SAMPLE);
        expect(actionLines).toEqual(["41.0:(changeConfiguration wrac1_stage4 wrac1 conf_wrac1_1 conf_wrac1_2)"]);
        expect(stepBlocks.map(b => b.time)).toEqual([0, 1]);
    });

    it("keeps elements of the same Time in the same step", () => {
        const { stepBlocks } = splitSections(SAMPLE);
        expect(stepBlocks[0].text).toContain("(greentime wrac1)=13.0");
        expect(stepBlocks[0].text).toContain("(active wrac1_stage1)=true");
        expect(stepBlocks[0].text).not.toContain("(greentime wrac1)=14.0");
    });

    it("ignores lines before the first Time", () => {
        const { stepBlocks } = splitSections("(occupancy a_b_c)=1\nTime: 0 -> (time)=0");
        expect(stepBlocks).toHaveLength(1);
        expect(stepBlocks[0].text).not.toContain("occupancy");
    });

    it("does not collect actions after the first step", () => {
        const { actionLines, stepBlocks } = splitSections(
          "Time: 0 -> (time)=0\n5.0:(changeConfiguration wrbc1_stage3 wrbc1 conf_wrbc1_1 conf_wrbc1_1)\n(active wrac1_stage1)=true"
        );
        expect(actionLines).toHaveLength(0);
        expect(stepBlocks[0].text).toContain("(active wrac1_stage1)=true");
    });

    it("handles CRLF line endings", () => {
        const { stepBlocks } = splitSections("Time: 0 -> (time)=0 \r\n(active wrac1_stage1)=true\r\n");
        expect(stepBlocks[0].text).not.toContain("\r");
    });

    it("returns empty buckets for empty input", () => {
        expect(splitSections("")).toEqual({ actionLines: [], stepBlocks: [] });
    });
});