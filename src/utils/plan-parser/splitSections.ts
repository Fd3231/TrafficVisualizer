import { parseActionLine } from "./parseActions";

export interface StepBlock {
    time: number;
    text: string;
}

export interface Sections {
    actionLines: string[];
    stepBlocks: StepBlock[];
}

const TIME_HEADER = /^\s*Time:\s*(\d+(?:\.\d+)?)/;

export function splitSections(raw: string): Sections {
    const actionLines: string[] = [];
    const stepBlocks: StepBlock[] = []
    let parsingSteps = false;

    for (const line of raw.split(/\r?\n/)) {
        if (parseActionLine(line) && !parsingSteps) {
            actionLines.push(line);
            continue;
        }
    
        const header = TIME_HEADER.exec(line);
        if (header) {
            parsingSteps = true;
            stepBlocks.push({time: parseFloat(header[1]), text: line});
        } else if (stepBlocks.length > 0) {
            stepBlocks[stepBlocks.length - 1].text += "\n" + line;
        }
    }
    return { actionLines, stepBlocks }

}