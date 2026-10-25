import type { Configuration } from "../../../models/Configuration";
import type { Junction } from "../../../models/Junctions";
import type { Link } from "../../../models/Link";
import type { Stage } from "../../../models/Stage";

export interface ParsedData {
  junctions: Record<string, Junction>;
  links: Record<string, Link>;
  stages: Record<string, Stage>;
  configurations: Record<string, Configuration>;
}

export const emptyData = (): ParsedData => ({ junctions: {}, links: {}, stages: {}, configurations: {} });