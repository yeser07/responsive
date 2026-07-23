<template>
  <div class="cm-page">
    <PageHeader :title="t('password.title')" :subtitle="t('password.subtitle')" />
    <div class="cm-panel" style="max-width: 28rem">
      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label" for="currentPassword">{{ t('password.current') }}</label>
          <input id="currentPassword" v-model="currentPassword" type="password" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label" for="newPassword">{{ t('password.new') }}</label>
          <input id="newPassword" v-model="newPassword" type="password" class="form-control" minlength="8" required />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? t('common.loading') : t('password.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import PageHeader from '../components/PageHeader.vue';
import { changePasswordRequest } from '../services/api';
import { useApiError } from '../composables/useApiError';

const { t } = useI18n();
const router = useRouter();
const { showError } = useApiError();
const currentPassword = ref('');
const newPassword = ref('');
const loading = ref(false);

const submit = async () => {
  loading.value = true;
  try {
    await changePasswordRequest(currentPassword.value, newPassword.value);
    await Swal.fire(t('common.success'), t('password.success'), 'success');
    router.replace('/');
  } catch (error) {
    showError(t('common.error'), error, t('password.error'));
  } finally {
    loading.value = false;
  }
};
</script>
