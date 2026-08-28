<template>
    <div class="container">
        <div class="row mt-4" v-if="mapStore.steps.length > 0">
            <input type="range" ref="rangeInput" class="form-range col mx-1 mt-2" min="0" :max="mapStore.steps.length-1" step="1"
             id="customRange1" :disabled="mapStore.steps.length == 0" v-model.number="currentStep" list="tickmarks">
            <datalist id="tickmarks">
                <option v-for="conf in mapStore.changeConfigurations" :key="conf.time" :value="conf.time"></option>
            </datalist>
            <div class="ticks">
                <div v-for="conf in mapStore.changeConfigurations" :key="conf.time" :style="getTickStyle(conf.time)">
                </div>
            </div>
            <select class="form-select no-arrow" v-model="speed">
                <option v-for="(option, index) in speeds" :key="index" :value="option">
                    {{ option }}x
                </option>
                </select>
            <button :disabled="currentStep <= 0" class="btn col-auto step-btn" @click="currentStep = Number(currentStep) - 1"><i class="bi bi-caret-down-fill"></i></button>
            <input type="text" class="mx-1 col-auto current-input" v-model="currentStep" @input="validateInput">
            <button :disabled="currentStep >= mapStore.steps.length-1" class="btn col-auto step-btn"> <i class="bi bi-caret-up-fill" @click="currentStep = Number(currentStep) + 1"></i> </button>
            <button class="btn btn-outline-success col-auto mx-1" @click="toggleSimulation()">
                <i v-if="!isRunning || (isRunning && isPaused)" class="bi bi-play-fill"></i>
                <i v-if="isRunning && !isPaused" class="bi bi-pause-fill"></i>
            </button>
            <button class="btn btn-outline-danger col-auto mx-1" @click="stopSimulation()"><i class="bi bi-stop-fill"></i></button>
        </div>
        <div class="change-label" v-if="mapStore.changeConfigurations[currentStep]">
            {{ mapStore.changeConfigurations[currentStep].fromConf }} <i class="bi bi-arrow-right"></i> {{ mapStore.changeConfigurations[currentStep].toConf }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { watch, ref, onMounted, onUnmounted, watchEffect } from "vue";
    import { useMapStore } from "../stores/useMapStore.ts";
    import type { Link } from "../models/Link.ts";
    import { useSimulationStore } from "../stores/useSimulationStore.ts";
    import type { Junction } from "../models/Junctions.ts";
    import type { Stage } from "../models/Stage.ts";
    import type { Configuration } from "../models/Configuration.ts";

    const currentStep = ref(0);
    const speed = ref(1);
    const speeds = [1, 2, 5, 10, 50]
    const isRunning = ref(false);
    const isPaused = ref(false);
    let isStopped = true;
    const mapStore = useMapStore();
    const simulationStore = useSimulationStore();
    const rangeInput = ref<HTMLInputElement | null>(null);
    const rangeWidth = ref(0);

    const updateWidth = () => {
        if (rangeInput.value) {
            rangeWidth.value = rangeInput.value.offsetWidth;
        }
    };

    onMounted(() => {
        window.addEventListener('resize', updateWidth);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth);
    });

    watchEffect(() => {
        const input = rangeInput.value;
        const stepsLength = mapStore?.steps?.length ?? 0;

        if (input && stepsLength > 0) {
            updateWidth();
        }
    });

    const getTickStyle = (time: number) => {
        const max = mapStore.steps.length;
        const percentage = (time / max) * 100;
        const tickPosition = (rangeWidth.value * percentage) / 100;
        return { left: `${tickPosition}px` };
    };

    const toggleSimulation = () => {
        if (isRunning.value) {
            // Pause simulation
            isPaused.value = true;
            isStopped = true;
        } else if (isPaused.value) {
            // Resume simulation
            isPaused.value = false;
            isStopped = false;
            startSimulation();
        } else {
            startSimulation();
        }
    }

    const startSimulation = async () => {
        simulationStore.activateSimulation();
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        isRunning.value = true;
        isPaused.value = false;
        isStopped = false;
        
        if (mapStore.steps.length > 0) {
            for (; currentStep.value < mapStore.steps.length; currentStep.value++) {
                if (isStopped) {
                    currentStep.value--;
                    break;
                }
                const step = mapStore.steps[currentStep.value];
                for (const l of step.links) {
                    updateLink(l);
                }
                for (const j of step.junctions) {
                    updateJunction(j);
                }
                for (const s of step.stages) {
                    updateInterStage(s);
                }
                for (const s of step.stages) {
                    updateActiveStage(s);
                }
                for (const c of step.configurations) {
                    updateConfiguration(c);
                }

                await delay(1000/speed.value);
            }
            isRunning.value = false;
        }
    };

    const stopSimulation = () => {
        if ((isStopped && !isRunning.value) || (!isStopped && isRunning)) {
            isStopped = true;
            isRunning.value = false;
            isPaused.value = false;
            currentStep.value = 0;
            mapStore.resetLinks();
            simulationStore.stopSimulation();
        }
    };

    const updateSimulation = (step: number) => {
        if (step == 0) {
            simulationStore.stopSimulation();
        }
        if (mapStore.steps.length > 0 && step >= 0 && step < mapStore.steps.length) {
            const stepData = mapStore.steps[step];
            for (const l of stepData.links) {
                updateLink(l);
            }
            for (const j of stepData.junctions) {
                updateJunction(j);
            }
            for (const s of stepData.stages) {
                updateInterStage(s);
            }
            for (const s of stepData.stages) {
                updateActiveStage(s);
            }
            for (const c of stepData.configurations) {
                updateConfiguration(c);
            }
    }
    };

    const updateLink = (link: Link) => {
        if (mapStore.links[link.id].occupancy != link.occupancy) {
            mapStore.links[link.id].occupancy = link.occupancy;
        }
        if (mapStore.links[link.id].counter != link.counter) {
            mapStore.links[link.id].counter = link.counter;   
        }
    }

    const updateJunction = (junction: Junction) => {
        if (mapStore.junctions[junction.id].greentime != junction.greentime) {
            mapStore.junctions[junction.id].greentime = junction.greentime;
        }
        if (mapStore.junctions[junction.id].intertime != junction.intertime) {
            mapStore.junctions[junction.id].intertime = junction.intertime;
        }
        if (mapStore.junctions[junction.id].countcycle != junction.countcycle) {
            mapStore.junctions[junction.id].countcycle = junction.countcycle;
        }
    }

    const updateActiveStage = (stage: Stage) => {
            if (stage.active) {
                for (const flow of mapStore.stages[stage.id].flows) {
                    mapStore.links[flow.fromLinkId].active = stage.active;
                    mapStore.links[flow.toLinkId].active = stage.active;
                }
                mapStore.stages[stage.id].active = stage.active;
            }
    }

    const updateInterStage = (stage: Stage) => {
            if (!stage.active) {
                for (const flow of mapStore.stages[stage.id].flows) {
                    mapStore.links[flow.fromLinkId].active = stage.active;
                    mapStore.links[flow.toLinkId].active = stage.active;
                }
                mapStore.stages[stage.id].active = stage.active;
            }
        if (mapStore.stages[stage.id].inter != stage.inter) {
            mapStore.stages[stage.id].inter = stage.inter;
        }
    }

    const updateConfiguration = (configuration: Configuration) => {
        if (mapStore.configurations[configuration.id].active != configuration.active) {
            mapStore.configurations[configuration.id].active = configuration.active;
        }
    }

    const validateInput = () => {
        if (!currentStep.value) currentStep.value = 0;
        if (currentStep.value < 0) currentStep.value =  0;
        if (currentStep.value > mapStore.steps.length) currentStep.value = mapStore.steps.length;
    }

    watch(currentStep, (newStep) => {
        updateSimulation(newStep);
    },
    { immediate: true }
);
    
</script>

<style scoped>
    button:active {
        transform: scale(0.95);
        box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
    }
    .current-input {
        max-width: 60px;
        text-align: center;
        border-radius: 5px;
        border: 1px solid grey;
    }
    .current-input:focus {
        outline: none !important;
        box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1)
    }
    .container {
        width: 98%;
        position: relative;
        margin-bottom: 20px;
    }
    .container .ticks {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
    }
    .container .ticks div {
        position: absolute;
        bottom: -25px;
        width: 12px;
        height: 12px;
        background-color: goldenrod;
        border-radius: 50%;
        opacity: 0.9;
    }
    .change-label {
        text-align: left;
        font-weight: 600;
        width: fit-content;
        background-color: burlywood;
        padding: 5px;
        border: 1px solid gray;
        border-radius: 8px;
        margin-left: -8px;
        margin-top: 4px;
        font-size: 15px;
    }
    .step-btn {
        padding: 5px;
        border: none;
    }
    .form-select {
        width: 40px;
        text-align: center;
        cursor: pointer;
    }
    .no-arrow {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 0;
        padding-left: 0;
        background-image: none;
        border: none;
    }
    .no-arrow:focus {
        outline: none;
        box-shadow: none;
    }
</style>