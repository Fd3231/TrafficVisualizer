import { describe, it, expect } from "vitest";
import { Issues } from "../../../utils/parser/core/issues";
import type { Problem } from "../../../utils/parser/core/read_problem";
import { build } from "../../../utils/parser/traffic/build";
import { Junction } from "../../../models/Junctions";
import { Stage } from "../../../models/Stage";
import { Configuration } from "../../../models/Configuration";
import { Flow } from "../../../models/Flow";

const obj = (id: string, type: string, line = 1) => ({ id, type, line });
const pred = (name: string, args: string[], line = 1) => ({ name, args, line });
const fluent = (name: string, args: string[], value: number, line = 1) => ({ name, args, value, line });

const run = (p: Partial<Problem>) => {
    const issues = new Issues();
    const data = build({ objects: [], predicates: [], fluents: [], ...p } as Problem, issues);
    return { data, issues };
};

const codes = (issues: Issues) => issues.list.map((i) => [i.code, i.line]);

describe("build objects", () => {

    it("creates one model per object type", () => {
        const { data, issues } = run({
            objects: [obj("wrac1", "junction"), obj("wrac1_stage1", "stage"), obj("conf_wrac1_1", "configuration"), obj("wrac1_y_wrbc1", "link")],
        });
        expect(data.junctions["wrac1"]).toBeInstanceOf(Junction);
        expect(data.stages["wrac1_stage1"]).toBeInstanceOf(Stage);
        expect(data.configurations["conf_wrac1_1"]).toBeInstanceOf(Configuration);
        expect(Object.keys(data.links)).toEqual(["wrac1_y_wrbc1"]);
        expect(issues.list).toEqual([]);
    })

    it("ignores 'fake' and 'outside' objects", () => {
        const { data, issues } = run({ objects: [obj("fake", "junction"), obj("outside", "link")] });

        expect(data.junctions).toEqual({});
        expect(data.links).toEqual({});
        expect(issues.list).toEqual([]);
    });

    it("parses link source and destination from the name", () => {
        const { data } = run({ objects: [obj("wrac1_y_wrbc1", "link")] });

        expect(data.links["wrac1_y_wrbc1"]).toMatchObject({ source: "wrac1", destination: "wrbc1" });
    });

    it("reports wrong link naming", () => {
        const { data, issues } = run({ objects: [obj("wrong", "link", 4)] });

        expect(codes(issues)).toEqual([["LINK_NAME_FORMAT", 4]]);
        expect(data.links["wrong"]).toBeDefined();
    });

    it("reports an unknown type", () => {
        const { issues } = run({ objects: [obj("x", "test", 2)] });

        expect(codes(issues)).toEqual([["UNKNOWN_TYPE", 2]]);
    });
})

describe("build predicates", () => {
    const objects = [obj("wrac1", "junction"), obj("wrac1_stage1", "stage"), obj("conf_wrac1_1", "configuration")];

    it("'contains' predicate", () => {
        const { data, issues } = run({ objects, predicates: [pred("contains", ["wrac1", "wrac1_stage1"])] });

        expect(data.stages["wrac1_stage1"].juncId).toBe("wrac1");
        expect(issues.hasErrors).toBe(false);
    })

    it("active and inter predicates", () => {
        const { data } = run({ objects, predicates: [pred("active", ["wrac1_stage1"]), pred("inter", ["wrac1_stage1"])] });

        expect(data.stages["wrac1_stage1"]).toMatchObject({ active: true, inter: true });
    });

    it("activeconf predicate", () => {
        const { data } = run({ objects, predicates: [pred("activeconf", ["wrac1", "conf_wrac1_1"])] });

        expect(data.configurations["conf_wrac1_1"].active).toBe(true);
    });

    it("reports an undeclared name with its line", () => {
        const { issues } = run({ objects, predicates: [pred("active", ["wrong_name"], 7)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 7]]);
    });

    it("reports an undeclared name used with the wrong type", () => {
        const { issues } = run({ objects, predicates: [pred("active", ["wrac1"], 3)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 3]]);
    });

    it("reports each undeclared argument of contains", () => {
        const { issues } = run({ predicates: [pred("contains", ["wrac1", "wrac1_stage1"], 5)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 5], ["UNKNOWN_NAME", 5]]);
    });

    it("reports wrong arity", () => {
        const { data, issues } = run({ objects, predicates: [pred("active", ["wrac1_stage1", "wrac1_stage1"], 2)] });

        expect(codes(issues)).toEqual([["WRONG_ARITY", 2]]);
        expect(data.stages["wrac1_stage1"].active).toBe(false);
    });

    it("skips predicates that mention fake/outside", () => {
        const { issues } = run({ objects, predicates: [pred("contains", ["fake", "wrac1_stage1"])] });

        expect(issues.list).toEqual([]);
    });

    it.each([
        ["contains", ["wrac1", "wrong"]],
        ["contains", ["wrong", "wrac1_stage1"]],
        ["active", ["wrong"]],
        ["inter", ["wrong"]],
        ["activeconf", ["wrac1", "wrong"]],
    ])("reports an undeclared target for %s %j", (name, args) => {
        const { issues } = run({ objects, predicates: [pred(name, args, 6)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 6]]);
    });

})

