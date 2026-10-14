import * as d3 from "d3";
import type { Ref } from "vue";
import { getIncrement, type MapEdge, type MapNode } from "./useTrafficMapData";
import { TRAFFIC_MAP_CONFIG } from "./trafficMapConfig";

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

    function linkArc(d: any) {
        const { x: sx, y: sy } = d.source;
        const { x: tx, y: ty } = d.target;
        const cd = 35 + (d.linknum - 1) * 12;
        const cx = (sx + tx) / 2, cy = (sy + ty) / 2;
        const cAngle = Math.atan2(ty - sy, tx - sx) + Math.PI / 2;
        const offset = (d.linknum - (d.linknum + 1) / 2) * cd;
        return `Q ${cx + offset * Math.cos(cAngle)},${cy + offset * Math.sin(cAngle)} `;
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

        const strokeScale = d3.scaleLinear().domain(capacityRange).range(TRAFFIC_MAP_CONFIG.edge.strokeRange);
        const strokeWidth = (e: MapEdge) =>
            e.capacity === TRAFFIC_MAP_CONFIG.edge.maxCapacity ? 3 : Math.floor(strokeScale(e.capacity));

        const defs = svg.append("defs");
        edges.forEach(e => {
            const sw = strokeWidth(e);
            defs.append("marker")
                .attr("id", `arrow-${e.id}`)
                .attr("viewBox", "0 0 10 10")
                .attr("refX", TRAFFIC_MAP_CONFIG.edge.arrowRefX[sw - 3])
                .attr("refY", 5 + getIncrement(e))
                .attr("markerWidth", 3)
                .attr("markerHeight", 3)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,0 L10,5 L0,10")
                .attr("fill", occupancyColor(e));
        });

        edgeSel = g.append("g").selectAll<SVGPathElement, MapEdge>("path")
            .data(edges).join("path")
            .attr("fill", "none")
            .attr("stroke-width", strokeWidth)
            .attr("stroke", occupancyColor)
            .attr("marker-end", e => `url(#arrow-${e.id})`)
            .on("mouseover", (_, e) => tooltip!.text(e.id).style("visibility", "visible"))
            .on("mousemove", ev => tooltip!.style("top", `${ev.pageY + 10}px`).style("left", `${ev.pageX + 10}px`))
            .on("mouseout", () => tooltip!.style("visibility", "hidden"));

        nodeSel = g.append("g").selectAll<SVGCircleElement, MapNode>("circle")
            .data(nodes).join("circle")
            .attr("r", TRAFFIC_MAP_CONFIG.node.radius)
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
        edgeSel?.attr("d", (d: any) =>
            `M${d.source.x},${d.source.y}${linkArc(d)}${d.target.x},${d.target.y}`);
        nodeSel?.attr("cx", d => d.x!).attr("cy", d => d.y!);
        labelSel?.attr("x", d => d.x!).attr("y", d => d.y!);
    }

    function updateEdgeStyles(edges: MapEdge[], highlightActive: boolean) {
        if (!edgeSel || !svg) return;
        
        edgeSel.data(edges)
            .attr("stroke-dasharray", e => (highlightActive && !e.active) ? TRAFFIC_MAP_CONFIG.edge.dashed : 0)
            .transition().duration(50)
            .attr("stroke", occupancyColor);

        edges.forEach(e => {
            svg!.select(`#arrow-${e.id} path`)
                .transition().duration(50)
                .attr("fill", occupancyColor(e));
        });
    }

    function clear() { 
        svg?.selectAll("*").remove(); 
    }

    function destroy() { 
        clear(); 
        tooltip?.remove(); 
        tooltip = null; 
    }

    return { draw, tick, updateEdgeStyles, clear, destroy };

}