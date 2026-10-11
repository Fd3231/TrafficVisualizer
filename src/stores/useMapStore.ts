import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import type { Junction } from "../models/Junctions";
import type { Link } from "../models/Link";
import type { Step } from "../models/Step";
import type { Stage } from "../models/Stage";
import type { Configuration } from "../models/Configuration";
import type { ChangeConfiguration } from "../models/ChangeConfiguration";

export const useMapStore = defineStore("mapStore", () => {
  const junctions = ref<Record<string, Junction>>({});
  const links = ref<Record<string, Link>>({});
  const stages = ref<Record<string, Stage>>({});
  const configurations = ref<Record<string, Configuration>>({});
  const initialLinks = ref<Record<string, Link>>({});
  const resetStore = ref(false);
  const steps = ref<Step[]>([]);
  const changeConfigurations = ref<Record<number, ChangeConfiguration>>({});

  const sortedStages = computed(() =>
    Object.values(stages.value).sort((a, b) => 
      a.active === b.active ? (Number(b.inter) - Number(a.inter)) : Number(b.active) - Number(a.active)
    )
  )

  const sortedConfigurations = computed(() =>
    Object.values(configurations.value).sort(
      (a, b) => Number(b.active) - Number(a.active)
    )
  );

  const sortedLinks = computed(() => 
    Object.values(links.value).sort((a, b) =>
        a.active === b.active ? (b.counter - a.counter) : Number(b.active) - Number(a.active)
    ) 
  )

  function setMapData(newJunctions: Record<string, Junction>, newLinks: Record<string, Link>,
    newStages: Record<string, Stage>, newConfigurations: Record<string, Configuration>) {
    junctions.value = newJunctions;
    stages.value = newStages;
    configurations.value = newConfigurations;
    links.value = newLinks;
    calculateActiveLinks();
    initialLinks.value = structuredClone(newLinks);
    resetStore.value = false;
  }

  function reset() {
    resetStore.value = true;
  }

  function setSteps(newSteps: Step[]) {
    steps.value = newSteps;
  }

  function resetSteps() {
    steps.value = [];
  }

  function setChangeConfigurations(newChangeConfigurations: Record<number, ChangeConfiguration>) {
    changeConfigurations.value = newChangeConfigurations;
  }

  function resetLinks() {
    links.value = structuredClone(toRaw(initialLinks.value));
  }

  function updateLinksCounter(linkId: string, counter: number) {
    links.value[linkId].counter = counter;
  }

  function calculateActiveLinks() {
    Object.values(stages.value).forEach((stage) => {
      if (stage.active) {
        for (const flow of stage.flows) {
          links.value[flow.fromLinkId].active = true;
          links.value[flow.toLinkId].active = true;
        }
      }
    });
  }

  function applyLink({ id, occupancy, counter }: Link) {
    Object.assign(links.value[id], { occupancy, counter });
  }

  function applyJunction({ id, greentime, intertime, countcycle }: Junction) {
    Object.assign(junctions.value[id], { greentime, intertime, countcycle });
  }

  function setStageActive(stage: Stage) {
    const target = stages.value[stage.id];
    for (const flow of target.flows) {
      links.value[flow.fromLinkId].active = stage.active;
      links.value[flow.toLinkId].active = stage.active;
    }
    target.active = stage.active;
  }

  function applyInterStage(stage: Stage) {
    if (!stage.active) setStageActive(stage);
    stages.value[stage.id].inter = stage.inter;
  }

  function applyActiveStage(stage: Stage) {
    if (stage.active) setStageActive(stage);
  }

  function applyConfiguration({ id, active }: Configuration) {
    configurations.value[id].active = active;
  }

  function applyStep(index: number) {
    const step = steps.value[index];
    if (!step) return;

    step.links.forEach(applyLink);
    step.junctions.forEach(applyJunction);
    step.stages.forEach(applyInterStage);
    step.stages.forEach(applyActiveStage);
    step.configurations.forEach(applyConfiguration);
  }

  return { junctions, links, stages, configurations, initialLinks,
    resetStore, steps, changeConfigurations, sortedStages, sortedConfigurations,
    sortedLinks,
    setMapData, reset, setSteps, resetSteps, setChangeConfigurations,
    resetLinks, updateLinksCounter, calculateActiveLinks, applyStep
  };

})