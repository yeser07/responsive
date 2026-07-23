<template>
  <div class="cm-page">
    <PageHeader :title="t('letters.title')" :subtitle="t('letters.subtitle')" />

    <div class="cm-panel">
      <div class="cm-toolbar">
        <div class="cm-toolbar__search">
          <input
            v-model="search"
            type="text"
            class="form-control"
            :placeholder="t('letters.searchPlaceholder')"
            @keyup.enter="fetchItems"
          />
        </div>
        <button class="btn btn-outline-primary" @click="fetchItems">{{ t('common.search') }}</button>
      </div>
      <EasyDataTable
        v-model:server-options="serverOptions"
        :server-items-length="serverItemsLength"
        :headers="headers"
        :items="items"
        :loading="loading"
        buttons-pagination
        :no-data-text="t('letters.noData')"
        @update:server-options="fetchItems"
      >
        <template #item-user="item">
          {{ item.assignmentId?.userOwnerId?.name || '—' }}
        </template>
        <template #item-ci="item">
          {{ item.assignmentId?.configurationItemId?.brandName }}
          {{ item.assignmentId?.configurationItemId?.modelName }}
          ({{ item.assignmentId?.configurationItemId?.serialNumber }})
        </template>
        <template #item-creationDate="item">
          {{ formatDate(item.creationDate) }}
        </template>
        <template #item-actions="item">
          <button
            class="btn btn-outline-primary btn-sm me-1"
            :disabled="previewLoading"
            :title="t('letters.preview')"
            @click="openPreview(item)"
          >
            <i class="bi bi-eye"></i> {{ t('letters.preview') }}
          </button>
          <button class="btn btn-primary btn-sm" :title="t('letters.download')" @click="download(item)">
            <i class="bi bi-download"></i> {{ t('letters.download') }}
          </button>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div
        class="modal fade"
        id="letterPreviewModal"
        tabindex="-1"
        aria-labelledby="letterPreviewModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="letterPreviewModalLabel">
                {{ previewTitle }}
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('common.close')"
              ></button>
            </div>
            <div class="modal-body letter-preview__body">
              <div v-if="previewLoading" class="letter-preview__loading">
                {{ t('letters.previewLoading') }}
              </div>
              <iframe
                v-else-if="previewUrl"
                class="letter-preview__frame"
                :src="previewUrl"
                :title="previewTitle"
              />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!previewItem || previewLoading"
                @click="download(previewItem)"
              >
                <i class="bi bi-download"></i> {{ t('letters.download') }}
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                {{ t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { hideModal, showModal } from '../utils/modal';
import { createLetterObjectUrl, downloadLetterFile } from '../utils/letterBlob';

const { t } = useI18n();

const headers = computed(() => [
  { text: t('letters.user'), value: 'user' },
  { text: t('letters.ci'), value: 'ci' },
  { text: t('letters.created'), value: 'creationDate' },
  { text: t('letters.file'), value: 'fileName' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const loading = ref(false);
const search = ref('');
const serverItemsLength = ref(0);
const serverOptions = ref({ page: 1, rowsPerPage: 10, sortBy: [], sortType: [] });

const previewUrl = ref('');
const previewLoading = ref(false);
const previewItem = ref(null);

const previewTitle = computed(() => {
  const name = previewItem.value?.fileName;
  return name ? `${t('letters.previewTitle')}: ${name}` : t('letters.previewTitle');
});

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const revokePreviewUrl = () => {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
  }
};

const clearPreview = () => {
  revokePreviewUrl();
  previewItem.value = null;
  previewLoading.value = false;
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/letters', {
      params: {
        page: serverOptions.value.page,
        rowsPerPage: serverOptions.value.rowsPerPage,
        search: search.value,
      },
    });
    items.value = data.items || [];
    serverItemsLength.value = data.total || 0;
  } catch {
    items.value = [];
    Swal.fire(t('common.error'), t('letters.loadError'), 'error');
  } finally {
    loading.value = false;
  }
};

const download = async (item) => {
  if (!item?._id) return;
  try {
    await downloadLetterFile(item._id, item.fileName || `letter_${item._id}.pdf`);
  } catch {
    Swal.fire(t('common.error'), t('letters.downloadError'), 'error');
  }
};

const openPreview = async (item) => {
  if (!item?._id || previewLoading.value) return;

  previewItem.value = item;
  previewLoading.value = true;
  revokePreviewUrl();
  showModal('letterPreviewModal');

  try {
    previewUrl.value = await createLetterObjectUrl(item._id);
  } catch {
    hideModal('letterPreviewModal');
    clearPreview();
    Swal.fire(t('common.error'), t('letters.previewError'), 'error');
  } finally {
    previewLoading.value = false;
  }
};

const onPreviewHidden = () => {
  clearPreview();
};

onMounted(() => {
  fetchItems();
  const modalEl = document.getElementById('letterPreviewModal');
  modalEl?.addEventListener('hidden.bs.modal', onPreviewHidden);
});

onBeforeUnmount(() => {
  const modalEl = document.getElementById('letterPreviewModal');
  modalEl?.removeEventListener('hidden.bs.modal', onPreviewHidden);
  clearPreview();
});
</script>

<style scoped>
.letter-preview__body {
  min-height: 70vh;
  padding: 0;
  background: var(--cm-slate-100, #f1f5f9);
}

.letter-preview__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  color: var(--cm-slate-600, #475569);
}

.letter-preview__frame {
  display: block;
  width: 100%;
  height: 70vh;
  border: 0;
  background: #fff;
}
</style>
