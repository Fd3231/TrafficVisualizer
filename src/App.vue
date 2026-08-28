<script setup lang="ts">
import FileUpload from './components/FileUpload.vue'
import Simulation from './components/Simulation.vue';
import TrafficMap from './components/TrafficMap.vue';
import DataVisualization from './components/DataVisualization.vue';
</script>

<template>
    <div class="container">
        <h1 class="title">Traffic Visualizer</h1>
        <FileUpload/>
        <TrafficMap/>
        <Simulation/>
        <DataVisualization/>
        <footer></footer>
    </div>
</template>

<style scoped>
    .title {
        font-weight: bold;
        align-self: center;
    }
    .container {
        text-align: center;
    }
    footer {
        height: 40px;
        margin-top: 20px;
    }
</style>
