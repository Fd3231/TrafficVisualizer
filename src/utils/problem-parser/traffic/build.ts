import { emptyData, type ParsedData } from "./types";
import { Configuration } from "../../../models/Configuration";
import { Junction } from "../../../models/Junctions";
import { Link } from "../../../models/Link";
import { Stage } from "../../../models/Stage";
import { Flow } from "../../../models/Flow";
import type { Problem, TypedName, Predicate, Fluent } from "../core/read_problem";
import type { Issues } from "../core/issues";

const TO_IGNORE = new Set(["fake", "outside"]);
const LINK_NAME = /^([^_]+)_[^_]+_([^_]+)$/;
const PREDICATES_ARITY= {
    "controllable": 1,
    "contains": 2,
    "activeconf": 2,
    "active": 1,
    "inter": 1,
    "next": 2,
    "endcycle": 2,
    "availableconf": 2,
} as const satisfies Record<string, number>;

const FLUENTS_ARITY = {
    "capacity": 1,
    "turnrate": 3,
    "confgreentime": 2,
    "occupancy": 1,
    "greentime": 1,
    "intertime": 1,
    "counter": 1,
    "interlimit": 1,
    "countcycle": 1,
    "cyclelimit": 0
} as const satisfies Record<string, number>;

type Get = <T>(table: Record<string, T>, id: string, line: number) => T | undefined;

export function build(problem: Problem, issues: Issues): ParsedData {
    const data = emptyData();

    const get: Get = (table, id, line) => {
        if (!table[id]) issues.error("UNKNOWN_NAME", `'${id}' is not declared with the right type`, line);
        return table[id];
    };
    
    const isReal = (args: string[]) => !args.some(a => TO_IGNORE.has(a));

    for (const o of problem.objects) {
        if (!TO_IGNORE.has(o.id)) addObject(o, data, issues);
    }
    for (const p of problem.predicates) {
        if (isReal(p.args)) applyPredicate(p, data, get, issues);
    }
    for (const f of problem.fluents) {
        if (isReal(f.args)) applyFluent(f, data, get, issues);
    }

    return data;
}

function addObject(o: TypedName, data: ParsedData, issues: Issues) {
    switch (o.type) {
        case "junction": data.junctions[o.id] = new Junction(o.id); break;
        case "stage": data.stages[o.id] = new Stage(o.id); break;
        case "configuration": data.configurations[o.id] = new Configuration(o.id); break;
        case "link": {
            const link = new Link(o.id);
            const m = LINK_NAME.exec(o.id);
            if (m) {
                link.source = m[1];
                link.destination = m[2];
            } else {
                issues.error("LINK_NAME_FORMAT", `Link '${o.id}' should be named <source>_<x>_<destination>`, o.line);
            }

            data.links[o.id] = link;
            break;
        }
        default: issues.error("UNKNOWN_TYPE", `Unknown type '${o.type}' for '${o.id}'`, o.line);
    }
}

function isPredicate(name: string): name is keyof typeof PREDICATES_ARITY {
    return Object.prototype.hasOwnProperty.call(PREDICATES_ARITY, name);
}

function applyPredicate(p: Predicate, data: ParsedData, get: Get, issues: Issues) {
    if (isPredicate(p.name) && p.args.length !== PREDICATES_ARITY[p.name] ) {
        issues.error("WRONG_ARITY", `'${p.name}' expects ${PREDICATES_ARITY[p.name]} argument(s), got ${p.args.length}`, p.line);
        return;
    }
    
    const [a, b] = p.args;
    switch (p.name) {
        case "contains": {
            const junction = get(data.junctions, a, p.line);
            const stage = get(data.stages, b, p.line);
            if (junction && stage) stage.juncId = a;
            break;
        }
        case "active": { 
            const s = get(data.stages, a, p.line); 
            if (s) s.active = true; 
            break; 
        }
        case "inter": { 
            const s = get(data.stages, a, p.line); 
            if (s) s.inter = true; 
            break; 
        }
        case "activeconf": { 
            const c = get(data.configurations, b, p.line); 
            if (c) c.active = true; 
            break; 
        }
    }
}

function isFluent(name: string): name is keyof typeof FLUENTS_ARITY {
    return Object.prototype.hasOwnProperty.call(FLUENTS_ARITY, name);
}

function applyFluent(f: Fluent, data: ParsedData, get: Get, issues: Issues) {
    
    if (isFluent(f.name) && f.args.length !== FLUENTS_ARITY[f.name]) {
        issues.error("WRONG_ARITY", `'${f.name}' expects ${FLUENTS_ARITY[f.name]} argument(s), got ${f.args.length}`, f.line);
        return;
    }

    const [a, b, c] = f.args;
    const { value, line } = f;
    switch (f.name) {
        case "capacity": { 
            const l = get(data.links, a, line); 
            if (l) l.capacity = value; 
            break; 
        }
        case "occupancy": { 
            const l = get(data.links, a, line); 
            if (l) l.occupancy = value; 
            break; 
        }
        case "counter": { 
            const l = get(data.links, a, line); 
            if (l) l.counter = value; 
            break; 
        }
        case "greentime": { 
            const j = get(data.junctions, a, line); 
            if (j) j.greentime = value; 
            break; 
        }
        case "intertime": { 
            const j = get(data.junctions, a, line); 
            if (j) j.intertime = value; 
            break; 
        }
        case "countcycle": { 
            const j = get(data.junctions, a, line); 
            if (j) j.countcycle = value; 
            break; 
        }
        case "interlimit": { 
            const s = get(data.stages, a, line); 
            if (s) s.interlimit = value; 
            break; 
        }
        case "turnrate": {
            const s = get(data.stages, a, line);
            if (s) s.flows.push(new Flow(b, c, value));
            break;
        }
        case "confgreentime": {
            const s = get(data.stages, a, line);
            const conf = get(data.configurations, b, line);
            if (s && conf) (conf.stages[a] ??= []).push([a, value]);
            break;
        }
    }
}