<template>
    <div class="container" v-if="hasJunctions">
      <div class="mt-4 tabs text-start">
        <button v-for="tab in tabs" :key="tab" class = "btn me-2" 
                :class="activeTab === tab ? 'btn-warning' : 'btn-light'"
                @click="selectTab(tab)">
          {{ tab }}
        </button>
        <div class="d-inline-block search-bar float-end">
          <input type="text" class="form-control" placeholder="Type to search" v-model="searchTerm">
        </div>
      </div>
      <!--Links-->
      <div class="table-container mt-2 overflow-y-auto w-100" v-if="activeTab === 'Links'">
        <table class="table table-hover rounded-2 overflow-hidden">
          <thead class="table-dark">
            <tr>
              <th>Link</th>
              <th>Capacity</th>
              <th>Occupancy</th>
              <th>Occupancy rate</th>
              <th>Counter</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
            <tr v-for="link in filteredSearch as any">
              <td>{{ link.id }}</td>
              <td>{{ (link.capacity).toFixed(2) }}</td>
              <td>{{ (link.occupancy).toFixed(2) }}</td>
              <td>{{ Math.round((link.occupancy / link.capacity) * 100) }}%</td>
              <td>{{ (link.counter).toFixed(2) }}</td>
              <td>
                <i v-if="link.active" class="bi bi-circle-fill text-success"></i>
                <i v-else class="bi bi-circle-fill text-danger"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--Junctions-->
      <div class="table-container mt-2 overflow-y-auto w-100" v-if="activeTab === 'Junctions'">
        <table class="table table-hover rounded-2 overflow-hidden">
          <thead class="table-dark">
            <tr>
              <th>Junction</th>
              <th>Greentime</th>
              <th>Intertime</th>
              <th>Countcycle</th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
            <tr v-for="junction in filteredSearch as any">
              <td>{{ junction.id }}</td>
              <td>{{ junction.greentime }}</td>
              <td>{{ junction.intertime }}</td>
              <td>{{ junction.countcycle }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--Stages-->
      <div class="table-container mt-2 overflow-y-auto w-100" v-if="activeTab === 'Stages'">
        <table class="table table-hover rounded-2 overflow-hidden">
          <thead class="table-dark">
            <tr>
              <th>Stage</th>
              <th>Junction</th>
              <th>Active</th>
              <th>Inter</th>
              <th>Interlimit</th>
              <th>Flows</th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
            <tr v-for="stage in filteredSearch as any">
              <td>{{ stage.id }}</td>
              <td>{{ stage.juncId }}</td>
              <td><i v-if="stage.active" class="bi bi-circle-fill text-success"></i>
                <i v-else class="bi bi-circle-fill text-danger"></i>
              </td>
              <td><i v-if="stage.inter" class="bi bi-circle-fill text-success"></i>
                <i v-else class="bi bi-circle-fill text-danger"></i>
              </td>
              <td>{{ stage.interlimit }}</td>
              <td>
                <table class="table table-hover subtable rounded-2 overflow-hidden">
                  <thead class="table-success">
                    <tr>
                      <th>Source</th>
                      <th>Target</th>
                      <th>Turnrate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="flow in stage.flows">
                      <td>{{ flow.fromLinkId }}</td>
                      <td>{{ flow.toLinkId }}</td>
                      <td>{{ flow.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--Configurations-->
      <div class="table-container mt-2 overflow-y-auto w-100" v-if="activeTab === 'Configurations'">
        <table class="table table-hover rounded-2 overflow-hidden">
          <thead class="table-dark">
            <tr>
              <th>Configuration</th>
              <th>Active</th>
              <th>Stages</th>
            </tr>
          </thead>
          <tbody class="table-group-divider">
            <tr v-for="conf in filteredSearch as any">
              <td>{{ conf.id }}</td>
              <td><i v-if="conf.active" class="bi bi-circle-fill text-success"></i>
                <i v-else class="bi bi-circle-fill text-danger"></i>
              </td>
              <td>
                <table class="table table-hover subtable">
                  <thead class="table-success">
                    <tr>
                      <th>Stage</th>
                      <th>Greentime</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(tuples, stageName) in conf.stages" :key="stageName">
                      <template v-for="(tuple, index) in tuples" :key="index">
                        <td>{{ tuple[0] }}</td>
                        <td>{{ tuple[1] }}</td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
</template>

<script setup lang="ts">
import { useDataVisualiztion } from '../composables/useDataVisualization';

  const { tabs, activeTab, searchTerm, filteredSearch, hasJunctions,
          selectTab} = useDataVisualiztion();

</script>

<style>
  .table-container {
    max-height: 500px;
  }
  th {
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .subtable {
    position: sticky;
  }
  .form-switch .form-check-input:focus {
    border-color: rgba(0, 0, 0, 0.25);
    outline: 0;
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
  .form-switch .form-check-input:checked {
    background-color: goldenrod;
    border-color: goldenrod;
    border: none;
  }
  .search-bar input:focus {
    outline: none !important;
    box-shadow: 0 0 3px rgba(42, 42, 43, 0.226) !important;
    border-color: rgb(196, 196, 196);
  }
</style>