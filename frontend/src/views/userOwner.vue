<template>
  <div class="cm-page">
    <PageHeader :title="t('users.title')" :subtitle="t('users.subtitle')">
      <template #actions>
        <button class="btn btn-primary" @click="openCreateModal">{{ t('common.new') }} <i class="bi bi-plus"></i></button>
        <button class="btn btn-success" @click="openImportHelpModal">
          {{ t('common.import') }} <i class="bi bi-upload"></i>
        </button>
        <input ref="importFileInput" type="file" accept=".csv,.json" class="d-none" @change="handleImportFile" />
      </template>
    </PageHeader>

    <div class="cm-panel">
      <div class="cm-toolbar">
        <div class="cm-toolbar__search">
          <input v-model="search" type="text" class="form-control" :placeholder="t('users.searchPlaceholder')" />
        </div>
      </div>

      <EasyDataTable :headers="headers" :items="filteredItems" :loading="loading" buttons-pagination show-index
        :no-data-text="t('users.noData')">
        <template #item-status="item">
          <span :class="['cm-badge', item.status === 'active' ? 'cm-badge--active' : 'cm-badge--inactive']">
            {{ item.status }}
          </span>
        </template>
        <template #item-actions="item">
          <button class="btn btn-primary btn-sm me-1" @click="openEditModal(item)" :title="t('common.edit')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="toggleStatus(item)" :title="t('common.status')">
            <i class="bi bi-toggle-on"></i>
          </button>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="userOwnerModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? t('users.editTitle') : t('users.newTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">{{ t('users.name') }}</label>
                <input v-model="form.name" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('users.logon') }}</label>
                <input v-model="form.logonUser" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('users.job') }}</label>
                <input v-model="form.jobDescription" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
              <button type="button" class="btn btn-primary" @click="save">{{ t('common.save') }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal fade" id="userOwnerImportModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ t('users.importTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <p class="mb-2">{{ t('common.importHelp') }}</p>
              <p class="mb-1"><strong>{{ t('common.required') }}:</strong> {{ userTemplate.required.join(', ') }}</p>
              <p class="mb-3"><strong>{{ t('common.optional') }}:</strong> {{ t('users.optionalStatus') }}</p>
              <p class="mb-1">{{ t('common.csvExample') }}</p>
              <pre class="border rounded p-3 small mb-0">{{ userTemplate.preview }}</pre>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-primary" @click="downloadUserTemplate">
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { hideModal, showModal } from '../utils/modal';
import {
  USER_OWNER_IMPORT_TEMPLATE,
  downloadCsvTemplate,
  parseImportFile,
} from '../utils/importHelpers';

const { t } = useI18n();
const userTemplate = USER_OWNER_IMPORT_TEMPLATE;

const headers = computed(() => [
  { text: t('users.name'), value: 'name' },
  { text: t('users.logon'), value: 'logonUser' },
  { text: t('users.job'), value: 'jobDescription' },
  { text: t('common.status'), value: 'status' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const loading = ref(false);
const search = ref('');
const isEditing = ref(false);
const currentId = ref(null);
const importFileInput = ref(null);
const form = ref({ name: '', logonUser: '', jobDescription: '' });

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return items.value;
  return items.value.filter((u) =>
    [u.name, u.logonUser, u.jobDescription, u.status].some((v) => String(v).toLowerCase().includes(term))
  );
});

const fetchItems = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/users');
    items.value = data;
  } catch (error) {
    items.value = [];
    Swal.fire(t('common.error'), t('users.loadError'), 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = { name: '', logonUser: '', jobDescription: '' };
  showModal('userOwnerModal');
};

const openEditModal = (item) => {
  isEditing.value = true;
  currentId.value = item._id;
  form.value = {
    name: item.name,
    logonUser: item.logonUser,
    jobDescription: item.jobDescription,
  };
  showModal('userOwnerModal');
};

const save = async () => {
  try {
    if (isEditing.value) {
      await api.post(`/users/${currentId.value}`, form.value);
      Swal.fire(t('common.updated'), t('users.updatedMsg'), 'success');
    } else {
      await api.post('/users', form.value);
      Swal.fire(t('common.created'), t('users.createdMsg'), 'success');
    }
    hideModal('userOwnerModal');
    await fetchItems();
  } catch (error) {
    const messages = error.response?.data?.errors?.map((e) => e.msg) || [error.response?.data?.message || t('common.error')];
    Swal.fire({ icon: 'error', title: t('common.error'), html: `<ul>${messages.map((m) => `<li>${m}</li>`).join('')}</ul>` });
  }
};

const toggleStatus = async (item) => {
  try {
    await api.put(`/users/${item._id}/status`);
    await fetchItems();
  } catch (error) {
    Swal.fire(t('common.error'), error.response?.data?.message || t('users.statusError'), 'error');
  }
};

const openImportHelpModal = () => {
  showModal('userOwnerImportModal');
};

const downloadUserTemplate = () => {
  downloadCsvTemplate(userTemplate.filename, userTemplate.headers, userTemplate.sampleRow);
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
    const { data } = await api.post('/users/import', { items: itemsToImport });
    hideModal('userOwnerImportModal');
    Swal.fire({
      icon: data.errorCount ? 'warning' : 'success',
      title: t('users.importDone'),
      html: `${t('users.createdCount')}: ${data.createdCount}<br>${t('users.errorCount')}: ${data.errorCount}`,
    });
    await fetchItems();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: t('users.importFailed'),
      text: error.response?.data?.message || error.message || t('users.importErrorGeneric'),
    });
  }
};

onMounted(fetchItems);
</script>
