<template>
  <div>
    <h2>Configuration Items</h2>
    <p>List of all configuration items in the system.</p>

    <div class="row mb-3">
      <div class="col-md-6">
        <input v-model="serverOptions.searchTerm" type="text" class="form-control"
          placeholder="Search by class, serial, brand, model, location, or status" />
      </div>
      <div class="col-md-2">
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#ciModal">New CI <span><i class="bi bi-plus"></i></span></button>
      </div>
      <div class="col-md-2">
        <button class="btn btn-success">Import CIs <span><i class="bi bi-upload"></i></span></button>
      </div>
    </div>
    <EasyDataTable 
          v-model:server-options="serverOptions" 
          :server-items-length="serverItemsLength" 
          :loading="loading"
          :headers="headers" 
          :items="items" 
          buttons-pagination 
          show-index 
        :no-data-text="'No configuration items found.'"
          must-sort>
          
        <template #item-actions="{ item }">
          <button class="btn btn-primary"><span><i class="bi bi-pencil"></i></span></button>
          <button class="btn btn-danger"><span><i class="bi bi-trash"></i></span></button>
        </template>
    </EasyDataTable>

    <!-- modal -->
    <div class="modal fade" id="ciModal" tabindex="-1" aria-labelledby="ciModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ciModalLabel">Configuration Item Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body  ">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="class">Class</label>
                  <input type="text" class="form-control" id="class" placeholder="Class">
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="serial">Serial</label>
                  <input type="text" class="form-control" id="serial" placeholder="Serial">
                </div>
              </div>
            </div>            
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="brand">Brand</label>
                  <input type="text" class="form-control" id="brand" placeholder="Brand">
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="model">Model</label>
                  <input type="text" class="form-control" id="model" placeholder="Model">
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="location">Location</label>
                  <input type="text" class="form-control" id="location" placeholder="Location">
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue';
import axios from 'axios';
import apiUrl from '../config';
import 'vue3-easy-data-table/dist/style.css';
import EasyDataTable from 'vue3-easy-data-table';

export default defineComponent({
  components: { EasyDataTable },
  setup() {
    const headers = [
      { text: 'Class', value: 'className', sortable: true },
      { text: 'Serial', value: 'serialNumber', sortable: true },
      { text: 'Brand', value: 'brandName', sortable: true },
      { text: 'Model', value: 'modelName', sortable: true },
      { text: 'Location', value: 'location', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Actions', value: 'actions', sortable: false, },
    ];

    const items = ref([]);
    const loading = ref(false);
    const serverItemsLength = ref(0);
    const serverOptions = ref({
      page: 1,
      rowsPerPage: 10,
      sortBy: ['className'],
      sortType: ['asc'],
      searchTerm: '',
    });

    // Fetch items from the API
    const fetchItems = async () => {
      loading.value = true;

      try {
        const { page, rowsPerPage, sortBy, sortType, searchTerm } = serverOptions.value;

        const response = await axios.get(`${apiUrl}/cis`, {
          params: {
            page,
            rowsPerPage,
            sortBy: JSON.stringify(sortBy),
            sortType: JSON.stringify(sortType),
            search: searchTerm || '',
          },
        });

        items.value = response.data.items;
        serverItemsLength.value = response.data.total;
      } catch (error) {
        console.error('Error fetching configuration items:', error);
        items.value = [];
        serverItemsLength.value = 0;
      } finally {
        loading.value = false;
      }
    };

    watch(serverOptions, fetchItems, { deep: true, immediate: true });

    return {
      headers,
      items,
      loading,
      serverOptions,
      serverItemsLength,
    };
  },
  methods: {

  },
});
</script>
