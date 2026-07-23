<template>
  <div class="cm-page">
    <PageHeader :title="t('reviewers.title')" :subtitle="t('reviewers.subtitle')">
      <template #actions>
        <button v-if="canWrite" class="btn btn-primary" type="button" @click="openCreateModal">
          {{ t('common.new') }} <i class="bi bi-plus"></i>
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
            :placeholder="t('reviewers.searchPlaceholder')"
            @keyup.enter="load"
          />
        </div>
        <button class="btn btn-outline-primary" type="button" @click="load">
          {{ t('common.search') }}
        </button>
      </div>

      <EasyDataTable
        v-model:server-options="serverOptions"
        :server-items-length="serverItemsLength"
        :headers="headers"
        :items="items"
        :loading="loading"
        buttons-pagination
        :no-data-text="t('reviewers.noData')"
        @update:server-options="load"
      >
        <template #item-active="item">
          <span :class="['cm-badge', item.active ? 'cm-badge--assigned' : 'cm-badge--returned']">
            {{ item.active ? t('status.active') : t('status.inactive') }}
          </span>
        </template>
        <template #item-actions="item">
          <button
            v-if="canWrite"
            class="btn btn-outline-primary btn-sm me-1"
            type="button"
            :title="t('common.edit')"
            @click="openEditModal(item)"
          >
            <i class="bi bi-pencil"></i>
          </button>
          <button
            v-if="canWrite"
            class="btn btn-outline-secondary btn-sm me-1"
            type="button"
            @click="toggleStatus(item)"
          >
            {{ item.active ? t('reviewers.deactivate') : t('reviewers.activate') }}
          </button>
          <button
            v-if="canDelete"
            class="btn btn-outline-danger btn-sm"
            type="button"
            :title="t('common.delete')"
            @click="confirmDelete(item)"
          >
            <i class="bi bi-trash"></i>
          </button>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="reviewerModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ editingId ? t('reviewers.editTitle') : t('reviewers.newTitle') }}
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('common.close')"
              ></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label" for="reviewer-name">{{ t('reviewers.name') }}</label>
                <input id="reviewer-name" v-model="form.name" class="form-control" autocomplete="off" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="reviewer-title">{{ t('reviewers.jobTitle') }}</label>
                <input id="reviewer-title" v-model="form.title" class="form-control" autocomplete="off" />
              </div>
              <div class="mb-2">
                <label class="form-label">{{ t('reviewers.signature') }}</label>
                <SignaturePad ref="signaturePad" :clear-label="t('reviewers.clearSignature')" />
                <div v-if="existingSignaturePreview" class="mt-2">
                  <div class="form-text">{{ t('reviewers.currentSignature') }}</div>
                  <img
                    :src="existingSignaturePreview"
                    alt=""
                    style="max-height: 64px; background: #fff; border: 1px solid #ddd"
                  />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                {{ t('common.close') }}
              </button>
              <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
                {{ t('common.save') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import { hasMinRole } from '../services/auth';
import PageHeader from '../components/PageHeader.vue';
import SignaturePad from '../components/SignaturePad.vue';
import { hideModal, showModal } from '../utils/modal';
import { normalizeSortParams } from '../utils/sortParams';
import { useApiError } from '../composables/useApiError';

const { t } = useI18n();
const { showError } = useApiError();
const canWrite = computed(() => hasMinRole('operator'));
const canDelete = computed(() => hasMinRole('admin'));

const headers = computed(() => [
  { text: t('reviewers.name'), value: 'name' },
  { text: t('reviewers.jobTitle'), value: 'title' },
  { text: t('common.status'), value: 'active' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref('');
const editingId = ref(null);
const existingSignaturePreview = ref(null);
const signaturePad = ref(null);
const serverItemsLength = ref(0);
const serverOptions = ref({ page: 1, rowsPerPage: 10, sortBy: ['name'], sortType: ['asc'] });
const form = ref({ name: '', title: 'Coordinador de TI' });

async function resetSignaturePad() {
  await nextTick();
  signaturePad.value?.reset?.();
}

function onReviewerModalShown() {
  resetSignaturePad();
}

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/reviewers', {
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
    showError(t('common.error'), error, t('reviewers.loadError'));
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingId.value = null;
  existingSignaturePreview.value = null;
  form.value = { name: '', title: 'Coordinador de TI' };
  showModal('reviewerModal');
};

const openEditModal = async (item) => {
  editingId.value = item._id;
  form.value = { name: item.name || '', title: item.title || '' };
  existingSignaturePreview.value = null;
  try {
    const { data } = await api.get(`/reviewers/${item._id}`);
    existingSignaturePreview.value = data.signatureDataUrl || null;
    form.value = { name: data.name || '', title: data.title || '' };
  } catch (error) {
    showError(t('common.error'), error, t('reviewers.loadError'));
    return;
  }
  showModal('reviewerModal');
};

const save = async () => {
  if (!form.value.name.trim()) {
    Swal.fire(t('common.warning'), t('reviewers.nameRequired'), 'warning');
    return;
  }
  const signatureDataUrl = signaturePad.value?.toDataUrl() || null;
  if (!editingId.value && !signatureDataUrl) {
    Swal.fire(t('common.warning'), t('reviewers.signatureRequired'), 'warning');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      title: form.value.title.trim() || 'Coordinador de TI',
    };
    if (signatureDataUrl) payload.signatureDataUrl = signatureDataUrl;

    if (editingId.value) {
      await api.put(`/reviewers/${editingId.value}`, payload);
      Swal.fire(t('common.success'), t('reviewers.updatedMsg'), 'success');
    } else {
      await api.post('/reviewers', payload);
      Swal.fire(t('common.success'), t('reviewers.createdMsg'), 'success');
    }
    hideModal('reviewerModal');
    await load();
  } catch (error) {
    showError(
      t('common.error'),
      error,
      editingId.value ? t('reviewers.updateError') : t('reviewers.createError')
    );
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async (item) => {
  try {
    await api.put(`/reviewers/${item._id}/status`);
    await load();
  } catch (error) {
    showError(t('common.error'), error, t('reviewers.statusError'));
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: t('reviewers.deleteTitle'),
    text: t('reviewers.deleteConfirm', { name: item.name }),
    showCancelButton: true,
    confirmButtonText: t('common.delete'),
    cancelButtonText: t('common.cancel'),
  });
  if (!result.isConfirmed) return;

  try {
    await api.delete(`/reviewers/${item._id}`);
    Swal.fire(t('common.success'), t('reviewers.deletedMsg'), 'success');
    await load();
  } catch (error) {
    showError(t('common.error'), error, t('reviewers.deleteError'));
  }
};

onMounted(() => {
  load();
  document
    .getElementById('reviewerModal')
    ?.addEventListener('shown.bs.modal', onReviewerModalShown);
});

onBeforeUnmount(() => {
  document
    .getElementById('reviewerModal')
    ?.removeEventListener('shown.bs.modal', onReviewerModalShown);
});
</script>
