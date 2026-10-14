import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useMapStore } from "../../stores/useMapStore";
import { useSimulationStore } from "../../stores/useSimulationStore";
import { buildEdges, buildNodes, getCapacityRange, syncEdges, type MapEdge, type MapNode } from "./useTrafficMapData";
import { useTrafficMapRenderer } from "./useTrafficMapRenderer";
import { useTrafficMapForceSimulation } from "./useTrafficMapForceSimulation";
import { useMapUI } from "./useMapUI";

export function useTrafficMap() {
    const mapStore = useMapStore();
    const simulationStore = useSimulationStore();
    const mapContainer = ref<SVGSVGElement | null>(null);

    let nodes: MapNode[] = [];
    let edges: MapEdge[] = [];
    let capacityRange: [number, number] = [1, 50];

    const renderer = useTrafficMapRenderer(mapContainer);
    const sim = useTrafficMapForceSimulation();

    function render() {
        if (!nodes.length) return;
        sim.create(nodes, edges);
        renderer.draw(nodes, edges, capacityRange, sim.createDrag());
        sim.onTick(renderer.tick);
        renderer.updateEdgeStyles(edges, simulationStore.activeToggleLinks);
    }

    function setup() {
        nodes = buildNodes(mapStore.junctions, mapStore.links);
        edges = buildEdges(mapStore.links);
        capacityRange = getCapacityRange(mapStore.links);
    }

    function reset() {
        sim.stop();
        renderer.clear();
        nodes = [];
        edges = [];
    }

    const ui = useMapUI(() => nodes, render);

    const rotateGraph = () => sim.rotate(nodes, renderer.tick);

    watch(
        () => [mapStore.junctions, mapStore.links],
        () => {
            if (nodes.length === 0) { 
                setup(); 
                render(); 
            }
            syncEdges(edges, mapStore.links);
            renderer.updateEdgeStyles(edges, simulationStore.activeToggleLinks);
        },
        { deep: true, immediate: true },
    );

    watch(() => mapStore.resetStore, v => { 
        if (v) reset();
    });

    watch(() => simulationStore.activeSimulation, v => { 
        if (v) sim.stop(); 
    });
    
    watch(
        () => simulationStore.activeToggleLinks,
        () => renderer.updateEdgeStyles(edges, simulationStore.activeToggleLinks),
    );

    onMounted(render);
    
    onBeforeUnmount(() => { 
        sim.destroy(); 
        renderer.destroy(); 
    });

    return { mapContainer, rotateGraph, ...ui };

}