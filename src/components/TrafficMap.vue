<template>
<div class="container mt-4 hover-container">
  <div class="ct" ref="fullscreenTarget">
    <svg ref="mapContainer"></svg>
    <div class="hover-map" v-if="hasJunctions">
      <button :class="['btn btn-sm me-2', simulationStore.activeToggleLinks ? 'btn-warning' : 'btn-light']" @click="toggleLinks" data-bs-toggle="tooltip" data-bs-placement="top"   :title="simulationStore.activeToggleLinks ? 'Show all edges' : 'Highlight active edges'">
        <i class="bi bi-eye"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="pickFile" data-bs-toggle="tooltip" data-bs-placement="top" title="Import map layout">
        <i class="bi bi-file-earmark-arrow-up"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="exportLayout" data-bs-toggle="tooltip" data-bs-placement="top" title="Export map layout">
        <i class="bi bi-file-earmark-arrow-down"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="rotateGraph" data-bs-toggle="tooltip" data-bs-placement="top" title="Rotate map">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="toggleFullscreen"
            data-bs-toggle="tooltip" data-bs-placement="top"
            :title="isFullscreen ? 'Exit full screen' : 'Full screen'">
      <i :class="isFullscreen ? 'bi bi-fullscreen-exit' : 'bi bi-fullscreen'"></i>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        style="display: none"
        @change="importLayout"
      />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { useTrafficMap } from '../composables/trafficMap/useTrafficMap';
import { useSimulationStore } from '../stores/useSimulationStore';

  const simulationStore = useSimulationStore();
  const { mapContainer, fileInput, hasJunctions, fullscreenTarget, isFullscreen, toggleFullscreen,
    pickFile, importLayout, exportLayout, toggleLinks, rotateGraph } = useTrafficMap();
</script>

<style scoped>
    .ct {
      border: 1px solid black;
      border-radius: 10px;
      height: 500px;
      position: relative;
    }

    .ct:fullscreen {
      width: 100vw;
      height: 100vh;
      background: white;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .hover-map {
      display: none;
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 10;
      text-align: end;
    }

    .ct:hover .hover-map {
      display: inline-block;
    }

</style>
\