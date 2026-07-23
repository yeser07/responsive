<template>
  <div class="cm-searchable" ref="rootRef">
    <label v-if="label" class="form-label" :for="inputId">{{ label }}</label>
    <div class="cm-searchable__control">
      <input
        :id="inputId"
        ref="inputRef"
        v-model="query"
        type="text"
        class="form-control"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        role="combobox"
        :aria-expanded="open"
        aria-autocomplete="list"
        :aria-controls="listId"
        @focus="onFocus"
        @keydown="onKeydown"
      />
      <button
        v-if="modelValue"
        type="button"
        class="cm-searchable__clear"
        :disabled="disabled"
        :aria-label="clearLabel"
        @click="clear"
      >
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>

    <ul
      v-show="open"
      :id="listId"
      class="cm-searchable__list"
      role="listbox"
    >
      <li v-if="loading" class="cm-searchable__empty">{{ loadingLabel }}</li>
      <li v-else-if="!options.length" class="cm-searchable__empty">{{ emptyLabel }}</li>
      <li
        v-for="(opt, index) in options"
        :key="opt.id"
        class="cm-searchable__option"
        :class="{ 'is-active': index === activeIndex, 'is-selected': opt.id === modelValue }"
        role="option"
        :aria-selected="opt.id === modelValue"
        @mousedown.prevent="select(opt)"
      >
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  emptyLabel: { type: String, default: 'No results' },
  loadingLabel: { type: String, default: 'Loading...' },
  clearLabel: { type: String, default: 'Clear' },
  disabled: { type: Boolean, default: false },
  fetchOptions: { type: Function, required: true },
  debounceMs: { type: Number, default: 300 },
});

const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const inputRef = ref(null);
const query = ref('');
const options = ref([]);
const open = ref(false);
const loading = ref(false);
const activeIndex = ref(-1);
const selectedLabel = ref('');
let debounceTimer = null;
let requestId = 0;

const uid = Math.random().toString(36).slice(2, 9);
const inputId = computed(() => `cm-searchable-${uid}`);
const listId = computed(() => `cm-searchable-list-${uid}`);

async function runFetch(term) {
  const current = ++requestId;
  loading.value = true;
  try {
    const result = await props.fetchOptions(term || '');
    if (current !== requestId) return;
    options.value = Array.isArray(result) ? result : [];
    activeIndex.value = options.value.length ? 0 : -1;
  } catch {
    if (current !== requestId) return;
    options.value = [];
    activeIndex.value = -1;
  } finally {
    if (current === requestId) loading.value = false;
  }
}

function scheduleFetch(term) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runFetch(term);
  }, props.debounceMs);
}

async function onFocus() {
  if (props.disabled) return;
  open.value = true;
  if (props.modelValue && selectedLabel.value) {
    query.value = selectedLabel.value;
  }
  await runFetch(query.value === selectedLabel.value ? '' : query.value);
}

function select(opt) {
  selectedLabel.value = opt.label;
  query.value = opt.label;
  emit('update:modelValue', opt.id);
  open.value = false;
  activeIndex.value = -1;
}

function clear() {
  selectedLabel.value = '';
  query.value = '';
  emit('update:modelValue', '');
  open.value = false;
  options.value = [];
  inputRef.value?.focus();
}

function onKeydown(event) {
  if (!open.value && (event.key === 'ArrowDown' || event.key === 'Enter')) {
    open.value = true;
    runFetch(query.value === selectedLabel.value ? '' : query.value);
    return;
  }

  if (event.key === 'Escape') {
    open.value = false;
    if (props.modelValue && selectedLabel.value) {
      query.value = selectedLabel.value;
    }
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!options.value.length) return;
    activeIndex.value = (activeIndex.value + 1) % options.value.length;
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (!options.value.length) return;
    activeIndex.value =
      activeIndex.value <= 0 ? options.value.length - 1 : activeIndex.value - 1;
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    const opt = options.value[activeIndex.value];
    if (opt) select(opt);
  }
}

function onDocumentClick(event) {
  if (!rootRef.value?.contains(event.target)) {
    open.value = false;
    if (props.modelValue && selectedLabel.value) {
      query.value = selectedLabel.value;
    } else if (!props.modelValue) {
      query.value = '';
    }
  }
}

watch(query, (value) => {
  if (!open.value) return;
  if (value === selectedLabel.value && props.modelValue) return;
  scheduleFetch(value);
});

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      selectedLabel.value = '';
      query.value = '';
    }
  }
);

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  clearTimeout(debounceTimer);
});

defineExpose({ clear, reset: clear });
</script>

<style scoped>
.cm-searchable {
  position: relative;
}

.cm-searchable__control {
  position: relative;
}

.cm-searchable__clear {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: var(--cm-radius-sm, 0.35rem);
  background: transparent;
  color: var(--cm-text-muted, #64748b);
  cursor: pointer;
}

.cm-searchable__clear:hover {
  color: var(--cm-slate-900, #0f172a);
  background: var(--cm-slate-50, #f8fafc);
}

.cm-searchable__control .form-control {
  padding-right: 2.25rem;
}

.cm-searchable__list {
  position: absolute;
  z-index: 30;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  max-height: 14rem;
  overflow: auto;
  border: 1px solid var(--cm-border, #cbd5e1);
  border-radius: var(--cm-radius, 0.5rem);
  background: var(--cm-white, #fff);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.cm-searchable__option,
.cm-searchable__empty {
  padding: 0.55rem 0.65rem;
  border-radius: var(--cm-radius-sm, 0.35rem);
  font-size: var(--cm-fs-sm, 0.9rem);
}

.cm-searchable__empty {
  color: var(--cm-text-muted, #64748b);
}

.cm-searchable__option {
  cursor: pointer;
}

.cm-searchable__option:hover,
.cm-searchable__option.is-active {
  background: var(--cm-teal-50, #f0fdfa);
  color: var(--cm-teal-800, #115e59);
}

.cm-searchable__option.is-selected {
  font-weight: 600;
}
</style>
