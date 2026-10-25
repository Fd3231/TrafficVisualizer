import type { Issues } from "./issues";

const NEWLINE = /\r?\n/;
const COMMENT = /;.*$/;
const TOKEN = /[()]|[^\s()]+/g;

export type Atom = { kind: "atom"; value: string; lower: string; line: number }; // word
export type List = { kind: "list"; items: SExpr[]; line: number }; // parenthesised items
export type SExpr = Atom | List;

export type Token = { text: string; line: number };

export const isList = (x: SExpr | undefined): x is List => x?.kind === "list";
export const isAtom = (x: SExpr | undefined): x is Atom => x?.kind === "atom";
export const headOf = (x?: SExpr) => (isList(x) && isAtom(x.items[0]) ? x.items[0].lower : "");

export function tokenize(src: string): Token[] {
    const tokens: Token[] = [];
    src.split(NEWLINE).forEach((text, i) => {
        for (const [tok] of text.replace(COMMENT, "").matchAll(TOKEN)) {
            tokens.push({ text: tok, line: i + 1 });
        }
    });
    return tokens;
}

export function parse(tokens: Token[], issues: Issues): SExpr[] {
    const root: SExpr[] = [];
    const stack: { items: SExpr[]; line: number }[] = [];
    const top = () => (stack.length ? stack[stack.length - 1].items : root);

    for (const { text, line } of tokens) {
        if (text === "(") {
            stack.push({ items: [], line });
        } else if (text === ")") {
            const open = stack.pop();
            if (open) {
                top().push({ kind: "list", items: open.items, line: open.line });
            } else {
                issues.error("UNEXPECTED_CLOSE_PAREN", "Unexpected ')'", line);
            }
        } else {
            top().push({ kind: "atom", value: text, lower: text.toLowerCase(), line });
        }
    }

    while (stack.length) {
        issues.error("UNCLOSED_PAREN", "Unclosed '('", stack.pop()!.line);
    }
    
    return root;
}

export const readSExprs = (src: string, issues: Issues): SExpr[] => parse(tokenize(src), issues);