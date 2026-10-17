import { computed, ref } from "vue";
import { useMapStore } from "../stores/useMapStore";
import { parseProblemData } from "../utils/problemParser";
import { parsePlanData } from "../utils/planParser";
import { useToast } from "./useToast";

export function useFileUpload() {

    const mapStore = useMapStore();
    const { showToast } = useToast();
    
    const problemFile = ref<File | null>(null);
    const planFile = ref<File | null>(null);
    let problemFileUploaded = ref(false);
    const planInput = ref<HTMLInputElement | null>(null);

    const canUploadPlan = computed(() => !!planFile.value && problemFileUploaded.value);
    const canUploadProblem = computed(() => !!problemFile.value);

    function handleFileChange(fileType: "problem" | "plan", event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        if (fileType === "problem") {
            problemFile.value = file;
        } else if (fileType === "plan") {
            planFile.value = file;
        }
    };

    async function uploadProblem() {
        if (!problemFile.value) return;
        if (problemFileUploaded.value) {
            mapStore.reset()
        }
        try {
            const text = await problemFile.value.text();
            const data = parseProblemData(text);
            mapStore.resetSteps();
            mapStore.setMapData(data.junctions, data.links, data.stages, data.configurations);
            problemFileUploaded.value = true;
            planFile.value = null;
            if (planInput.value) planInput.value.value = "";
        } catch(error) {
            console.error("Error reading file:", error);
        }
    }

    async function uploadPlan() {
        if (!planFile.value || !problemFileUploaded.value) return;
        
        try {
            const text = await planFile.value.text();
            const data = parsePlanData(text);
            mapStore.setSteps(data.steps);
            mapStore.setChangeConfigurations(data.changeConfigurations);
        } catch (error) {
            console.error("Error reading plan file:", error);
        }
    }

    return { planInput, canUploadProblem, canUploadPlan,
        handleFileChange, uploadProblem, uploadPlan,
    }

}