type ConfgreentimeTuple = [string, number];

export class Configuration {
    
    id: string;
    stages: Record<string,ConfgreentimeTuple[]>;
    active: boolean;

    constructor(id: string = "", stages: Record<string,ConfgreentimeTuple[]> = {}, active: boolean = false) {
      this.id = id;
      this.stages = stages;
      this.active = active;
    }
}