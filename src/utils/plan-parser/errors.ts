
export interface PlanError {
    code: string;
    message: string;
}

export class PlanErrors {

    list: PlanError[] = [];

    add(code: string, message: string) { 
        this.list.push({ code, message }); 
    }

}