import { computed, ref } from 'vue';
import { normalizeSortParams } from '../utils/sortParams';

export function useServerTable(fetchPage) {
  const items = ref([]);
  const loading = ref(false);
  const search = ref('');
  const serverOptions = ref({
    page: 1,
    rowsPerPage: 10,
    sortBy: [],
    sortType: [],
  });
  const serverItemsLength = ref(0);

  async function load() {
    loading.value = true;
    try {
      const result = await fetchPage({
        page: serverOptions.value.page,
        rowsPerPage: serverOptions.value.rowsPerPage,
        sortBy: serverOptions.value.sortBy,
        sortType: serverOptions.value.sortType,
        search: search.value,
      });
      items.value = result.items || [];
      serverItemsLength.value = result.total || 0;
    } finally {
      loading.value = false;
    }
  }

  const queryParams = computed(() => ({
    page: serverOptions.value.page,
    rowsPerPage: serverOptions.value.rowsPerPage,
    ...normalizeSortParams(serverOptions.value.sortBy, serverOptions.value.sortType),
    search: search.value,
  }));

  return {
    items,
    loading,
    search,
    serverOptions,
    serverItemsLength,
    queryParams,
    load,
  };
}
