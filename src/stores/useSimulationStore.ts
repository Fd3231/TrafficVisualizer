import { defineStore } from "pinia";

export const useSimulationStore = defineStore("simulationStore", {
  state: () => ({
    activeSimulation: false as Boolean,
    activeToggleLinks: false as Boolean,
  }),
  actions: {
    activateSimulation() {
        this.activeSimulation = true;
    },
    stopSimulation() {
        this.activeSimulation = false;
    }
  }
});
