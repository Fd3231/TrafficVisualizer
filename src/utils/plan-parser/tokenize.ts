
export interface Token {
    kind: string;
    args: string[];
    value: string;
}

const TOKEN_REGEX = /\((\w+)((?:\s+\w+)*)\)=(\S+)/g;

export function tokenize(text: string): Token[] {
    return Array.from(text.matchAll(TOKEN_REGEX), ([, kind, args, value]) => ({
        kind,
        args: args.trim() ? args.trim().split(/\s+/) : [],
        value
    }))   
}