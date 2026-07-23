<template>
  <div class="home cm-page">
    <header class="home__hero">
      <p class="home__eyebrow">{{ t('home.welcome') }}</p>
      <h2 class="home__brand">{{ t('common.appName') }}</h2>
      <p class="home__lead">{{ t('home.lead') }}</p>
    </header>

    <section v-if="stats" class="home__stats" :aria-label="t('home.dashboard')">
      <div class="home__stat">
        <span class="home__stat-value">{{ stats.cis?.total || 0 }}</span>
        <span class="home__stat-label">{{ t('home.statCis') }}</span>
      </div>
      <div class="home__stat">
        <span class="home__stat-value">{{ stats.cis?.stock || 0 }}</span>
        <span class="home__stat-label">{{ t('home.statStock') }}</span>
      </div>
      <div class="home__stat">
        <span class="home__stat-value">{{ stats.assignmentsOpen || 0 }}</span>
        <span class="home__stat-label">{{ t('home.statOpen') }}</span>
      </div>
      <div class="home__stat">
        <span class="home__stat-value">{{ stats.lettersTotal || 0 }}</span>
        <span class="home__stat-label">{{ t('home.statLetters') }}</span>
      </div>
    </section>

    <section v-if="notifications" class="home__alerts">
      <p class="home__alerts-title">{{ t('home.alerts') }}</p>
      <p class="home__alerts-text">
        {{ t('home.alertsDetail', {
          stale: notifications.counts?.staleAssignments || 0,
          problems: notifications.counts?.problemCis || 0,
        }) }}
      </p>
    </section>

    <div class="home__search mb-4">
      <label class="form-label" for="globalSearch">{{ t('home.globalSearch') }}</label>
      <div class="d-flex gap-2">
        <input
          id="globalSearch"
          v-model="searchQ"
          class="form-control"
          :placeholder="t('home.searchPlaceholder')"
          @keyup.enter="runSearch"
        />
        <button class="btn btn-outline-primary" type="button" @click="runSearch">{{ t('common.search') }}</button>
      </div>
      <div v-if="searchResults" class="home__search-results mt-3">
        <p class="small text-muted mb-2">{{ t('home.searchResults') }}</p>
        <ul class="mb-0">
          <li v-for="u in searchResults.users" :key="`u-${u._id}`">
            {{ u.name }} ({{ u.logonUser }}) — User Owner
          </li>
          <li v-for="c in searchResults.cis" :key="`c-${c._id}`">
            {{ c.brandName }} {{ c.modelName }} ({{ c.serialNumber }}) — CI
          </li>
        </ul>
      </div>
    </div>

    <nav class="home__nav" :aria-label="t('home.quickAccess')">
      <router-link
        v-for="item in visibleLinks"
        :key="item.to"
        :to="item.to"
        class="home__link"
      >
        <span class="home__link-icon" aria-hidden="true">
          <i :class="['bi', item.icon]"></i>
        </span>
        <span class="home__link-body">
          <span class="home__link-title">{{ t(item.titleKey) }}</span>
          <span class="home__link-desc">{{ t(item.descKey) }}</span>
        </span>
        <i class="bi bi-arrow-right home__link-arrow" aria-hidden="true"></i>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import { hasMinRole } from '../services/auth';

const { t } = useI18n();
const stats = ref(null);
const notifications = ref(null);
const searchQ = ref('');
const searchResults = ref(null);

