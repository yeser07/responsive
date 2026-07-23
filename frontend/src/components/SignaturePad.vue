<template>
  <div ref="frameRef" class="signature-pad">
    <div class="signature-pad__frame">
      <Vue3Signature
        v-if="padWidth > 0"
        ref="padRef"
        :sig-option="sigOption"
        :w="`${padWidth}px`"
        :h="`${padHeight}px`"
        :clear-on-resize="false"
      />
    </div>
    <div class="signature-pad__actions">
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="clear">
        {{ clearLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import Vue3Signature from 'vue3-signature';

defineProps({
  clearLabel: { type: String, default: 'Clear' },
});

const padRef = ref(null);
const frameRef = ref(null);
const padWidth = ref(0);
const padHeight = 160;

const sigOption = reactive({
  penColor: 'rgb(15, 23, 42)',
  backgroundColor: 'rgb(255, 255, 255)',
});

function measureWidth() {
  const el = frameRef.value?.querySelector('.signature-pad__frame') || frameRef.value;
  const width = Math.floor(el?.clientWidth || 0);
  return width > 0 ? width : 0;
}

function syncSize() {
  const width = measureWidth();
  if (width > 0) {
    padWidth.value = width;
  }
}

function clear() {
  padRef.value?.clear();
}

function toDataUrl() {
  if (!padRef.value || padRef.value.isEmpty()) return null;
  return padRef.value.save() || padRef.value.toDataURL('image/png') || null;
}

function isEmpty() {
  return Boolean(padRef.value?.isEmpty?.() ?? true);
}

async function reset() {
  await nextTick();
  // Modal layout may still be animating; measure after paint
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  syncSize();
  await nextTick();
  // Changing w triggers vue3-signature resize; also nudge via window resize
  window.dispatchEvent(new Event('resize'));
  clear();
}

let resizeObserver = null;

onMounted(() => {
  syncSize();
  if (typeof ResizeObserver !== 'undefined' && frameRef.value) {
    resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(frameRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

defineExpose({ clear, toDataUrl, isEmpty, reset });
</script>

<style scoped>
.signature-pad__frame {
  width: 100%;
  height: 160px;
  border: 1px solid var(--cm-border, #cbd5e1);
  border-radius: 0.5rem;
  overflow: hidden;
  background: #fff;
}

/* Do not force canvas CSS width — that stretches a wrong bitmap and hides strokes on desktop */
.signature-pad__frame :deep(canvas) {
  display: block;
  touch-action: none;
  cursor: crosshair;
  max-width: 100%;
}

.signature-pad__actions {
  margin-top: 0.5rem;
}
</style>
