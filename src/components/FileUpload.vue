<template>
  <div class="container row mt-4">
    <div class="col-12 col-lg-6">
        <label class="form-label w-100 mb-1 fw-semibold" for="inputGroupFile01">Problem file</label>
        <div class="input-group mb-3">
            <input type="file" class="form-control" id="inputGroupFile01" title="Upload problem file" @change="handleFileChange('problem', $event)">
            <button class="input-group-text btn btn-success" @click="uploadProblem" v-bind:disabled="!canUploadProblem">Upload</button>
        </div>
    </div>

    <div class="col-12 col-lg-6">
        <label class="form-label w-100 mb-1 fw-semibold" for="inputGroupFile02">Plan file</label>
        <div class="input-group mb-3">
            <input ref="planInput" type="file" class="form-control" id="inputGroupFile02" title="Upload plan file" @change="handleFileChange('plan', $event)">
            <button class="input-group-text btn btn-success" @click="uploadPlan" v-bind:disabled="!canUploadPlan">Upload</button>
        </div>
    </div>
  </div>   
</template>
  
<script setup lang="ts">
  import { useFileUpload } from '../composables/useFileUpload';

  const { planInput, canUploadProblem, canUploadPlan,
    handleFileChange, uploadProblem, uploadPlan } = useFileUpload();

</script>

<style scoped>
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
  