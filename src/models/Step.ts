import type { Configuration } from "./Configuration";
import type { Junction } from "./Junctions";
import type { Link } from "./Link";
import type { Stage } from "./Stage";

export class Step {

    timestamp: number;
    links: Link[];
    junctions: Junction[];
    stages: Stage[];
    configurations: Configuration[];
    
    constructor(timestamp: number) {
      this.timestamp = timestamp;
      this.links = [];
      this.junctions = [];
      this.stages = [];
      this.configurations = [];
    }
    
}