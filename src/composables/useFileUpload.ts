import { computed, ref } from "vue";
import { useMapStore } from "../stores/useMapStore";
import { useToast } from "./useToast";
import { parseTrafficProblem } from "../utils/problem-parser/traffic";
import { parsePlanData } from "../utils/plan-parser/parsePlanData";

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
            const result = parseTrafficProblem(text);

            if (!result.data) {
                const first = result.issues.find(i => i.severity === "error") ?? result.issues[0];
                const where = first?.line ? `Line ${first.line}: ` : "";
                showToast(`${where}${first?.message}`, "danger");
                problemFileUploaded.value = false;
                return;
            }

            const data = result.data;
            mapStore.resetSteps();
            mapStore.setMapData(data.junctions, data.links, data.stages, data.configurations);
            problemFileUploaded.value = true;
            planFile.value = null;
            if (planInput.value) planInput.value.value = "";
        } catch(error) {
            showToast("Error reading plan file", "danger");
        }
    }

    async function uploadPlan() {
        if (!planFile.value || !problemFileUploaded.value) return;
        
        try {
            const text = await planFile.value.text();
            const data = parsePlanData(text);

            if (data.errors.list.length > 0) {
                showToast(`${data.errors.list[0].message}`, "danger");
                return;
            }

            if (!data.steps) {
                showToast("Invalid plan", "danger"); 
                return;
            }

            mapStore.setSteps(data.steps);
            mapStore.setChangeConfigurations(data.changeConfigurations);
        } catch (error) {
            showToast("Error reading plan file", "danger");
        }
    }

    return { planInput, canUploadProblem, canUploadPlan,
        handleFileChange, uploadProblem, uploadPlan,
    }

}