import * as d3 from "d3";
import type { Junction } from "../../models/Junctions";
import type { Link } from "../../models/Link";
import { TRAFFIC_MAP_CONFIG } from "./trafficMapConfig";

export interface MapNode extends d3.SimulationNodeDatum {
    id: string;
    x: number;
    y: number;
    external: boolean
}

export interface MapEdge {
    id: string;
    source: string | MapNode;
    target: string | MapNode;
    occupancy: number;
    capacity: number;
    active: boolean;
    bidirectional: boolean;
    linknum: number;
}

export function buildNodes(junctions: Record<string, Junction>, links: Record<string, Link>): MapNode[] {
    const nodes = new Map<string, MapNode>();
    const add = (id: string, external: boolean) => {
        if (!nodes.has(id)) nodes.set(id, {id, x: 0, y: 0, external});
    }
    
    // add controllable junctions
    Object.values(junctions).forEach(j => add(j.id, false));
    // add non-controllable junctions
    Object.values(links).forEach(l => {
        add(l.source, true);
        add(l.destination, true);
    })

    const result = [...nodes.values()]
    // position of the first junction
    if (result.length > 0) {
        result[0].x = 10
        result[0].y = 0
    }
    
    return result;
}

export function buildEdges(links: Record<string,Link>) : MapEdge[] {
    const list = Object.values(links);
    const counts = new Map<string, number>();

    list.forEach(l => {
        const key = `${l.source}-${l.destination}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return list.map(l => {
        const key = `${l.source}-${l.destination}`;
        const bidirectional = list.some(o => o.source === l.destination && o.destination === l.source);
        const index = counts.get(key) ?? 0;
        counts.set(key, index - 1);
        
        return {
            id: l.id,
            source: l.source,
            target: l.destination,
            occupancy: l.occupancy,
            capacity: l.capacity,
            active: l.active,
            bidirectional,
            linknum: index + (bidirectional ? 1 : 0)
        }
    })
}

export function syncEdges(edges: MapEdge[], links: Record<string, Link>) {
    edges.forEach(e => {
        const l = links[e.id]
        if (!l) return;
        e.occupancy = l.occupancy;
        e.capacity = l.capacity;
        e.active = l.active;
    })
}

export function getCapacityRange(links: Record<string, Link>) : [number, number] {
    const values = Object.values(links)
        .map(l => l.capacity)
        .filter(c => c < TRAFFIC_MAP_CONFIG.edge.maxCapacity);
    return [d3.min(values) ?? 1, d3.max(values) ?? 50]
}