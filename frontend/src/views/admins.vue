<template>
  <div class="cm-page">
    <PageHeader :title="t('admins.title')" :subtitle="t('admins.subtitle')">
      <template #actions>
        <button class="btn btn-primary" type="button" @click="openCreateModal">
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
            :placeholder="t('admins.searchPlaceholder')"
          />
        </div>
      </div>

      <EasyDataTable
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        buttons-pagination
        show-index
        :no-data-text="t('admins.noData')"
      >
        <template #item-role="item">
          <select
            class="form-select form-select-sm"
            :value="item.role"
            @change="updateRole(item, $event.target.value)"
          >
            <option value="viewer">viewer</option>
            <option value="operator">operator</option>
            <option value="admin">admin</option>
          </select>
        </template>
        <template #item-actions="item">
          <button
            class="btn btn-outline-danger btn-sm"
            type="button"
            :title="t('common.delete')"
            :disabled="items.length <= 1"
            @click="confirmDelete(item)"
          >
            <i class="bi bi-trash"></i>
          </button>
        </template>
      </EasyDataTable>
    </div>

    <Teleport to="body">
      <div class="modal fade" id="adminModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ t('admins.newTitle') }}</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                :aria-label="t('common.close')"
              ></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label" for="admin-username">{{ t('admins.username') }}</label>
                <input id="admin-username" v-model="form.username" class="form-control" autocomplete="off" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="admin-password">{{ t('admins.password') }}</label>
                <input
                  id="admin-password"
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  autocomplete="new-password"
                />
              </div>
              <div class="mb-3">
                <label class="form-label" for="admin-role">{{ t('admins.role') }}</label>
                <select id="admin-role" v-model="form.role" class="form-select">
                  <option value="viewer">viewer</option>
                  <option value="operator">operator</option>
                  <option value="admin">admin</option>
                </select>
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { hideModal, showModal } from '../utils/modal';

const { t } = useI18n();

const headers = computed(() => [
  { text: t('admins.username'), value: 'username' },
  { text: t('admins.role'), value: 'role' },
  { text: t('common.actions'), value: 'actions' },
]);

const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref('');
const form = ref({ username: '', password: '', role: 'operator' });

const filteredItems = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return items.value;
  return items.value.filter((a) => String(a.username).toLowerCase().includes(term));
});

const fetchItems = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admins');
    items.value = data;
  } catch {
    items.value = [];
    Swal.fire(t('common.error'), t('admins.loadError'), 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  form.value = { username: '', password: '', role: 'operator' };
  showModal('adminModal');
};

const save = async () => {
  if (!form.value.username.trim() || !form.value.password) {
    Swal.fire(t('common.warning'), t('admins.requiredFields'), 'warning');
    return;
  }
  saving.value = true;
  try {
    await api.post('/admins', {
      username: form.value.username.trim(),
      password: form.value.password,
      role: form.value.role,
    });
    hideModal('adminModal');
    Swal.fire(t('common.success'), t('admins.createdMsg'), 'success');
    await fetchItems();
  } catch (error) {
    Swal.fire(
      t('common.error'),
      error.response?.data?.message || t('admins.createError'),
      'error'
    );
  } finally {
    saving.value = false;
  }
};

const updateRole = async (item, role) => {
  try {
    await api.put(`/admins/${item._id}/role`, { role });
    await fetchItems();
  } catch (error) {
    Swal.fire(t('common.error'), error.response?.data?.message || t('admins.roleError'), 'error');
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: t('admins.deleteTitle'),
    text: t('admins.deleteConfirm', { username: item.username }),
    showCancelButton: true,
    confirmButtonText: t('common.delete'),
    cancelButtonText: t('common.cancel'),
  });
  if (!result.isConfirmed) return;

  try {
    await api.delete(`/admins/${item._id}`);
    Swal.fire(t('common.success'), t('admins.deletedMsg'), 'success');
    await fetchItems();
  } catch (error) {
    Swal.fire(
      t('common.error'),
      error.response?.data?.message || t('admins.deleteError'),
      'error'
    );
  }
};

onMounted(fetchItems);
</script>
