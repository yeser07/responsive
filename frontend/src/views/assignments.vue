<template>
  <div class="cm-page">
    <PageHeader :title="t('assignments.title')" :subtitle="t('assignments.subtitle')">
      <template #actions>
        <button v-if="canWrite" class="btn btn-outline-secondary" @click="exportCsv">
          {{ t('common.export') }}
        </button>
        <button v-if="canWrite" class="btn btn-primary" @click="openCreateModal">
          {{ t('assignments.new') }} <i class="bi bi-plus"></i>
        </button>
      </template>
    </PageHeader>

    <div class="cm-panel">
      <div class="cm-toolbar">
        <div class="cm-toolbar__search">
          <input
            v-model="search"
            type="text"
            class="form-control"
            :placeholder="t('assignments.searchPlaceholder')"
            @keyup.enter="load"
          />
        </div>
        <button class="btn btn-outline-primary" @click="load">{{ t('common.search') }}</button>
      </div>

      <EasyDataTable
        v-model:server-options="serverOptions"
        :server-items-length="serverItemsLength"
        :headers="headers"
        :items="items"
        :loading="loading"
        buttons-pagination
        :no-data-text="t('assignments.noData')"
        @update:server-options="load"
      >
        <template #item-user="item">
          {{ item.userOwnerId?.name || '—' }}
        </template>
        <template #item-ci="item">
          {{ item.configurationItemId?.brandName }} {{ item.configurationItemId?.modelName }}
          ({{ item.configurationItemId?.serialNumber }})
        </template>
        <template #item-reviewer="item">
          {{ item.reviewerId?.name || '—' }}
        </template>
        <template #item-assignmentDate="item">
          {{ formatDate(item.assignmentDate) }}
        </template>
        <template #item-status="item">
          <span :class="['cm-badge', item.status === 'assigned' ? 'cm-badge--assigned' : 'cm-badge--returned']">
            {{ statusLabel(item.status) }}
          </span>
        </template>
        <template #item-actions="item">
          <button
            v-if="canWrite && item.status === 'assigned'"
            class="btn btn-outline-secondary btn-sm me-1"
            @click="returnItem(item)"
          >
            {{ t('assignments.return') }}
          </button>
          <button
            v-if="canWrite && !item.hasLetter"
            class="btn btn-success btn-sm"
            @click="openLetterModal(item)"
          >
            {{ t('assignments.letterPdf') }}
          </button>
          <span v-else-if="item.hasLetter" class="cm-badge cm-badge--muted" :title="t('assignments.letterExistsTitle')">
            {{ t('assignments.letterExists') }}
          </span>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="assignmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ t('assignments.modalTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <SearchableSelect
                  v-model="form.userOwnerId"
                  :label="t('assignments.userOwner')"
                  :placeholder="t('assignments.userSearchPlaceholder')"
                  :empty-label="t('assignments.noSearchResults')"
                  :loading-label="t('common.loading')"
                  :clear-label="t('assignments.clearSelection')"
                  :fetch-options="fetchUserOptions"
                />
              </div>
              <div class="mb-3">
                <SearchableSelect
                  v-model="form.configurationItemId"
                  :label="t('assignments.ciStock')"
                  :placeholder="t('assignments.ciSearchPlaceholder')"
                  :empty-label="t('assignments.noSearchResults')"
                  :loading-label="t('common.loading')"
                  :clear-label="t('assignments.clearSelection')"
                  :fetch-options="fetchCiOptions"
                />
              </div>
              <div class="mb-3">
                <SearchableSelect
                  v-model="form.reviewerId"
                  :label="t('assignments.reviewer')"
                  :placeholder="t('assignments.reviewerSearchPlaceholder')"
                  :empty-label="t('assignments.noSearchResults')"
                  :loading-label="t('common.loading')"
                  :clear-label="t('assignments.clearSelection')"
                  :fetch-options="fetchReviewerOptions"
                />
              </div>
              <div class="mb-3">
                <label class="form-label" for="accessories">{{ t('assignments.accessories') }}</label>
                <input id="accessories" v-model="accessoriesText" class="form-control" :placeholder="t('assignments.accessoriesPlaceholder')" />
              </div>
              <div class="form-check mb-3">
                <input id="generateLetter" v-model="form.generateLetter" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="generateLetter">{{ t('assignments.generateLetter') }}</label>
              </div>
              <div v-if="form.generateLetter" class="mb-2">
                <label class="form-label">{{ t('assignments.signature') }}</label>
                <SignaturePad ref="signaturePad" :clear-label="t('assignments.clearSignature')" />
              </div>
              <div class="mb-2">
                <label class="form-label" for="photo">{{ t('assignments.photo') }}</label>
                <input id="photo" type="file" accept="image/*" class="form-control" @change="onPhoto" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
              <button type="button" class="btn btn-primary" @click="save">{{ t('common.save') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div class="modal fade" id="letterModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ t('assignments.letterModalTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <SearchableSelect
                  v-model="letterForm.reviewerId"
                  :label="t('assignments.reviewer')"
                  :placeholder="t('assignments.reviewerSearchPlaceholder')"
                  :empty-label="t('assignments.noSearchResults')"
                  :loading-label="t('common.loading')"
                  :clear-label="t('assignments.clearSelection')"
                  :fetch-options="fetchReviewerOptions"
                />
              </div>
              <div class="mb-2">
                <label class="form-label">{{ t('assignments.signature') }}</label>
                <SignaturePad ref="letterSignaturePad" :clear-label="t('assignments.clearSignature')" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ t('common.close') }}</button>
              <button type="button" class="btn btn-primary" :disabled="letterSaving" @click="submitLetter">
                {{ t('assignments.generateLetter') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import { hasMinRole } from '../services/auth';
import PageHeader from '../components/PageHeader.vue';
import SignaturePad from '../components/SignaturePad.vue';
import SearchableSelect from '../components/SearchableSelect.vue';
import { hideModal, showModal } from '../utils/modal';
import { normalizeSortParams } from '../utils/sortParams';
import { useApiError } from '../composables/useApiError';

const { t } = useI18n();
const { showError } = useApiError();
const canWrite = computed(() => hasMinRole('operator'));

const headers = computed(() => [
  { text: t('assignments.user'), value: 'user' },
  { text: t('assignments.ci'), value: 'ci' },
  { text: t('assignments.reviewer'), value: 'reviewer' },
  { text: t('assignments.date'), value: 'assignmentDate' },
  { text: t('common.status'), value: 'status' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const loading = ref(false);
const search = ref('');
const accessoriesText = ref('');
const signaturePad = ref(null);
const letterSignaturePad = ref(null);
const photoDataUrl = ref(null);
const letterSaving = ref(false);
const letterTargetId = ref(null);
const serverItemsLength = ref(0);
const serverOptions = ref({ page: 1, rowsPerPage: 10, sortBy: ['assignmentDate'], sortType: ['desc'] });
const form = ref({
  userOwnerId: '',
  configurationItemId: '',
  reviewerId: '',
  generateLetter: true,
});
const letterForm = ref({ reviewerId: '' });

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const statusLabel = (status) => t(`status.${status}`, status);

async function fetchUserOptions(query) {
  const { data } = await api.get('/users', {
    params: {
      page: 1,
      rowsPerPage: 20,
      status: 'active',
      search: query || '',
      ...normalizeSortParams(['name'], ['asc']),
    },
  });
  return (data.items || []).map((u) => ({
    id: String(u._id),
    label: `${u.name} (${u.logonUser})`,
  }));
}

async function fetchCiOptions(query) {
  const { data } = await api.get('/cis', {
    params: {
      page: 1,
      rowsPerPage: 20,
      status: 'stock',
      search: query || '',
      ...normalizeSortParams(['serialNumber'], ['asc']),
    },
  });
  return (data.items || []).map((ci) => ({
    id: String(ci._id),
    label: `${ci.brandName} ${ci.modelName} — ${ci.serialNumber}`,
  }));
}

async function fetchReviewerOptions(query) {
  const { data } = await api.get('/reviewers', {
    params: {
      page: 1,
      rowsPerPage: 20,
      status: 'active',
      search: query || '',
      ...normalizeSortParams(['name'], ['asc']),
    },
  });
  return (data.items || []).map((r) => ({
    id: String(r._id),
    label: `${r.name} — ${r.title}`,
  }));
}

async function resetSignaturePad() {
  await nextTick();
  signaturePad.value?.reset?.();
}

async function resetLetterSignaturePad() {
  await nextTick();
  letterSignaturePad.value?.reset?.();
}

function onAssignmentModalShown() {
  resetSignaturePad();
}

function onLetterModalShown() {
  resetLetterSignaturePad();
}

onMounted(() => {
  load();
  document
    .getElementById('assignmentModal')
    ?.addEventListener('shown.bs.modal', onAssignmentModalShown);
  document
    .getElementById('letterModal')
    ?.addEventListener('shown.bs.modal', onLetterModalShown);
});

onBeforeUnmount(() => {
  document
    .getElementById('assignmentModal')
    ?.removeEventListener('shown.bs.modal', onAssignmentModalShown);
  document
    .getElementById('letterModal')
    ?.removeEventListener('shown.bs.modal', onLetterModalShown);
});

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/assignments', {
      params: {
        page: serverOptions.value.page,
        rowsPerPage: serverOptions.value.rowsPerPage,
        ...normalizeSortParams(serverOptions.value.sortBy, serverOptions.value.sortType),
        search: search.value,
      },
    });
    items.value = data.items || [];
    serverItemsLength.value = data.total || 0;
  } catch (error) {
    showError(t('common.error'), error, t('assignments.loadError'));
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  form.value = { userOwnerId: '', configurationItemId: '', reviewerId: '', generateLetter: true };
  accessoriesText.value = '';
  photoDataUrl.value = null;
  showModal('assignmentModal');
};

watch(
  () => form.value.generateLetter,
  async (enabled) => {
    if (!enabled) return;
    await resetSignaturePad();
  }
);

const onPhoto = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photoDataUrl.value = String(reader.result);
  };
  reader.readAsDataURL(file);
};

