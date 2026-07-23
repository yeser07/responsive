import { ref } from 'vue';
import {
  downloadCsvTemplate,
  parseImportFile,
} from '../utils/importHelpers';
import { hideModal, showModal } from '../utils/modal';

export function useImport({ template, endpoint, onDone, api, t, showError }) {
  const importFileInput = ref(null);

  function openImportHelpModal(modalId) {
    showModal(modalId);
  }

  function downloadTemplate() {
    downloadCsvTemplate(template.filename, template.headers, template.sampleRow);
  }

  function pickImportFile() {
    importFileInput.value?.click();
  }

  async function handleImportFile(event, modalId) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const itemsToImport = await parseImportFile(file);
      const { data } = await api.post(endpoint, { items: itemsToImport });
      hideModal(modalId);
      await onDone?.(data);
    } catch (error) {
      showError(t('common.error'), error, t('common.error'));
    }
  }

  return {
    importFileInput,
    openImportHelpModal,
    downloadTemplate,
    pickImportFile,
    handleImportFile,
  };
}
