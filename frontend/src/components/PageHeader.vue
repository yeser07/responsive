<template>
  <header class="page-header">
    <div class="page-header__text">
      <h2 class="page-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.35rem;
}

.page-header__title {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  letter-spacing: -0.02em;
}

.page-header__subtitle {
  margin: 0;
  max-width: 36rem;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
