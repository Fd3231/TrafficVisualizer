import { defineStore } from "pinia";
import { ref } from "vue";

export const useSimulationStore = defineStore("simulationStore", () => {
  const activeSimulation = ref(false);
  const activeToggleLinks = ref(false);

  function activateSimulation() {
    activeSimulation.value = true;
  }

  function stopSimulation() {
    activeSimulation.value = false;
  }

  return {
    activeSimulation, activeToggleLinks,
    activateSimulation, stopSimulation,
  };
});