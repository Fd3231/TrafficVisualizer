import * as d3 from "d3";
import type { Ref } from "vue";
import { type MapEdge, type MapNode } from "./useTrafficMapData";
import { TRAFFIC_MAP_CONFIG } from "./trafficMapConfig";

const NODE_RADIUS = TRAFFIC_MAP_CONFIG.node.radius;
const ARROW = TRAFFIC_MAP_CONFIG.edge.arrow;
const ARROW_LEN_RATIO = ((ARROW.tipX - ARROW.baseX) / ARROW.viewBox) * ARROW.size;

export function useTrafficMapRenderer(container: Ref<SVGSVGElement | null>) {
    const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.5, 1])
        .range(["green", "yellow", "red"]);

    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
    let edgeSel: d3.Selection<SVGPathElement, MapEdge, SVGGElement, unknown> | null = null;
    let nodeSel: d3.Selection<SVGCircleElement, MapNode, SVGGElement, unknown> | null = null;
    let labelSel: d3.Selection<SVGTextElement, MapNode, SVGGElement, unknown> | null = null;
    let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;

    const occupancyColor = (e: MapEdge) => colorScale(e.occupancy / e.capacity);
    const strokeWidths = new Map<string, number>();

    function addTooltip() {
        if (tooltip) return;
        tooltip = d3.select(document.body).append("div")
            .attr("class", "traffic-map-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "6px 9px")
            .style("border-radius", "4px")
            .style("font-size", "13px")
            .style("pointer-events", "none");
    }

    function controlPoint(d: any): readonly [number, number] {
        const { x: sx, y: sy } = d.source;
        const { x: tx, y: ty } = d.target;
        const cd = 35 + (d.linknum - 1) * 12;
        const cx = (sx + tx) / 2, cy = (sy + ty) / 2;
        const cAngle = Math.atan2(ty - sy, tx - sx) + Math.PI / 2;
        const offset = (d.linknum - (d.linknum + 1) / 2) * cd;
        return [cx + offset * Math.cos(cAngle), cy + offset * Math.sin(cAngle)];
    }

    function moveToward(p: { x: number; y: number }, q: readonly [number, number], r: number) {
        const dx = q[0] - p.x, dy = q[1] - p.y;
        const len = Math.hypot(dx, dy) || 1;
        return [p.x + (dx / len) * r, p.y + (dy / len) * r] as const;
    }

    function linkPath(d: any): string {
        const dist = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
        if (dist <= 2 * NODE_RADIUS) return "";

        const arrowLen = ARROW_LEN_RATIO * (strokeWidths.get(d.id) ?? 1);

        const c = controlPoint(d);
        const [x1, y1] = moveToward(d.source, c, NODE_RADIUS);
        const [x2, y2] = moveToward(d.target, c, NODE_RADIUS + arrowLen);
        return `M${x1},${y1}Q${c[0]},${c[1]} ${x2},${y2}`;
    }

    function draw(nodes: MapNode[], edges: MapEdge[], capacityRange: [number, number], drag: d3.DragBehavior<SVGCircleElement, MapNode, MapNode | d3.SubjectPosition>) {
        
        if (!container.value) return;
        addTooltip();

        svg = d3.select(container.value)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${TRAFFIC_MAP_CONFIG.width} ${TRAFFIC_MAP_CONFIG.height}`);
        svg.selectAll("*").remove();

        const g = svg.append("g");
        svg.call(
        d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([TRAFFIC_MAP_CONFIG.zoom.min, TRAFFIC_MAP_CONFIG.zoom.max])
            .on("zoom", e => g.attr("transform", e.transform.toString())),
        );

        const [minCap, maxNormalCap] = capacityRange;
        const [minStroke, maxStroke] = TRAFFIC_MAP_CONFIG.edge.strokeRange;
        const infCapStroke = maxStroke * 1.2;

        const strokeScale = d3.scaleLinear().domain([minCap, maxNormalCap, TRAFFIC_MAP_CONFIG.edge.maxCapacity])
            .range([minStroke, maxStroke, infCapStroke])
            .clamp(true);
        
        strokeWidths.clear();
        edges.forEach(e => {
            strokeWidths.set(e.id, strokeScale(e.capacity));
        })
        
        const mid = ARROW.viewBox / 2

        svg.append("defs")
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", `0 0 ${ARROW.viewBox} ${ARROW.viewBox}`)
            .attr("refX", ARROW.baseX)
            .attr("refY", mid)
            .attr("markerWidth", ARROW.size)
            .attr("markerHeight", ARROW.size)
            .attr("orient", "auto")
            .append("path")
            .attr("d", `M0,0 L${ARROW.tipX},${mid} L0,${ARROW.viewBox} Z`)
            .attr("fill", "context-stroke");

        edgeSel = g.append("g").selectAll<SVGPathElement, MapEdge>("path")
            .data(edges).join("path")
            .attr("fill", "none")
            .attr("stroke-width", e => strokeWidths.get(e.id)!)
            .attr("stroke", occupancyColor)
            .attr("marker-end", "url(#arrow)")
            .on("mouseover", (_, e) => tooltip!.text(e.id).style("visibility", "visible"))
            .on("mousemove", ev => tooltip!.style("top", `${ev.pageY + 10}px`).style("left", `${ev.pageX + 10}px`))
            .on("mouseout", () => tooltip!.style("visibility", "hidden"));

        nodeSel = g.append("g").selectAll<SVGCircleElement, MapNode>("circle")
            .data(nodes).join("circle")
            .attr("r", NODE_RADIUS)
            .attr("fill", d => d.external ? TRAFFIC_MAP_CONFIG.node.colors.nonControllable : TRAFFIC_MAP_CONFIG.node.colors.controllable)
            .attr("stroke", "black")
            .attr("cursor", "pointer")
            .call(drag);

        labelSel = g.append("g").selectAll<SVGTextElement, MapNode>("text")
            .data(nodes).join("text")
            .text(d => d.id)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "white")
            .attr("font-weight", "bold")
            .attr("font-size", 15);
        
    }

    function tick() {
        edgeSel?.attr("d", d => linkPath(d));
        nodeSel?.attr("cx", d => d.x!).attr("cy", d => d.y!);
        labelSel?.attr("x", d => d.x!).attr("y", d => d.y!);
    }

    function updateEdgeStyles(edges: MapEdge[], highlightActive: boolean) {
        if (!edgeSel || !svg) return;
        
        edgeSel.data(edges)
            .attr("stroke-dasharray", e => (highlightActive && !e.active) ? TRAFFIC_MAP_CONFIG.edge.dashed : 0)
            .transition().duration(50)
            .attr("stroke", occupancyColor);
    }

    function clear() { 
        svg?.selectAll("*").remove(); 
        strokeWidths.clear();
        edgeSel = nodeSel = labelSel = null;
    }

    function destroy() { 
        clear(); 
        tooltip?.remove(); 
        tooltip = null; 
    }

    return { draw, tick, updateEdgeStyles, clear, destroy };

}