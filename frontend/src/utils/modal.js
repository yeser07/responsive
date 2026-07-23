import * as bootstrap from 'bootstrap';

function cleanupOrphanBackdrops() {
  const openModals = document.querySelectorAll('.modal.show');
  if (openModals.length > 0) return;

  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
}

export function showModal(elementOrId) {
  const el =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;
  if (!el) return null;

  cleanupOrphanBackdrops();
  const modal = bootstrap.Modal.getOrCreateInstance(el, {
    backdrop: true,
    focus: true,
  });
  modal.show();
  return modal;
}

export function hideModal(elementOrId) {
  const el =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;
  if (!el) return;
  const modal = bootstrap.Modal.getInstance(el);
  modal?.hide();
  // Bootstrap removes backdrop asynchronously after transition
  el.addEventListener(
    'hidden.bs.modal',
    () => {
      cleanupOrphanBackdrops();
    },
    { once: true }
  );
}
