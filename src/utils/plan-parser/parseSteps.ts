import { Configuration } from "../../models/Configuration";
import { Junction } from "../../models/Junctions";
import { Link } from "../../models/Link";
import { Stage } from "../../models/Stage";
import { Step } from "../../models/Step";
import type { StepBlock } from "./splitSections";
import { tokenize, type Token } from "./tokenize";

const LINK_ID = /^(\w+)_\w+_(\w+)$/;

const num = (raw: string) => parseFloat(raw);
const bool = (raw: string) => raw.toLowerCase() === "true";

function getOrCreate<T>(map: Map<string, T>, id: string, create: (id: string) => T): T {
    let item = map.get(id);
    if (!item) {
        item = create(id);
        map.set(id, item);
    }
    return item;
}

export function parseSteps(blocks: StepBlock[]) : Step[] {
    
    const steps: Step[] = [];
    let previousTime: number | null = null;

    for (const block of blocks) {
        if (block.time === previousTime) continue;
        previousTime = block.time;

        const step = buildStep(block.time, tokenize(block.text));
        if (step) steps.push(step);
    }

    return steps;

}

export function buildStep(time: number, tokens: Token[]): Step | null {

    const links = new Map<string, Link>();
    const junctions = new Map<string, Junction>();
    const stages = new Map<string, Stage>();
    const configurations = new Map<string, Configuration>();

    const junction = (id: string) => getOrCreate(junctions, id, (i) => new Junction(i));
    const stage = (id: string) => getOrCreate(stages, id, (i) => new Stage(i));

    const link = (id: string) => {
        const m = LINK_ID.exec(id);
        if (!m) return null;
        const l = getOrCreate(links, id, (i) => new Link(i));
        l.source = m[1];
        l.destination = m[2];
        return l;
    };

    for (const {kind, args, value} of tokens) {
        switch(kind) {
            case "occupancy": {
                const l = link(args[0]);
                if (l) l.occupancy = num(value);
                break;
            }
            case "counter": {
                const l = link(args[0]);
                if (l) l.counter = num(value);
                break;
            }
            case "countcycle": junction(args[0]).countcycle = num(value); break;
            case "greentime": junction(args[0]).greentime = num(value); break;
            case "intertime": junction(args[0]).intertime = num(value); break;
            case "active": stage(args[0]).active = bool(value); break;
            case "inter": stage(args[0]).inter = bool(value); break;
            case "activeconf": {
                getOrCreate(configurations, args[1], (i) => new Configuration(i)).active = bool(value);
                break;
            }
            default:
                break;
        }
    }

    if (links.size === 0 || junctions.size === 0) return null;

    const step = new Step(time);
    step.links.push(...links.values());
    step.junctions.push(...junctions.values());
    step.stages.push(...stages.values());
    step.configurations.push(...configurations.values());
    
    return step;

}