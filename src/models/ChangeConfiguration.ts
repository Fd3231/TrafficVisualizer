export class ChangeConfiguration {
    
    time: number;
    fromConf: string;
    toConf: string;

    constructor(time: number, fromConf: string, toConf: string) {
        this.time = time;
        this.fromConf = fromConf;
        this.toConf = toConf;
    }

}