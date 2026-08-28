import type { Flow } from "./Flow";

export class Stage {
    
    id: string;
    juncId: string;
    flows: Flow[];
    active:boolean;
    inter: boolean;
    interlimit: number;

    constructor(id: string = "", juncId: string = "", flows: Flow[] = [], active: boolean = false, inter: boolean = false, interlimit: number = 0) {
        this.id = id;
        this.juncId = juncId;
        this.flows = flows;
        this.active = active;
        this.inter = inter;
        this.interlimit = interlimit;
    }

}