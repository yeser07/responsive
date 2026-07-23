export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function messagesToSafeHtml(messages = []) {
  const items = (Array.isArray(messages) ? messages : [messages])
    .filter(Boolean)
    .map((msg) => `<li>${escapeHtml(msg)}</li>`)
    .join('');
  return `<ul>${items || `<li>${escapeHtml('Error')}</li>`}</ul>`;
}

export function extractApiMessages(error, fallback = 'Error') {
  const fromValidation = error?.response?.data?.errors?.map((e) => e.msg).filter(Boolean);
  if (fromValidation?.length) return fromValidation;
  const message = error?.response?.data?.message || error?.message || fallback;
  return [message];
}
