import { computed, ref } from "vue";
import { useMapStore } from "../stores/useMapStore";

export const TABS = ["Junctions", "Links", "Stages", "Configurations"] as const;
export type Tab = (typeof TABS)[number];

export function useDataVisualiztion() {

    const mapStore = useMapStore();
    const activeTab = ref<Tab>("Junctions");
    const searchTerm = ref("");

    const items = computed(() => {
        switch (activeTab.value) {
        case "Junctions":
            return Object.values(mapStore.junctions);
        case "Links":
            return mapStore.sortedLinks;
        case "Configurations":
            return mapStore.sortedConfigurations;
        case "Stages":
            return mapStore.sortedStages;
        }
    });

    const filteredSearch = computed(() => {
        const term = searchTerm.value.toLowerCase();
        return items.value.filter((item) => item.id.toLowerCase().includes(term));
    });

    const hasJunctions = computed(() => Object.keys(mapStore.junctions).length > 0);

    function selectTab(tab: Tab) {
        activeTab.value = tab;
        searchTerm.value = "";
    }

    return  {tabs: TABS, activeTab, searchTerm, filteredSearch, hasJunctions,
            selectTab
    }

}