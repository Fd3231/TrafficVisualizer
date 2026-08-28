import { ChangeConfiguration } from "../models/ChangeConfiguration";
import { Junction } from "../models/Junctions";
import { Link } from "../models/Link";
import { Stage } from "../models/Stage";
import { Step } from "../models/Step";
import { Configuration } from "../models/Configuration";

interface ParsedData {
  steps: Step[];
  changeConfigurations: Record<number,ChangeConfiguration>;
}

export function parsePlanData(rawData: string): ParsedData {
    const r = /\s*\(time\)=\d+(\.\d+)?\s*\n/g;
    rawData = rawData.replace(r, " ");
    const lines = rawData.split("\n");
    const steps: Step[] = [];
    const changeConfigurations: Record<number, ChangeConfiguration> = {}

    const timeRegex = /Time:\s*([\d.]+)/;
    const occupancyRegex = /\(occupancy\s+(\w+)\)=([\d.]+)/g;
    const counterRegex = /\(counter\s+(\w+)\)=([\d.]+)/g;
    const changeConfigurationRegex = /^(\d+\.\d+):\(changeConfiguration (\w+)\s+(\w+)\s(\w+)\s(\w+)\)/;
    const countcCycleRegex = /\(countcycle\s+(\w+)\)=([\d.]+)/g;
    const greentimeRegex = /\(greentime\s+(\w+)\)=([\d.]+)/g;
    const intertimeRegex = /\(intertime\s+(\w+)\)=([\d.]+)/g;
    const activeStageRegex = /\(active\s+(\w+)\)=(\w+)/g;
    const interStageRegex = /\(inter\s+(\w+)\)=(\w+)/g;
    const activeConfRegex = /\(activeconf\s+(\w+)\s(\w+)\)=(\w+)/g;
    
    let previousStep = -1
    lines.forEach((line) => {
        let match = line.match(changeConfigurationRegex);
        if (match) {
            const time = parseFloat(match[1])
            //const stage = match[2]
            //const junction = match[3]   
            const fromConf = match[4]
            const toConf = match[5]
            changeConfigurations[time] = new ChangeConfiguration(time,fromConf,toConf)
            return;
        }
        
        let links: Record<string,Link> = {}
        let junctions: Record<string,Junction> = {}
        let stages: Record<string,Stage> = {}
        let configurations: Record<string, Configuration> = {}

        // Parsing steps
        const timeMatch = line.match(timeRegex);
        if (!timeMatch) return;
        if (parseFloat(timeMatch[1]) == previousStep) return;
        previousStep = parseFloat(timeMatch[1])
        let step = new Step(parseFloat(timeMatch[1]))

        const occupancyMatches = [...line.matchAll(occupancyRegex)];
        occupancyMatches.forEach(match => {
            let id = match[1]
            let occupancy = parseFloat(match[2])
            const regex = /(\w+)_\w+_(\w+)/;
            let newMatch = id.match(regex)
            if (newMatch) {
                if (!links[id]) {
                    links[id] = new Link(id)
                }
                links[id].occupancy = occupancy
                links[id].source = newMatch[1]
                links[id].destination = newMatch[2]
            }
        });
        
        // Parsing counter
        const counterMatches = [...line.matchAll(counterRegex)];
        counterMatches.forEach(match => {
            let id = match[1]
            let counter = parseFloat(match[2])
            const regex = /(\w+)_\w+_(\w+)/;
            let newMatch = id.match(regex)
            if (newMatch) {
                if (!links[id]) {
                    links[id] = new Link(id)
                }
                links[id].counter = counter
            }
        });

        // Parsing countcyle
        const countcycleMatches = [...line.matchAll(countcCycleRegex)];
        countcycleMatches.forEach(match => {
            let id = match[1]
            let value = parseFloat(match[2])
            if (!junctions[id]) {
                junctions[id] = new Junction(id);
            }
            junctions[id].countcycle = value
        });

        // Parsing greentime
        const greentimeMatches = [...line.matchAll(greentimeRegex)];
        greentimeMatches.forEach(match => {
            let id = match[1]
            let value = parseFloat(match[2])
            if (!junctions[id]) {
                junctions[id] = new Junction(id);
            }
            junctions[id].greentime = value
        });

        // Parsing greentime
        const intertimeMatches = [...line.matchAll(intertimeRegex)];
        intertimeMatches.forEach(match => {
            let id = match[1]
            let value = parseFloat(match[2])
            if (!junctions[id]) {
                junctions[id] = new Junction(id);
            }
            junctions[id].intertime = value
        });

        // Parsing active stage
        const activeStageMatches = [...line.matchAll(activeStageRegex)];
        activeStageMatches.forEach(match => {
            let id = match[1]
            let value = match[2].toLowerCase() === 'true'
            if (!stages[id]) {
                stages[id] = new Stage(id);
            }
            
            stages[id].active = value
        });

        // Parsing inter stage
        const interStageMatches = [...line.matchAll(interStageRegex)];
        interStageMatches.forEach(match => {
            let id = match[1]
            let value = match[2].toLowerCase() === 'true'
            if (!stages[id]) {
                stages[id] = new Stage(id);
            }
            stages[id].inter = value
        });

        // Parsing active configurations
        const activeConfMatches = [...line.matchAll(activeConfRegex)];
        activeConfMatches.forEach(match => {
            let id = match[2]
            let value = match[3].toLowerCase() === 'true'
            if (!configurations[id]) {
                configurations[id] = new Configuration(id);
            }
            configurations[id].active = value
        });
        
        step.configurations.push(...Object.values(configurations))
        step.stages.push(...Object.values(stages))
        step.junctions.push(...Object.values(junctions))
        step.links.push(...Object.values(links))
        if (Object.keys(links).length > 0 && Object.keys(junctions).length > 0) {
            steps.push(step);
        }
    
    });
    console.log(steps);
    return { steps, changeConfigurations };
}