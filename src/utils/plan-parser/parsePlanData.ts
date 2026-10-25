import type { ChangeConfiguration } from "../../models/ChangeConfiguration";
import type { Step } from "../../models/Step";
import { PlanErrors } from "./errors";
import { parseActions } from "./parseActions";
import { parseSteps } from "./parseSteps";
import { splitSections } from "./splitSections";

export interface ParsedData {
    steps: Step[];
    changeConfigurations: Record<number, ChangeConfiguration>;
    errors: PlanErrors
}

export function parsePlanData(raw: string): ParsedData {

    const errors = new PlanErrors();

    const { actionLines, stepBlocks } = splitSections(raw);
    const { changeConfigurations } = parseActions(actionLines, errors);

    return {
        steps: parseSteps(stepBlocks),
        changeConfigurations,
        errors
    };
}