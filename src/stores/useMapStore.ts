import { defineStore } from "pinia";
import type { Junction } from "../models/Junctions";
import type { Link } from "../models/Link";
import type { Step } from "../models/Step";
import type { Stage } from "../models/Stage";
import type { Configuration } from "../models/Configuration";
import type { ChangeConfiguration } from "../models/ChangeConfiguration";

export const useMapStore = defineStore("mapStore", {
  state: () => ({
    junctions: {} as Record<string,Junction>,
    links: {} as Record<string, Link>,
    stages: {} as Record<string, Stage>,
    configurations: {} as Record<string, Configuration>,
    initialLinks: {} as Record<string,Link>,
    resetStore: false as Boolean,
    steps: [] as Step[],
    activeLinks: new Set<string>(),
    changeConfigurations: [] as Record<number, ChangeConfiguration>,
  }),
  actions: {
    setMapData(junctions: Record<string,Junction>, links: Record<string,Link>, stages: Record<string,Stage>, configurations: Record<string,Configuration>) {
      this.junctions = junctions;
      this.stages = stages;
      this.configurations = configurations;
      this.links = links;
      this.calculateActiveLinks()
      this.initialLinks = structuredClone(links);
      this.resetStore = false;
    },
    reset() {
      this.resetStore = true
    },
    setSteps(steps: Step[]) {
      this.steps = steps;
    },
    resetSteps() {
      this.steps = []
    },
    setChangeConfigurations(changeConfigurations: Record<number, ChangeConfiguration>) {
      this.changeConfigurations = changeConfigurations;
    },
    resetLinks() {
      this.links = this.initialLinks;
    },
    updateLinksCounter(linkId: string, counter: number) {
      this.links[linkId].counter = counter;
    },
    getStages() {
      let stages = Object.values(this.stages);
      stages.sort((a, b) => 
        a.active === b.active ? (Number(b.inter) - Number(a.inter)) : Number(b.active) - Number(a.active)
      )
      return stages;
    },
    getConfigurations() {
      let configurations = Object.values(this.configurations);
      configurations.sort((a, b) => Number(b.active) - Number(a.active));
      return configurations;
    },
    getLinks() {
      let links = Object.values(this.links);
      links.sort((a, b) =>
        a.active === b.active ? (b.counter - a.counter) : Number(b.active) - Number(a.active)
      )
      return links;
    },
    calculateActiveLinks() {
      Object.values(this.stages).forEach((stage) => {
        if (stage.active) {
          for (const flow of stage.flows) {
            this.links[flow.fromLinkId].active = true;
            this.links[flow.toLinkId].active = true;
          }
        }
      })
    }
  }
});
