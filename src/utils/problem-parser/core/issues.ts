
export type Severity = "error" | "warning";

export interface Issue {
    severity: Severity;
    code: string;
    message: string;
    line?: number;
}

export class Issues {

    list: Issue[] = [];

    error(code: string, message: string, line?: number) { 
        this.add("error", code, message, line); 
    }

    /*warn(code: string, message: string, line?: number) { 
        this.add("warning", code, message, line); 
    }*/

    get hasErrors() { 
        return this.list.some(i => i.severity === "error"); 
    }

    private add(severity: Severity, code: string, message: string, line?: number) {
        this.list.push({ severity, code, message, line });
    }

}