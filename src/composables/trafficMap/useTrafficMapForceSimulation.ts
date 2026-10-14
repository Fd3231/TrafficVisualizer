import * as d3 from "d3";
import type { MapEdge, MapNode } from "./useTrafficMapData";
import { TRAFFIC_MAP_CONFIG } from "./trafficMapConfig";

export function useTrafficMapForceSimulation() {
    let simulation: d3.Simulation<MapNode, MapEdge> | null = null;

    function create(nodes: MapNode[], edges: MapEdge[]) {
        simulation?.stop();
        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink<MapNode, MapEdge>(edges)
                .id(d => d.id)
                .distance(TRAFFIC_MAP_CONFIG.simulation.linkDistance))
            .force("charge", d3.forceManyBody().strength(TRAFFIC_MAP_CONFIG.simulation.chargeStrength))
            .force("center", d3.forceCenter(TRAFFIC_MAP_CONFIG.center.x, TRAFFIC_MAP_CONFIG.center.y))
            .force("collision", d3.forceCollide(TRAFFIC_MAP_CONFIG.simulation.collideRadius))

        return simulation;
    }

    function createDrag() {
        return d3.drag<SVGCircleElement, MapNode>()
            .on("start", (event: any, d: any) => {
                if (!event.active) simulation?.alphaTarget(TRAFFIC_MAP_CONFIG.simulation.dragAlphaTarget).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event: any, d: any) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event: any, d: any) => {
                if (!event.active) simulation?.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
    
    function onTick(cb: () => void) { 
        simulation?.on("tick", cb) 
    }

    function stop() { 
        simulation?.stop(); 
    }

    function destroy() { 
        simulation?.stop(); 
        simulation = null; 
    }

    function rotate(nodes: MapNode[], onFrame: () => void) {
        const { angleDeg, durationMs } = TRAFFIC_MAP_CONFIG.rotation;
        const { x: cx, y: cy } = TRAFFIC_MAP_CONFIG.center;
        const angle = (angleDeg * Math.PI) / 180;
        const start = nodes.map(n => ({ x: n.x, y: n.y }));

        simulation?.stop();

        d3.transition().duration(durationMs)
            .tween("rotate", () => (t: number) => {
                const cos = Math.cos(angle * t), sin = Math.sin(angle * t);
                nodes.forEach((n, i) => {
                    const dx = start[i].x - cx, dy = start[i].y - cy;
                    n.x = dx * cos - dy * sin + cx;
                    n.y = dx * sin + dy * cos + cy;
                });
                onFrame();
            })
        .on("end", () => simulation?.alpha(0.3).restart());
    }

    return { create, createDrag, onTick, stop, destroy, rotate };

}