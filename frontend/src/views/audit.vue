<template>
  <div class="cm-page">
    <PageHeader :title="t('audit.title')" :subtitle="t('audit.subtitle')" />
    <div class="cm-panel">
      <div class="cm-toolbar">
        <div class="cm-toolbar__search">
          <input v-model="entityType" type="text" class="form-control" :placeholder="t('audit.filterEntity')" @keyup.enter="load" />
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
        @update:server-options="load"
      >
        <template #item-createdAt="item">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item-meta="item">
          <code class="small">{{ JSON.stringify(item.meta || {}) }}</code>
        </template>
      </EasyDataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { useApiError } from '../composables/useApiError';

const { t } = useI18n();
const { showError } = useApiError();

const headers = computed(() => [
  { text: t('audit.when'), value: 'createdAt' },
  { text: t('audit.actor'), value: 'actorUsername' },
  { text: t('audit.action'), value: 'action' },
  { text: t('audit.entity'), value: 'entityType' },
  { text: t('audit.entityId'), value: 'entityId' },
  { text: t('audit.meta'), value: 'meta' },
]);

const items = ref([]);
const loading = ref(false);
const entityType = ref('');
const serverItemsLength = ref(0);
const serverOptions = ref({ page: 1, rowsPerPage: 15, sortBy: [], sortType: [] });

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/audit', {
      params: {
        page: serverOptions.value.page,
        rowsPerPage: serverOptions.value.rowsPerPage,
        entityType: entityType.value || undefined,
      },
    });
    items.value = data.items || [];
    serverItemsLength.value = data.total || 0;
  } catch (error) {
    showError(t('common.error'), error, t('audit.loadError'));
  } finally {
    loading.value = false;
  }
};

watch(entityType, () => {
  serverOptions.value.page = 1;
});

onMounted(load);
</script>
