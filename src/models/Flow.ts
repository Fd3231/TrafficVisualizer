export class Flow {
    
    fromLinkId: string
    toLinkId: string;
    value: number;

    constructor(fromLinkId: string, toLinkId: string, value: number) {
        this.fromLinkId = fromLinkId;
        this.toLinkId = toLinkId;
        this.value = value;
    }

}