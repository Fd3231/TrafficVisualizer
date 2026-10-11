import { computed, ref, watch } from "vue";
import { useMapStore } from "../stores/useMapStore";
import { useSimulationStore } from "../stores/useSimulationStore";

type Status = "stopped" | "playing" | "paused";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function useSimulationPlayer() {

    const mapStore = useMapStore();
    const simulationStore = useSimulationStore();

    const speeds = [1, 2, 5, 10, 50];
    const speed = ref(1);
    const currentStep = ref(0);
    const status = ref<Status>("stopped");
    let runId = 0;

    const rangeInput = ref<HTMLInputElement | null>(null);

    const lastStep = computed(() => Math.max(mapStore.steps.length - 1, 0));
    const isPlaying = computed(() => status.value === "playing");
    const canGoBack = computed(() => currentStep.value > 0);
    const canGoForward = computed(() => currentStep.value < lastStep.value);
    const hasSteps = computed(() => mapStore.steps.length > 0);
    const currentChange = computed(() => mapStore.changeConfigurations[currentStep.value]);

    const clamp = (n: number) => Math.min(Math.max(Math.trunc(n) || 0, 0), lastStep.value);

    const stepInput = computed({
        get: () => currentStep.value,
        set: (value: number | string) => { currentStep.value = clamp(Number(value)); },
    });

    const next = () => { currentStep.value = clamp(currentStep.value + 1); };
    const previous = () => { currentStep.value = clamp(currentStep.value - 1); };

    async function play() {
        if (isPlaying.value) return;
        const myRun = ++runId;
        simulationStore.activateSimulation();
        status.value = "playing";

        while (runId === myRun && currentStep.value < lastStep.value) {
            await delay(1000 / speed.value);
            if (runId !== myRun) return;
            next();
        }
        if (runId === myRun) status.value = "stopped";
    }

    function pause() {
        runId++;
        status.value = "paused";
    }

    function stop() {
        runId++;
        status.value = "stopped";
        currentStep.value = 0;
        mapStore.resetLinks();
        simulationStore.stopSimulation();
    }

    const toggle = () => (isPlaying.value ? pause() : play());

    watch(currentStep, (step) => {
        if (step === 0) simulationStore.stopSimulation();
        mapStore.applyStep(step);
    }, { immediate: true });

    return {
        speeds, speed, currentStep, stepInput, status, 
        isPlaying, canGoBack, canGoForward, lastStep, 
        rangeInput, hasSteps, currentChange,
        next, previous, toggle, stop
    };

}