const links = [
  {
    to: '/user-owners',
    titleKey: 'nav.userOwners',
    descKey: 'home.userOwnersDesc',
    icon: 'bi-people',
    minRole: 'viewer',
  },
  {
    to: '/configuration-item',
    titleKey: 'nav.configurationItems',
    descKey: 'home.cisDesc',
    icon: 'bi-laptop',
    minRole: 'viewer',
  },
  {
    to: '/assignments',
    titleKey: 'nav.assignments',
    descKey: 'home.assignmentsDesc',
    icon: 'bi-clipboard',
    minRole: 'viewer',
  },
  {
    to: '/letters',
    titleKey: 'nav.letters',
    descKey: 'home.lettersDesc',
    icon: 'bi-envelope',
    minRole: 'viewer',
  },
  {
    to: '/audit',
    titleKey: 'nav.audit',
    descKey: 'home.auditDesc',
    icon: 'bi-journal-text',
    minRole: 'operator',
  },
  {
    to: '/settings',
    titleKey: 'nav.settings',
    descKey: 'home.settingsDesc',
    icon: 'bi-sliders',
    minRole: 'admin',
  },
  {
    to: '/admins',
    titleKey: 'nav.admins',
    descKey: 'home.adminsDesc',
    icon: 'bi-shield-lock',
    minRole: 'admin',
  },
];

const visibleLinks = computed(() => links.filter((item) => hasMinRole(item.minRole)));

const runSearch = async () => {
  if (searchQ.value.trim().length < 2) {
    searchResults.value = null;
    return;
  }
  const { data } = await api.get('/search', { params: { q: searchQ.value.trim() } });
  searchResults.value = data;
};

onMounted(async () => {
  try {
    const [dash, notes] = await Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/notifications', { params: { days: 30 } }),
    ]);
    stats.value = dash.data;
    notifications.value = notes.data;
  } catch {
    stats.value = null;
  }
});
</script>

<style scoped>
.home__hero {
  margin-bottom: 1.5rem;
  max-width: 40rem;
}

.home__eyebrow {
  margin: 0 0 0.5rem;
  font-family: var(--cm-font-display);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cm-teal-700);
}

.home__brand {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}

.home__lead {
  margin: 0;
  font-size: 1.1rem;
  max-width: 34rem;
}

.home__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.home__stat {
  padding: 1rem;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-lg);
  background: var(--cm-surface);
}

.home__stat-value {
  display: block;
  font-family: var(--cm-font-display);
  font-size: 1.6rem;
  font-weight: 700;
}

.home__stat-label {
  color: var(--cm-text-muted);
  font-size: var(--cm-fs-sm);
}

.home__alerts {
  margin-bottom: 1.25rem;
  padding: 0.9rem 1rem;
  border-left: 3px solid var(--cm-teal-700);
  background: var(--cm-teal-50);
}

.home__alerts-title {
  margin: 0 0 0.25rem;
  font-family: var(--cm-font-display);
  font-weight: 600;
}

.home__alerts-text {
  margin: 0;
  color: var(--cm-text-muted);
}

.home__nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.home__link {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  background: var(--cm-surface);
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-lg);
  color: inherit;
  box-shadow: var(--cm-shadow);
  transition:
    border-color var(--cm-duration) var(--cm-ease),
    transform var(--cm-duration) var(--cm-ease),
    background-color var(--cm-duration) var(--cm-ease);
}

.home__link:hover {
  border-color: var(--cm-teal-600);
  background: var(--cm-teal-50);
  color: inherit;
  transform: translateY(-2px);
}

.home__link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--cm-radius-sm);
  background: var(--cm-slate-900);
  color: var(--cm-teal-100);
  font-size: 1.2rem;
}

.home__link-title {
  display: block;
  font-family: var(--cm-font-display);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--cm-slate-900);
  margin-bottom: 0.2rem;
}

.home__link-desc {
  display: block;
  font-size: var(--cm-fs-sm);
  color: var(--cm-text-muted);
}

.home__link-arrow {
  color: var(--cm-teal-700);
  opacity: 0.7;
  transition: transform var(--cm-duration) var(--cm-ease);
}

.home__link:hover .home__link-arrow {
  transform: translateX(3px);
  opacity: 1;
}

@media (max-width: 900px) {
  .home__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home__nav {
    grid-template-columns: 1fr;
  }
}
</style>