describe("build fluents", () => {
    const objects = [obj("wrac1", "junction"), obj("wrac1_stage1", "stage"), obj("wrac1_y_wrbc1", "link"), obj("conf_wrac1_1", "configuration")];

    it("sets link fluents", () => {
        const { data } = run({
            objects,
            fluents: [fluent("capacity", ["wrac1_y_wrbc1"], 10), fluent("occupancy", ["wrac1_y_wrbc1"], 4), fluent("counter", ["wrac1_y_wrbc1"], 2)],
        });
        
        expect(data.links["wrac1_y_wrbc1"]).toMatchObject({ capacity: 10, occupancy: 4, counter: 2 });
    });

    it("sets junction fluents", () => {
        const { data } = run({
            objects,
            fluents: [fluent("greentime", ["wrac1"], 30), fluent("intertime", ["wrac1"], 5), fluent("countcycle", ["wrac1"], 1),
            ],
        });

        expect(data.junctions["wrac1"]).toMatchObject({ greentime: 30, intertime: 5, countcycle: 1 });
    });

    it("interlimit fluent", () => {
        const { data } = run({ objects, fluents: [fluent("interlimit", ["wrac1_stage1"], 8)] });

        expect(data.stages["wrac1_stage1"].interlimit).toBe(8);
    });

    it("turnrate fluent", () => {
        const { data } = run({ objects, fluents: [fluent("turnrate", ["wrac1_stage1", "wrac1", "wrbc1"], 0.5)] });

        expect(data.stages["wrac1_stage1"].flows).toEqual([new Flow("wrac1", "wrbc1", 0.5)]);
    });

    it("confgreentime fluent", () => {
        const { data } = run({
            objects,
            fluents: [fluent("confgreentime", ["wrac1_stage1", "conf_wrac1_1"], 12), fluent("confgreentime", ["wrac1_stage1", "conf_wrac1_1"], 15)],
        });

        expect(data.configurations["conf_wrac1_1"].stages).toEqual({ wrac1_stage1: [["wrac1_stage1", 12], ["wrac1_stage1", 15]] });
    });

    it("reports an undeclared name with its line", () => {
        const { issues } = run({ objects, fluents: [fluent("capacity", ["wrong"], 1, 9)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 9]]);
    });

    it("reports wrong arity", () => {
        const { data, issues } = run({ objects, fluents: [fluent("capacity", [], 1, 3)] });

        expect(codes(issues)).toEqual([["WRONG_ARITY", 3]]);
        expect(data.links["wrac1_y_wrbc1"].capacity).not.toBe(1);
    });

    it("skips fluents that mention fake/outside", () => {
        const { issues } = run({ objects, fluents: [fluent("capacity", ["outside"], 1)] });

        expect(issues.list).toEqual([]);
    });

    it.each([
        ["capacity", ["wrong"]],
        ["occupancy", ["wrong"]],
        ["counter", ["wrong"]],
        ["greentime", ["wrong"]],
        ["intertime", ["wrong"]],
        ["countcycle", ["wrong"]],
        ["interlimit", ["wrong"]],
        ["turnrate", ["wrong", "wrac1", "wrbc1"]],
        ["confgreentime", ["wrong", "conf_wrac1_1"]],
        ["confgreentime", ["wrac1_stage1", "wrong"]],
    ])("reports an undeclared target for %s %j", (name, args) => {
        const { issues } = run({ objects, fluents: [fluent(name, args, 1, 8)] });

        expect(codes(issues)).toEqual([["UNKNOWN_NAME", 8]]);
    });

})