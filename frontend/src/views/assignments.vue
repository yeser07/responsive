<template>
  <div class="cm-page">
    <PageHeader :title="t('assignments.title')" :subtitle="t('assignments.subtitle')">
      <template #actions>
        <button class="btn btn-primary" @click="openCreateModal">
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
          />
        </div>
      </div>

      <EasyDataTable
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        buttons-pagination
        show-index
        :no-data-text="t('assignments.noData')"
      >
        <template #item-user="item">
          {{ item.userOwnerId?.name || '—' }}
        </template>
        <template #item-ci="item">
          {{ item.configurationItemId?.brandName }} {{ item.configurationItemId?.modelName }}
          ({{ item.configurationItemId?.serialNumber }})
        </template>
        <template #item-assignmentDate="item">
          {{ formatDate(item.assignmentDate) }}
        </template>
        <template #item-status="item">
          <span :class="['cm-badge', item.status === 'assigned' ? 'cm-badge--assigned' : 'cm-badge--returned']">
            {{ item.status }}
          </span>
        </template>
        <template #item-actions="item">
          <button v-if="item.status === 'assigned'" class="btn btn-outline-secondary btn-sm me-1" @click="returnItem(item)">
            {{ t('assignments.return') }}
          </button>
          <button
            v-if="!item.hasLetter"
            class="btn btn-success btn-sm"
            @click="generateLetter(item)"
          >
            {{ t('assignments.letterPdf') }}
          </button>
          <span v-else class="cm-badge cm-badge--muted" :title="t('assignments.letterExistsTitle')">
            {{ t('assignments.letterExists') }}
          </span>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="assignmentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ t('assignments.modalTitle') }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">{{ t('assignments.userOwner') }}</label>
                <select v-model="form.userOwnerId" class="form-select">
                  <option value="">{{ t('common.select') }}</option>
                  <option v-for="u in activeUsers" :key="u._id" :value="u._id">{{ u.name }} ({{ u.logonUser }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('assignments.ciStock') }}</label>
                <select v-model="form.configurationItemId" class="form-select">
                  <option value="">{{ t('common.select') }}</option>
                  <option v-for="ci in stockItems" :key="ci._id" :value="ci._id">
                    {{ ci.brandName }} {{ ci.modelName }} — {{ ci.serialNumber }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('assignments.accessories') }}</label>
                <input v-model="accessoriesText" class="form-control" :placeholder="t('assignments.accessoriesPlaceholder')" />
              </div>
              <div class="form-check mb-3">
                <input id="generateLetter" v-model="form.generateLetter" class="form-check-input" type="checkbox" />
                <label class="form-check-label" for="generateLetter">{{ t('assignments.generateLetter') }}</label>
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { hideModal, showModal } from '../utils/modal';

const { t } = useI18n();

const headers = computed(() => [
  { text: t('assignments.user'), value: 'user' },
  { text: t('assignments.ci'), value: 'ci' },
  { text: t('assignments.date'), value: 'assignmentDate' },
  { text: t('common.status'), value: 'status' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const users = ref([]);
const cis = ref([]);
const loading = ref(false);
const search = ref('');
const accessoriesText = ref('');
const form = ref({
  userOwnerId: '',
  configurationItemId: '',
  generateLetter: true,
});

const activeUsers = computed(() => users.value.filter((u) => u.status === 'active'));
const stockItems = computed(() => cis.value.filter((c) => c.status === 'stock'));

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return items.value;
  return items.value.filter((item) => {
    const values = [
      item.userOwnerId?.name,
      item.userOwnerId?.logonUser,
      item.configurationItemId?.brandName,
      item.configurationItemId?.modelName,
      item.configurationItemId?.serialNumber,
      item.status,
    ];
    return values.some((v) => String(v || '').toLowerCase().includes(term));
  });
});

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const fetchAll = async () => {
  loading.value = true;
  try {
    const [assignmentsRes, usersRes, cisRes] = await Promise.all([
      api.get('/assignments'),
      api.get('/users'),
      api.get('/cis', { params: { page: 1, rowsPerPage: 500, sortBy: JSON.stringify(['serialNumber']), sortType: JSON.stringify(['asc']) } }),
    ]);
    items.value = assignmentsRes.data;
    users.value = usersRes.data;
    cis.value = cisRes.data.items || [];
  } catch (error) {
    Swal.fire(t('common.error'), t('assignments.loadError'), 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  form.value = { userOwnerId: '', configurationItemId: '', generateLetter: true };
  accessoriesText.value = '';
  showModal('assignmentModal');
};

const save = async () => {
  const accessories = accessoriesText.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    await api.post('/assignments', {
      ...form.value,
      accessories,
    });
    hideModal('assignmentModal');
    Swal.fire(t('common.created'), t('assignments.createdMsg'), 'success');
    await fetchAll();
  } catch (error) {
    const messages = error.response?.data?.errors?.map((e) => e.msg)
      || [error.response?.data?.message || t('assignments.createError')];
    Swal.fire({ icon: 'error', title: t('common.error'), html: `<ul>${messages.map((m) => `<li>${m}</li>`).join('')}</ul>` });
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
    await fetchAll();
  } catch (error) {
    Swal.fire(t('common.error'), error.response?.data?.message || t('assignments.returnError'), 'error');
  }
};

const generateLetter = async (item) => {
  if (item.hasLetter) {
    Swal.fire(t('common.warning'), t('assignments.letterExistsInfo'), 'info');
    return;
  }

  try {
    await api.post(`/assignments/${item._id}/letter`);
    Swal.fire(t('assignments.letterReady'), t('assignments.letterReadyText'), 'success');
    await fetchAll();
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || t('assignments.letterError');
    if (status === 409) {
      Swal.fire(t('common.warning'), message, 'info');
      await fetchAll();
      return;
    }
    Swal.fire(t('common.error'), message, 'error');
  }
};

onMounted(fetchAll);
</script>
