import { Configuration } from "../models/Configuration";
import { Flow } from "../models/Flow";
import { Junction } from "../models/Junctions";
import { Link } from "../models/Link";
import { Stage } from "../models/Stage";

interface ParsedData {
  junctions: Record<string,Junction>;
  links: Record<string, Link>;
  stages: Record<string, Stage>;
  configurations: Record<string, Configuration>;
}

export function parseProblemData(rawData: string): ParsedData {
  const lines = rawData.trim().split("\n");

  let junctions: Record<string, Junction> = {};
  let links: Record<string, Link> = {};
  let configurations: Record<string, Configuration> = {};
  let stages: Record<string, Stage> = {};

  const junctionRegex = /^([\w\s]+) - junction/;
  const linkRegex = /^([\w\s]+) - link/;
  const stageRegex = /^([\w\s]+) - stage/;
  const configurationRegex = /^([\w\s]+) - configuration/;
  const capacityRegex = /\(=\s\(capacity\s(\w+)\)\s+(\d+\.\d+)\)/;
  const occupancyRegex = /\(=\s\(occupancy\s(\w+)\)\s+(\d+\.\d+)\)/;
  const counterRegex = /\(=\s\(counter\s(\w+)\)\s+(\d+\.\d+)\)/;
  const turnrateRegex = /\(=\s\(turnrate\s(\w+)\s+(\w+)\s+(\w+)\)\s+(\d+\.\d+)\)/;
  const confgreentimeRegex = /^\(=\s\(confgreentime\s(\w+)\s+(\w+)\)\s+(\d+)\)/;
  const activeconfRegex = /^\(activeconf\s(\w+)\s+(\w+)\)/;
  const activestageRegex = /^\(active\s(\w+)\)/;
  const interstageRegex = /^\(inter\s(\w+)\)/;
  const interlimitRegex = /^\(=\s\(interlimit\s(\w+)\s+\)\s*(\d+)\)/;
  const containsRegex = /^\(contains\s(\w+)\s+(\w+)\)/;
  const greentimeRegex = /^\(=\s\(greentime\s(\w+)\)\s+(\d+)\)/;
  const intertimeRegex = /^\(=\s\(intertime\s(\w+)\)\s+(\d+)\)/;
  const countcycleRegex = /^\(=\s\(countcycle\s(\w+)\)\s+(\d+)\)/;

  lines.forEach((line) => {
    // Parsing junctions
    let match = line.match(junctionRegex);
    if (match) {
      junctions = parseJunctions(match);
      return;
    }
    // Parsing links
    match = line.match(linkRegex);
    if (match) {
      links = parseLinks(match);
      return;
    }

    // Parsing stages
    match = line.match(stageRegex);
    if (match) {
      stages = parseStages(match);
      return;
    }

    // Parsing configurations
    match = line.match(configurationRegex);
    if (match) {
      configurations = parseConfigurations(match);
      return;
    }

    // Parsing junction greentime
    match = line.match(greentimeRegex);
    if (match && junctions[match[1]]) {
      let junc = match[1]
      let value = parseInt(match[2])
      junctions[junc].greentime = value;
      return;
    }

    // Parsing junction intertime
    match = line.match(intertimeRegex);
    if (match && junctions[match[1]]) {
      let junc = match[1]
      let value = parseInt(match[2])
      junctions[junc].intertime = value;
      return;
    }

    // Parsing junction countcycle
    match = line.match(countcycleRegex);
    if (match && junctions[match[1]]) {
      let junc = match[1]
      let value = parseInt(match[2])
      junctions[junc].countcycle = value;
      return;
    }

    // Parsing link capacity
    match = line.match(capacityRegex);
    if (match && links[match[1]]) {
      links[match[1]].capacity = parseFloat(match[2])
      return;
    }

    // Parsing link occupancy 
    match = line.match(occupancyRegex);
    if (match && links[match[1]]) {
      links[match[1]].occupancy = parseFloat(match[2])
      return;
    }

    // Parsing link counter
    match = line.match(counterRegex);
    if (match && links[match[1]]) {
      links[match[1]].counter = parseFloat(match[2])
      return;
    }

    // Parsing turnrates
    match = line.match(turnrateRegex);
    if (match && stages[match[1]]) {
      let stage = match[1]
      let fromLink = match[2]
      let toLink = match[3]
      let value = parseFloat(match[4])
      let flow: Flow = new Flow(fromLink, toLink, value)
      stages[stage].flows.push(flow)
      return;
    }

    // Parsing confgreentime
    match = line.match(confgreentimeRegex);
    if (match && configurations[match[2]]) {
      let stage = match[1]
      let conf = match[2]
      let value = parseInt(match[3])
      if (!configurations[conf].stages[stage]) {
        configurations[conf].stages[stage] = []
      }
      configurations[conf].stages[stage].push([stage,value])
      return;
    }

    // Parsing activeconf
    match = line.match(activeconfRegex);
    if (match && configurations[match[2]]) {
      let conf = match[2]
      configurations[conf].active = true;
      return;
    }

    // Parsing stage active
    match = line.match(activestageRegex)
    if (match && stages[match[1]]) {
      let stage = match[1]
      stages[stage].active = true;
      return;
    }

    // Parsing stage inter
    match = line.match(interstageRegex)
    if (match && stages[match[1]]) {
      let stage = match[1]
      stages[stage].inter = true;
      return;
    }

    // Parsing interlimit
    match = line.match(interlimitRegex);
    if (match && stages[match[1]]) {
      let stage = match[1]
      let value = parseInt(match[2])
      stages[stage].interlimit = value 
      return;
    }

    // Parsing junc of stage
    match = line.match(containsRegex);
    if (match && stages[match[2]]) {
      let junc = match[1]
      let stage = match[2]
      stages[stage].juncId = junc
      return;
    }

  });
  return { junctions, links, stages, configurations };
}

export function parseJunctions(match:  RegExpMatchArray) {
  const valuesBeforeJunction = match[1].split(/\s+/);
  const junctions: Record<string, Junction> = {}
  valuesBeforeJunction.forEach((value) => {
    if (value.trim()) {
      const junction = new Junction(value);
      junctions[junction.id] = junction
    }
  })
  return junctions;
}

export function parseLinks(match:  RegExpMatchArray) {
  const valuesBeforeLink = match[1].split(/\s+/);
  const links: Record<string, Link> = {}
  valuesBeforeLink.forEach((value) => {
    const link = new Link();
    link.id = value;
    const regex = /(\w+)_\w+_(\w+)/;
    let match = value.match(regex)
    if (match) {
      link.source = match[1];
      link.destination = match[2];
      links[link.id] = link;
    }
  })
  return links;
}

export function parseStages(match:  RegExpMatchArray) {
  const valuesBeforeStage = match[1].split(/\s+/);
  const stages: Record<string, Stage> = {}
  valuesBeforeStage.forEach((value) => {
    const regex = /(\w+_\w+)/
    let match = value.match(regex)
    if (match) {
      stages[value] = new Stage(value)
    }
    });
  return stages;
}

export function parseConfigurations(match:  RegExpMatchArray) {
  const valuesBeforeStage = match[1].split(/\s+/);
  const configurations: Record<string, Configuration> = {}
  valuesBeforeStage.forEach((value) => {
    const regex = /(\w+_\w+_\d+)/
    let match = value.match(regex)
    if (match) {
      configurations[value] = new Configuration(value)
    }
    });
  return configurations;
}
