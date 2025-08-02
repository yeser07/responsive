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
        <button class="btn btn-primary" @click="openCreateModal">New CI <span><i class="bi bi-plus"></i></span></button>
      </div>
      <div class="col-md-2">
        <button class="btn btn-success">Import CIs <span><i class="bi bi-upload"></i></span></button>
      </div>
    </div>
    <EasyDataTable v-model:server-options="serverOptions" :server-items-length="serverItemsLength" :loading="loading"
      :headers="headers" :items="items" buttons-pagination show-index :no-data-text="'No configuration items found.'"
      must-sort>

      <template #item-actions="item">
          <button class="btn btn-primary" @click="getConfigurationItem(item._id)">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-success" @click="openCIStatusModal(item)">
            <i class="bi bi-clipboard"></i>
          </button>
    </template>
    </EasyDataTable>

    <!-- modal new ci -->
    <div class="modal fade" id="ciModal" tabindex="-1" aria-labelledby="ciModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="ciModalLabel">Configuration Item Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="form-group mb-3">
              <label for="class">Class</label>
              <input v-model="newItem.className" type="text" class="form-control" id="class" placeholder="Class">
            </div>

            <div class="form-group mb-3">
              <label for="serial">Serial</label>
              <input v-model="newItem.serialNumber" type="text" class="form-control" id="serial"
                placeholder="Serial Number">
            </div>

            <div class="form-group mb-3">
              <label for="brand">Brand</label>
              <input v-model="newItem.brandName" type="text" class="form-control" id="brand" placeholder="Brand">
            </div>

            <div class="form-group mb-3">
              <label for="model">Model</label>
              <input v-model="newItem.modelName" type="text" class="form-control" id="model" placeholder="Model">
            </div>

            <div class="form-group mb-3">
              <label for="location">Location</label>
              <input v-model="newItem.location" type="text" class="form-control" id="location" placeholder="Location">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" @click="saveConfigurationItem">Save changes</button>
          </div>
        </div>
      </div>
    </div>
 <!-- End modal new ci -->
<!-- modal Update Ci Status -->
    <div class="modal fade" id="updateCiStatusModal" tabindex="-1" aria-labelledby="updateCiStatusModalLabel"
      aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-center" id="updateCiStatusModalLabel">Update Configuration Item Status</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <h5 class="text-center">{{ stringCI }}</h5>
            <div class="form-group mb-3">
              <label for="ciStatus">Status</label>
              <select v-model="newItem.status" class="form-select" id="ciStatus">
                <option 
                  v-for="(status, key) in configurationItemStatus" 
                  :key="key" 
                  :value="key" 
                  :disabled="key === actualStatus"
                >
                  {{ status }}
                </option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" @click="toggleConfigurationItemStatus(selectedItemId,newItem.status)">Save changes</button>
          </div>
        </div>
      </div>
    </div>

<!-- End modal Update Ci Status -->

  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import apiUrl from '../config';
import Swal from 'sweetalert2';
import * as bootstrap from 'bootstrap';

const headers = [
  { text: 'Class', value: 'className', sortable: true },
  { text: 'Serial', value: 'serialNumber', sortable: true },
  { text: 'Brand', value: 'brandName', sortable: true },
  { text: 'Model', value: 'modelName', sortable: true },
  { text: 'Location', value: 'location', sortable: true },
  { text: 'Status', value: 'status', sortable: true },
  { text: 'Actions', value: 'actions', sortable: false },
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

const newItem = ref({
  className: '',
  serialNumber: '',
  brandName: '',
  modelName: '',
  location: '',
});

const isEditing = ref(false);
const currentId = ref(null);

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

const openCreateModal = () => {
  isEditing.value = false;
  currentId.value = null;
  newItem.value = {
    className: '',
    serialNumber: '',
    brandName: '',
    modelName: '',
    location: '',
  };
  const modal = new bootstrap.Modal(document.getElementById('ciModal'));
  modal.show();
};

const getConfigurationItem = async (id) => {
  try {
    const response = await axios.get(`${apiUrl}/cis/${id}`);
    const item = response.data;

    newItem.value = {
      className: item.className,
      serialNumber: item.serialNumber,
      brandName: item.brandName,
      modelName: item.modelName,
      location: item.location,
    };

    isEditing.value = true;
    currentId.value = id;

    const modal = new bootstrap.Modal(document.getElementById('ciModal'));
    modal.show();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error Fetching Configuration Item',
      text: 'Could not retrieve the configuration item details.',
    });
  }
};

