<template>
  <div class="cm-page">
    <PageHeader :title="t('settings.title')" :subtitle="t('settings.subtitle')" />
    <div class="cm-panel" style="max-width: 56rem">
      <div class="mb-3">
        <label class="form-label" for="companyName">{{ t('settings.companyName') }}</label>
        <input id="companyName" v-model="form.companyName" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="title">{{ t('settings.letterTitle') }}</label>
        <input id="title" v-model="form.title" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">{{ t('settings.legalText') }}</label>
        <QuillEditor
          v-model:content="form.legalText"
          content-type="html"
          theme="snow"
          toolbar="minimal"
          class="cm-quill"
        />
        <div class="form-text">{{ t('settings.legalTextHint') }}</div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="logo">{{ t('settings.logo') }}</label>
        <input id="logo" type="file" accept="image/*" class="form-control" @change="onLogo" />
        <img v-if="form.logoDataUrl" :src="form.logoDataUrl" alt="" class="mt-2" style="max-height: 64px" />
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? t('common.loading') : t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Swal from 'sweetalert2';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import api from '../services/api';
import PageHeader from '../components/PageHeader.vue';
import { useApiError } from '../composables/useApiError';

const { t } = useI18n();
const { showError } = useApiError();
const saving = ref(false);
const form = ref({
  companyName: '',
  title: '',
  legalText: '',
  logoDataUrl: null,
});

function ensureHtml(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return `<p>${text}</p>`;
}

const load = async () => {
  try {
    const { data } = await api.get('/settings/letter-template');
    form.value = {
      companyName: data.companyName || '',
      title: data.title || '',
      legalText: ensureHtml(data.legalText || ''),
      logoDataUrl: data.logoDataUrl || null,
    };
  } catch (error) {
    showError(t('common.error'), error, t('settings.loadError'));
  }
};

const onLogo = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) {
    Swal.fire(t('common.warning'), t('settings.logoTooLarge'), 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.value.logoDataUrl = String(reader.result);
  };
  reader.readAsDataURL(file);
};

const save = async () => {
  saving.value = true;
  try {
    await api.put('/settings/letter-template', form.value);
    Swal.fire(t('common.success'), t('settings.saved'), 'success');
  } catch (error) {
    showError(t('common.error'), error, t('settings.saveError'));
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.cm-quill {
  background: #fff;
  min-height: 10rem;
}

.cm-quill :deep(.ql-container) {
  min-height: 8rem;
  font-size: 0.95rem;
}

.cm-quill :deep(.ql-toolbar) {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
}

.cm-quill :deep(.ql-container) {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}
</style>
