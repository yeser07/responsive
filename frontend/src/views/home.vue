<template>
  <div class="home cm-page">
    <header class="home__hero">
      <p class="home__eyebrow">{{ t('home.welcome') }}</p>
      <h2 class="home__brand">{{ t('common.appName') }}</h2>
      <p class="home__lead">{{ t('home.lead') }}</p>
    </header>

    <nav class="home__nav" :aria-label="t('home.quickAccess')">
      <router-link
        v-for="item in links"
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
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const links = [
  {
    to: '/user-owners',
    titleKey: 'nav.userOwners',
    descKey: 'home.userOwnersDesc',
    icon: 'bi-people',
  },
  {
    to: '/configuration-item',
    titleKey: 'nav.configurationItems',
    descKey: 'home.cisDesc',
    icon: 'bi-laptop',
  },
  {
    to: '/assignments',
    titleKey: 'nav.assignments',
    descKey: 'home.assignmentsDesc',
    icon: 'bi-clipboard',
  },
  {
    to: '/letters',
    titleKey: 'nav.letters',
    descKey: 'home.lettersDesc',
    icon: 'bi-envelope',
  },
  {
    to: '/admins',
    titleKey: 'nav.admins',
    descKey: 'home.adminsDesc',
    icon: 'bi-shield-lock',
  },
];
</script>

<style scoped>
.home__hero {
  margin-bottom: 2rem;
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

@media (max-width: 768px) {
  .home__nav {
    grid-template-columns: 1fr;
  }
}
</style>
