<template>
  <div class="cm-page">
    <PageHeader :title="t('notFound.title')" :subtitle="t('notFound.subtitle')" />
    <router-link class="btn btn-primary" to="/">{{ t('notFound.home') }}</router-link>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import PageHeader from '../components/PageHeader.vue';

const { t } = useI18n();
</script>
