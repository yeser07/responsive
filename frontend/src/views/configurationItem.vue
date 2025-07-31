<template>
  <div>
    <h2>Configuration Items</h2>
    <p>List of all configuration items in the system.</p>

    <div class="row mb-3">
      <div class="col-md-6">
        <input
          v-model="serverOptions.searchTerm"
          type="text"
          class="form-control"
          placeholder="Search by class, serial, brand, model, location, or status"
        />
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
    />
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
      { text: 'Clase', value: 'className' },
      { text: 'Serial', value: 'serialNumber' },
      { text: 'Marca', value: 'brandName' },
      { text: 'Modelo', value: 'modelName' },
      { text: 'Ubicación', value: 'location' },
      { text: 'Estado', value: 'status' },
    ];

    const items = ref([]);
    const loading = ref(false);
    const serverItemsLength = ref(0);
    const serverOptions = ref({
      page: 1,
      rowsPerPage: 10,
      sortBy: ['className', 'serialNumber', 'brandName', 'modelName', 'location', 'status'],
      sortType: ['asc','desc'],
      searchTerm: '',
    });

    const fetchItems = async () => {
      loading.value = true;

      try {
        const { page, rowsPerPage, sortBy, sortType, searchTerm } = serverOptions.value;

        const response = await axios.get(`${apiUrl}/cis`, {
          params: {
            page,
            rowsPerPage,
            sortBy: sortBy[0] || '',
            sortType: sortType[0] || '',
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
});
</script>
