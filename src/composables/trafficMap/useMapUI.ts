import { computed, ref } from "vue";
import type { MapNode } from "./useTrafficMapData";
import { useMapStore } from "../../stores/useMapStore";
import { useSimulationStore } from "../../stores/useSimulationStore";

export function useMapUI(getNodes: () => MapNode[], onImported: () => void) {

    const mapStore = useMapStore();
    const simulationStore = useSimulationStore();
    
    const hasJunctions = computed(() => Object.keys(mapStore.junctions).length > 0);
    const toggleLinks = () => {
        simulationStore.activeToggleLinks = !simulationStore.activeToggleLinks;
    }

    const fileInput = ref<HTMLInputElement | null>(null);

    const pickFile = () => fileInput.value?.click();

    const exportLayout = () => {
        const nodes = getNodes();
        if (!nodes.length) return;
        const json = JSON.stringify(nodes.map(({ id, x, y }) => ({ id, x, y })), null, 2);
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const importLayout = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text()) as { id: string; x: number; y: number }[];
            const nodes = getNodes();
            data.forEach(o => {
                const n = nodes.find(n => n.id === o.id);
                if (n) { n.x = o.x; n.y = o.y; }
            });
            onImported();
        } catch (err) {
            console.error("Invalid coordinates file", err);
        } finally {
            input.value = "";
        }
    };

    return { fileInput, hasJunctions, toggleLinks,
        pickFile, importLayout, exportLayout };
}