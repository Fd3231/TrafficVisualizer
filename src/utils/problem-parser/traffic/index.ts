import { parseProblem } from "../core/parse";
import { build } from "./build";

export const parseTrafficProblem = (src: string) => parseProblem(src, { build, validate: () => {} });