import api from '../services/api';

/**
 * Fetches a letter PDF as a Blob via the authenticated download endpoint.
 * @param {string} letterId
 * @returns {Promise<Blob>}
 */
export async function fetchLetterBlob(letterId) {
  const response = await api.get(`/letters/${letterId}/download`, {
    responseType: 'blob',
  });
  return new Blob([response.data], { type: 'application/pdf' });
}

/**
 * Creates an object URL for a letter PDF blob.
 * Caller must revoke with URL.revokeObjectURL when done.
 * @param {string} letterId
 * @returns {Promise<string>}
 */
export async function createLetterObjectUrl(letterId) {
  const blob = await fetchLetterBlob(letterId);
  return window.URL.createObjectURL(blob);
}

/**
 * Triggers a file download for a letter PDF.
 * @param {string} letterId
 * @param {string} [fileName]
 */
export async function downloadLetterFile(letterId, fileName) {
  const url = await createLetterObjectUrl(letterId);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `letter_${letterId}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}
