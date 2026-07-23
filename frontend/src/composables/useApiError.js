import Swal from 'sweetalert2';
import { extractApiMessages, messagesToSafeHtml } from '../utils/safeHtml';

export function useApiError() {
  function showError(title, error, fallback) {
    const messages = extractApiMessages(error, fallback);
    return Swal.fire({
      icon: 'error',
      title,
      html: messagesToSafeHtml(messages),
    });
  }

  function showInfoCounts(title, lines = []) {
    const text = lines.map((line) => String(line)).join('\n');
    return Swal.fire({
      icon: 'info',
      title,
      text,
    });
  }

  return { showError, showInfoCounts, extractApiMessages, messagesToSafeHtml };
}
