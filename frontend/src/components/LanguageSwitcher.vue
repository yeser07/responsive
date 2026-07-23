<template>
  <div class="lang-switch" role="group" :aria-label="t('common.language')">
    <button
      type="button"
      class="lang-switch__btn"
      :class="{ 'lang-switch__btn--active': locale === 'es' }"
      @click="changeLocale('es')"
    >
      ES
    </button>
    <button
      type="button"
      class="lang-switch__btn"
      :class="{ 'lang-switch__btn--active': locale === 'en' }"
      @click="changeLocale('en')"
    >
      EN
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { setLocale } from '../i18n';

const { t, locale } = useI18n();

const changeLocale = (code) => {
  setLocale(code);
};
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-sm);
  overflow: hidden;
  background: var(--cm-white);
}

.lang-switch__btn {
  border: 0;
  background: transparent;
  padding: 0.35rem 0.65rem;
  font-family: var(--cm-font-display);
  font-size: var(--cm-fs-xs);
  font-weight: 600;
  color: var(--cm-slate-600);
  cursor: pointer;
}

.lang-switch__btn--active {
  background: var(--cm-teal-700);
  color: #fff;
}

.lang-switch__btn:not(.lang-switch__btn--active):hover {
  background: var(--cm-slate-50);
  color: var(--cm-slate-900);
}
</style>