const save = async () => {
  if (form.value.generateLetter && !form.value.reviewerId) {
    Swal.fire(t('common.warning'), t('assignments.reviewerRequired'), 'warning');
    return;
  }

  const accessories = accessoriesText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const signatureDataUrl = form.value.generateLetter ? signaturePad.value?.toDataUrl() : null;
    const { data } = await api.post('/assignments', {
      ...form.value,
      accessories,
      signatureDataUrl,
    });

    if (photoDataUrl.value && data?.assignment?._id) {
      await api.post('/attachments', {
        entityType: 'assignment',
        entityId: data.assignment._id,
        fileName: 'assignment-photo.jpg',
        dataUrl: photoDataUrl.value,
        mimeType: 'image/jpeg',
        note: 'Condition at assignment',
      });
    }

    hideModal('assignmentModal');
    if (data?.letterError) {
      Swal.fire(t('common.warning'), t('assignments.createdLetterFailed'), 'warning');
    } else {
      Swal.fire(t('common.created'), t('assignments.createdMsg'), 'success');
    }
    await load();
  } catch (error) {
    showError(t('common.error'), error, t('assignments.createError'));
  }
};

const returnItem = async (item) => {
  const result = await Swal.fire({
    title: t('assignments.returnConfirmTitle'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: t('assignments.returnConfirmBtn'),
    cancelButtonText: t('common.cancel'),
  });
  if (!result.isConfirmed) return;

  try {
    await api.put(`/assignments/${item._id}/return`);
    Swal.fire(t('common.success'), t('assignments.returnedMsg'), 'success');
    await load();
  } catch (error) {
    showError(t('common.error'), error, t('assignments.returnError'));
  }
};

const openLetterModal = (item) => {
  if (item.hasLetter) {
    Swal.fire(t('common.warning'), t('assignments.letterExistsInfo'), 'info');
    return;
  }
  letterTargetId.value = item._id;
  letterForm.value = {
    reviewerId: item.reviewerId?._id ? String(item.reviewerId._id) : '',
  };
  showModal('letterModal');
};

const submitLetter = async () => {
  if (!letterForm.value.reviewerId) {
    Swal.fire(t('common.warning'), t('assignments.reviewerRequired'), 'warning');
    return;
  }

  letterSaving.value = true;
  try {
    await api.post(`/assignments/${letterTargetId.value}/letter`, {
      reviewerId: letterForm.value.reviewerId,
      signatureDataUrl: letterSignaturePad.value?.toDataUrl() || null,
    });
    hideModal('letterModal');
    Swal.fire(t('assignments.letterReady'), t('assignments.letterReadyText'), 'success');
    await load();
  } catch (error) {
    const status = error.response?.status;
    if (status === 409) {
      Swal.fire(t('common.warning'), error.response?.data?.message || t('assignments.letterExistsInfo'), 'info');
      hideModal('letterModal');
      await load();
      return;
    }
    showError(t('common.error'), error, t('assignments.letterError'));
  } finally {
    letterSaving.value = false;
  }
};

const exportCsv = async () => {
  const { data } = await api.get('/export/assignments', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'assignments.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};
</script>
