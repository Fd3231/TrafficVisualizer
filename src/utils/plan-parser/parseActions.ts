import { ChangeConfiguration } from "../../models/ChangeConfiguration";
import { PlanErrors } from "./errors";

export interface Action {
    time: number;
    name: string;
    args: string[];
}

export interface ParsedActions {
  changeConfigurations: Record<number, ChangeConfiguration>;
}

const ACTION_LINE = /^\s*(\d+(?:\.\d+)?):\((\w+)((?:\s+\w+)*)\)\s*$/;

export function parseActionLine(line: string): Action | null {
    const m = ACTION_LINE.exec(line);
    if (!m) return null;
    return {
        time: parseFloat(m[1]),
        name: m[2],
        args: m[3].trim() ? m[3].trim().split(/\s+/) : [],
    };
}

export function parseActions(lines: string[], errors = new PlanErrors()): ParsedActions {
    const changeConfigurations: Record<number, ChangeConfiguration> = {};

    for (const line of lines) {
        const action = parseActionLine(line);
        if (!action) continue;

        switch (action.name) {
            case "changeConfiguration": {
                if (action.args.length != 4) {
                    errors.add("INVALID_CHANGE_CONFIGURATION", `Time ${action.time}: changeConfiguration expects 4 arguments, got ${action.args.length}`);
                    break;
                }
                const [, , fromConf, toConf] = action.args;
                changeConfigurations[action.time] = new ChangeConfiguration(action.time, fromConf, toConf);
                break;
            }
            default:
                break;
        }
    }
    return { changeConfigurations };
}