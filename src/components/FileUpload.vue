<template>
  <div class="container row mt-4">
    <div class="col-12 col-lg-6">
        <label class="form-label">Problem file</label>
        <div class="input-group mb-3">
            <input type="file" class="form-control" id="inputGroupFile01" title="Upload problem file" @change="handleFileChange('problem', $event)">
            <button class="input-group-text btn btn-success" @click="uploadProblem" :disabled="!problemFile">Upload</button>
        </div>
    </div>

    <div class="col-12 col-lg-6">
        <label class="form-label">Plan file</label>
        <div class="input-group mb-3">
            <input type="file" class="form-control" id="inputGroupFile02" title="Upload plan file" @change="handleFileChange('plan', $event)">
            <button class="input-group-text btn btn-success" @click="uploadPlan" v-bind:disabled="!planFile || !problemFileUploaded">Upload</button>
        </div>
    </div>
  </div>   
</template>
  
<script setup lang="ts">
import { ref } from "vue";
import { readFileAsText } from "../utils/fileUtils";
import { parseProblemData } from "../utils/problemParser";
import { useMapStore } from "../stores/useMapStore";
import { parsePlanData } from "../utils/planParser";

const mapStore = useMapStore();
  
const problemFile = ref<File | null>(null);
const planFile = ref<File | null>(null);
let problemFileUploaded = ref(false);
let planFileUploaded: boolean = false;

const handleFileChange = (fileType: "problem" | "plan", event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];

      if (fileType === "problem") {
      problemFile.value = file;
    } else if (fileType === "plan") {
      planFile.value = file;
    }
  }
};

const uploadProblem = () => {
  if (!problemFile.value) return;
  if (problemFileUploaded) {
    mapStore.reset()
  }
  readFileAsText(problemFile.value)
    .then((text) => {
      problemFileUploaded.value = true;
      let data = parseProblemData(text);
      mapStore.resetSteps();
      mapStore.setMapData(data.junctions, data.links, data.stages, data.configurations);
    })
    .catch((error) => {
      console.error("Error reading file:", error);
    });
};

const uploadPlan = () => {
  if (planFile.value == null || !problemFileUploaded) return;
  readFileAsText(planFile.value)
    .then((text) => {
      let data = parsePlanData(text);
      mapStore.setSteps(data.steps);
      mapStore.setChangeConfigurations(data.changeConfigurations);
    })
    .catch((error) => {
      console.error("Error reading file:", error);
    });
};
</script>

<style scoped>
  .form-label {
      font-weight: 600;
      margin-bottom: 2px;
      width: 100%;
  }
  .form-control:focus {
    outline: none !important;
    box-shadow: none !important;
    border-color: black;
  }
  button:active {
    transform: scale(0.95);
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  }
</style>
  