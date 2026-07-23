<template>
  <div class="cm-page">
    <PageHeader :title="t('cis.title')" :subtitle="t('cis.subtitle')">
      <template #actions>
        <button class="btn btn-outline-secondary" @click="exportCsv">{{ t('common.export') }}</button>
        <button class="btn btn-primary" @click="openCreateModal">{{ t('cis.newCi') }} <i class="bi bi-plus"></i></button>
        <button class="btn btn-success" @click="openImportHelpModal">{{ t('cis.importCis') }} <i class="bi bi-upload"></i></button>
        <input ref="importFileInput" type="file" accept=".csv,.json" class="d-none" @change="handleImportFile" />
      </template>
    </PageHeader>

    <div class="cm-panel">
      <div class="cm-toolbar">
        <div class="cm-toolbar__search">
          <input
            v-model="serverOptions.searchTerm"
            type="text"
            class="form-control"
            :placeholder="t('cis.searchPlaceholder')"
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
        :no-data-text="t('cis.noData')"
        must-sort
      >
        <template #item-status="item">
          <span :class="['cm-badge', statusBadgeClass(item.status)]">{{ t(`status.${item.status === 'In use' ? 'inUse' : item.status}`, item.status) }}</span>
        </template>
        <template #item-actions="item">
          <button class="btn btn-primary btn-sm me-1" @click="getConfigurationItem(item._id)" :title="t('common.edit')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-success btn-sm" @click="openCIStatusModal(item)" :title="t('common.status')">
            <i class="bi bi-clipboard"></i>
          </button>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="ciModal" tabindex="-1" aria-labelledby="ciModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="ciModalLabel">{{ t('cis.detailsTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label" for="class">{{ t('cis.class') }}</label>
                <input v-model="newItem.className" type="text" class="form-control" id="class" :placeholder="t('cis.class')">
              </div>
              <div class="mb-3">
                <label class="form-label" for="serial">{{ t('cis.serial') }}</label>
                <input v-model="newItem.serialNumber" type="text" class="form-control" id="serial" :placeholder="t('cis.serial')">
              </div>
              <div class="mb-3">
                <label class="form-label" for="brand">{{ t('cis.brand') }}</label>
                <input v-model="newItem.brandName" type="text" class="form-control" id="brand" :placeholder="t('cis.brand')">
              </div>
              <div class="mb-3">
                <label class="form-label" for="model">{{ t('cis.model') }}</label>
                <input v-model="newItem.modelName" type="text" class="form-control" id="model" :placeholder="t('cis.model')">
              </div>
              <div class="mb-3">
                <label class="form-label" for="location">{{ t('cis.location') }}</label>
                <input v-model="newItem.location" type="text" class="form-control" id="location" :placeholder="t('cis.location')">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
              <button type="button" class="btn btn-primary" @click="saveConfigurationItem">{{ t('cis.saveChanges') }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="updateCiStatusModal" tabindex="-1" aria-labelledby="updateCiStatusModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="updateCiStatusModalLabel">{{ t('cis.statusTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <p class="fw-semibold text-center mb-3">{{ stringCI }}</p>
              <div class="mb-3">
                <label class="form-label" for="ciStatus">{{ t('common.status') }}</label>
                <select v-model="newItem.status" class="form-select" id="ciStatus">
                  <option
                    v-for="status in configurationItemStatuses"
                    :key="status"
                    :value="status"
                    :disabled="status === actualStatus"
                  >
                    {{ status }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
              <button type="button" class="btn btn-primary" @click="toggleConfigurationItemStatus(selectedItemId, newItem.status)">{{ t('cis.saveChanges') }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="ciImportModal" tabindex="-1" aria-labelledby="ciImportModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="ciImportModalLabel">{{ t('cis.importTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <p class="mb-2">{{ t('common.importHelp') }}</p>
              <p class="mb-1"><strong>{{ t('common.required') }}:</strong> {{ ciTemplate.required.join(', ') }}</p>
              <p class="mb-3"><strong>{{ t('common.optional') }}:</strong> {{ t('cis.optionalStatus') }}</p>
              <p class="mb-1">{{ t('common.csvExample') }}</p>
              <pre class="border rounded p-3 small mb-0">{{ ciTemplate.preview }}</pre>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" @click="downloadCiTemplate">
                <i class="bi bi-download"></i> {{ t('common.downloadTemplate') }}
              </button>
              <button type="button" class="btn btn-success" @click="pickImportFile">
                <i class="bi bi-upload"></i> {{ t('common.selectFile') }}
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { hideModal, showModal } from '../utils/modal';
import { normalizeSortParams } from '../utils/sortParams';
import {
  CI_IMPORT_TEMPLATE,
  downloadCsvTemplate,
  parseImportFile,
} from '../utils/importHelpers';

const { t } = useI18n();
const ciTemplate = CI_IMPORT_TEMPLATE;

const statusBadgeClass = (status) => {
  const map = {
    stock: 'cm-badge--stock',
    'In use': 'cm-badge--in-use',
    retired: 'cm-badge--retired',
    missing: 'cm-badge--missing',
    damaged: 'cm-badge--damaged',
  };
  return map[status] || 'cm-badge--muted';
};

const headers = computed(() => [
  { text: t('cis.class'), value: 'className', sortable: true },
  { text: t('cis.serial'), value: 'serialNumber', sortable: true },
  { text: t('cis.brand'), value: 'brandName', sortable: true },
  { text: t('cis.model'), value: 'modelName', sortable: true },
  { text: t('cis.location'), value: 'location', sortable: true },
  { text: t('common.status'), value: 'status', sortable: true },
  { text: t('common.actions'), value: 'actions', sortable: false },
]);

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

    const response = await api.get('/cis', {
      params: {
        page,
        rowsPerPage,
        ...normalizeSortParams(sortBy, sortType),
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
  showModal('ciModal');
};

const getConfigurationItem = async (id) => {
  try {
    const response = await api.get(`/cis/${id}`);
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

    showModal('ciModal');
  } catch {
    Swal.fire({
      icon: 'error',
      title: t('common.error'),
      text: t('cis.fetchError'),
    });
  }
};

const saveConfigurationItem = async () => {
  const payload = { ...newItem.value };

  try {
    if (isEditing.value && currentId.value) {
      await api.post(`/cis/${currentId.value}`, payload);
      Swal.fire(t('common.updated'), t('cis.updatedMsg'), 'success');
    } else {
      await api.post('/cis', payload);
      Swal.fire(t('common.created'), t('cis.createdMsg'), 'success');
    }

    newItem.value = {
      className: '',
      serialNumber: '',
      brandName: '',
      modelName: '',
      location: '',
    };
    isEditing.value = false;
    currentId.value = null;

    hideModal('ciModal');

    await fetchItems();
  } catch (error) {
    const messages = error.response?.data?.errors?.map((err) => err.msg) || [t('cis.unexpectedError')];
    const { messagesToSafeHtml } = await import('../utils/safeHtml');
    Swal.fire({
      icon: 'error',
      title: t('cis.saveError'),
      html: messagesToSafeHtml(messages),
    });
  }
};

const configurationItemStatuses = ['In use', 'stock', 'retired', 'missing', 'damaged'];

const stringCI = ref('');
const actualStatus = ref('');
const selectedItemId = ref(null);
const importFileInput = ref(null);

const openCIStatusModal = (item) => {
  actualStatus.value = item.status;
  selectedItemId.value = item._id;
  newItem.value.status = item.status === 'In use' ? 'stock' : 'In use';
  stringCI.value = item.brandName + ' ' + item.modelName + ' ' + item.serialNumber;
  showModal('updateCiStatusModal');
};

const toggleConfigurationItemStatus = async (id, statusValue) => {
  try {
    await api.put(`/cis/${id}/status`, { status: statusValue });

    Swal.fire(t('common.updated'), t('cis.statusUpdated'), 'success');
    hideModal('updateCiStatusModal');
    await fetchItems();
  } catch (error) {
    const errorMsg = error.response?.data?.message || t('cis.statusError');
    Swal.fire({
      icon: 'error',
      title: t('common.error'),
      text: errorMsg,
    });
  }
};

const openImportHelpModal = () => {
  showModal('ciImportModal');
};

const downloadCiTemplate = () => {
  downloadCsvTemplate(ciTemplate.filename, ciTemplate.headers, ciTemplate.sampleRow);
};

const pickImportFile = () => {
  importFileInput.value?.click();
};

const handleImportFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    const itemsToImport = await parseImportFile(file);
    const { data } = await api.post('/cis/import', { items: itemsToImport });
    hideModal('ciImportModal');
    Swal.fire({
      icon: data.errorCount ? 'warning' : 'success',
      title: t('cis.importDone'),
      text: `${t('cis.createdCount')}: ${data.createdCount} · ${t('cis.errorCount')}: ${data.errorCount}`,
    });
    await fetchItems();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: t('cis.importFailed'),
      text: error.response?.data?.message || error.message || t('cis.importErrorGeneric'),
    });
  }
};

const exportCsv = async () => {
  const { data } = await api.get('/export/cis', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'configuration_items.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};
</script>