const saveConfigurationItem = async () => {
  const payload = { ...newItem.value };

  try {
    if (isEditing.value && currentId.value) {
      // EDIT (POST to /:id)
      await axios.post(`${apiUrl}/cis/${currentId.value}`, payload);
      Swal.fire('Updated', 'Configuration Item updated successfully.', 'success');
    } else {
      // CREATE
      await axios.post(`${apiUrl}/cis`, payload);
      Swal.fire('Created', 'Configuration Item created successfully.', 'success');
    }

    // Reset
    newItem.value = {
      className: '',
      serialNumber: '',
      brandName: '',
      modelName: '',
      location: '',
    };
    isEditing.value = false;
    currentId.value = null;

    const modal = bootstrap.Modal.getInstance(document.getElementById('ciModal'));
    modal.hide();

    await fetchItems();
  } catch (error) {
    const messages = error.response?.data?.errors?.map(err => err.msg) || ['Unexpected error'];
    Swal.fire({
      icon: 'error',
      title: 'Error Saving Configuration Item',
      html: `<ul>${messages.map(msg => `<li>${msg}</li>`).join('')}</ul>`,
    });
  }
};

//['In use', 'stock', 'retired', 'missing', 'damaged'];
const configurationItemStatus = {
  inUse:    'In use', 
  stock:    'stock',
  retired:  'retired',
  missing:  'missing',
  damaged:  'damaged',
};

const stringCI = ref('');
const actualStatus = ref('');
const selectedItemId = ref(null);
const openCIStatusModal = (item) => {
  actualStatus.value = item.status;
  selectedItemId.value = item._id;
   stringCI.value = item.brandName + ' ' + item.modelName + ' ' + item.serialNumber;
  const modal = new bootstrap.Modal(document.getElementById('updateCiStatusModal'));
  modal.show();
}

const toggleConfigurationItemStatus = async (id, statusKey) => {
  const statusValue = configurationItemStatus[statusKey]; // Ej. "In use", "stock", etc.

  try {
    await axios.put(`${apiUrl}/cis/${id}/${statusValue}`);

    Swal.fire('Updated', 'Configuration Item status updated successfully.', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('updateCiStatusModal'));
    modal.hide();
    await fetchItems();
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Could not update the configuration item status.';
    Swal.fire({
      icon: 'error',
      title: 'Error Updating Status',
      text: errorMsg,
    });
  }
};

</script>

<style scoped>
#ciModal .modal-content {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: #fff;
  padding: 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header */
#ciModal .modal-header {
  border-bottom: 2px solid #1a65b6;
  /* azul bootstrap */
  padding-bottom: 0.75rem;
}

#ciModal .modal-title {
  color: #007bff;
  font-weight: 700;
  font-size: 1.5rem;
}

/* Inputs y labels */
#ciModal label {
  font-weight: 600;
  color: #333;
}

#ciModal .form-control {
  border-radius: 8px;
  border: 1.5px solid #ced4da;
  transition: border-color 0.3s ease;
}

#ciModal .form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 6px rgba(0, 123, 255, 0.5);
}

/* Footer */
#ciModal .modal-footer {
  border-top: 2px solid #eee;
  padding-top: 1rem;
  justify-content: flex-end;
}

/* Botones */
#ciModal .btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

#ciModal .btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

#ciModal .btn-secondary {
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  font-weight: 600;
}

/* Botón cerrar */
#ciModal .btn-close {
  filter: brightness(0.4);
  transition: filter 0.2s ease;
}

#ciModal .btn-close:hover {
  filter: brightness(1);
  cursor: pointer;
}
</style>