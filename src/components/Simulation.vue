<template>
  <div class="container-fluid">

  <div class="row mt-4 position-relative w-100 p-0 m-0" v-if="hasSteps">
      <input type="range" ref="rangeInput" class="range-dark form-range col mx-1 mt-2" min="0" :max="lastStep" step="1" v-model.number="currentStep", list="tickmarks">

      <div class="position-absolute pe-none h-100">
        <div v-for="conf in mapStore.changeConfigurations"
          :key="conf.time" class="tick position-absolute rounded-circle border border-secondary" :style="getTickStyle(conf.time)" />
      </div>

      <select role="button" class="form-select no-arrow shadow-none text-center w-auto px-1 border-0" v-model="speed">
        <option v-for="option in speeds" :key="option" :value="option">{{ option }}x</option>
      </select>

      <button class="btn col-auto p-1 border-0" :disabled="!canGoBack" @click="previous">
        <i class="bi bi-caret-down-fill" />
      </button>
      <input type="text" class="mx-1 col-auto current-input text-center rounded border border-secondary" v-model.lazy="stepInput">
      <button class="btn col-auto p-1 border-0" :disabled="!canGoForward" @click="next">
        <i class="bi bi-caret-up-fill" />
      </button>

      <button class="btn btn-outline-success col-auto mx-1" @click="toggle">
        <i class="bi" :class="isPlaying ? 'bi-pause-fill' : 'bi-play-fill'" />
      </button>
      <button class="btn btn-outline-danger col-auto mx-1" @click="stop">
        <i class="bi bi-stop-fill" />
      </button>
    </div>

    <div class="change-label text-start fw-semibold p-1 border border-secondary rounded-3 mt-1" v-if="currentChange">
      {{ currentChange.fromConf }} <i class="bi bi-arrow-right" /> {{ currentChange.toConf }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useSimulationPlayer } from '../composables/useSimulationPlayer';
  import { useMapStore } from '../stores/useMapStore';

  const mapStore = useMapStore();
  const { speeds, speed, currentStep, stepInput, isPlaying, 
      lastStep, canGoBack, canGoForward, rangeInput, hasSteps,
      currentChange,
      next, previous, toggle, stop } = useSimulationPlayer();
  
  const getTickStyle = (time: number) => {
    const input = rangeInput.value
    if (!input) return {}

    const max = Number(input.max)
    const width = input.getBoundingClientRect().width
    const thumbWidth = 16

    const ratio = time / max
    const position = thumbWidth / 2 + ratio * (width - thumbWidth)-6

    return {
      left: `${input.offsetLeft + position}px`,
    }
  };

</script>


<style scoped>
    .current-input {
        max-width: 60px;
    }

    .current-input:focus {
        outline: none !important;
        box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
    }

    .change-label {
        background-color: burlywood;
        font-size: 15px;
        width: fit-content;
    }

    .container {
      width: 98%;
    }

    .tick {
        margin-top: 14px;
        width: 12px;
        height: 12px;
        background-color: burlywood;
    }

    .no-arrow {
        appearance: none;
        background-image: none;
    }

    .range-dark::-webkit-slider-thumb,
    .range-dark:active::-webkit-slider-thumb {
        background-color: #000 !important;
        /*box-shadow: 2px 2px 4px rgba(56, 56, 56, 0.8);*/
    }

    .range-dark::-moz-range-thumb,
    .range-dark:active::-moz-range-thumb {
        background-color: #000 !important;
    }

  .range-dark:focus::-webkit-slider-thumb {
    background-color: #000 !important;
    box-shadow:
        0 0 0 1px #fff,
        0 0 0 .25rem rgba(0, 0, 0, .25),
        2px 2px 4px rgba(56, 56, 56, .8);
  }

  .range-dark:focus::-moz-range-thumb {
      background-color: #000 !important;
      box-shadow: 0 0 0 1px #fff, 0 0 0 .25rem rgba(0, 0, 0, .25);
  }
</style>
