<template>
  <div v-if="isLoginRoute" class="cm-auth-root">
    <router-view />
  </div>

  <div v-else class="cm-shell" :class="{ 'cm-shell--collapsed': collapsed, 'cm-shell--drawer-open': mobileOpen }">
    <a class="cm-skip-link" href="#cm-main">{{ t('nav.skipToContent') }}</a>
    <div
      v-if="mobileOpen"
      class="cm-shell__backdrop"
      @click="mobileOpen = false"
    />

    <aside class="cm-sidebar" :aria-label="t('nav.mainNav')">
      <div class="cm-sidebar__brand">
        <i class="bi bi-person-workspace" aria-hidden="true"></i>
        <div class="cm-sidebar__brand-text">
          <span class="cm-sidebar__brand-name">{{ t('common.appName') }}</span>
          <span class="cm-sidebar__brand-tag">{{ t('common.opsStudio') }}</span>
        </div>
      </div>

      <nav class="cm-sidebar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="cm-sidebar__link"
          :class="{ 'router-link-exact-active': isNavActive(item.to) }"
          @click="mobileOpen = false"
        >
          <i :class="['bi', item.icon]" aria-hidden="true"></i>
          <span class="cm-sidebar__label">{{ t(item.labelKey) }}</span>
        </router-link>
      </nav>

      <button
        type="button"
        class="cm-sidebar__collapse d-none d-lg-flex"
        :aria-label="collapsed ? t('nav.expand') : t('nav.collapse')"
        @click="collapsed = !collapsed"
      >
        <i :class="collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'" aria-hidden="true"></i>
        <span class="cm-sidebar__label">{{ collapsed ? t('nav.expand') : t('nav.collapse') }}</span>
      </button>
    </aside>

    <div class="cm-shell__main">
      <header class="cm-topbar">
        <div class="cm-topbar__left">
          <button
            type="button"
            class="cm-topbar__menu d-lg-none"
            :aria-label="t('nav.openMenu')"
            @click="mobileOpen = true"
          >
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
          <div>
            <p class="cm-topbar__eyebrow">{{ t('common.appName') }}</p>
            <h1 class="cm-topbar__title">{{ pageTitle }}</h1>
          </div>
        </div>

        <div class="cm-topbar__right">
          <LanguageSwitcher />
          <div v-if="isAuthenticated" class="cm-user-menu" ref="userMenuRef">
            <button
              class="cm-topbar__user"
              type="button"
              id="dropdownUser"
              :aria-expanded="userMenuOpen"
              aria-haspopup="true"
              @click="userMenuOpen = !userMenuOpen"
            >
              <span class="cm-topbar__avatar" aria-hidden="true">{{ usernameInitial }}</span>
              <span class="cm-topbar__username">{{ username }}</span>
              <i class="bi bi-chevron-down cm-user-menu__caret" aria-hidden="true"></i>
            </button>
            <div
              v-show="userMenuOpen"
              class="cm-user-menu__panel"
              role="menu"
              aria-labelledby="dropdownUser"
            >
              <p class="cm-user-menu__meta">{{ t('shell.activeSession') }} · {{ role }}</p>
              <router-link
                class="cm-user-menu__item"
                role="menuitem"
                to="/change-password"
                @click="userMenuOpen = false"
              >
                <i class="bi bi-key" aria-hidden="true"></i>
                {{ t('password.menu') }}
              </router-link>
              <button
                class="cm-user-menu__item"
                type="button"
                role="menuitem"
                :disabled="loggingOut"
                @click="logout"
              >
                <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                {{ loggingOut ? t('shell.loggingOut') : t('shell.logout') }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="cm-main" class="cm-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="cm-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="cm-footer d-flex flex-wrap gap-2 justify-content-center">
        <span>© 2026 {{ t('common.appName') }}</span>
        <span class="cm-footer__sep" aria-hidden="true">·</span>
        <span>{{ t('shell.footerTagline') }}</span>
        <span>{{ t('common.developedBy') }} <a href="https://ysabillon.com" target="_blank">{{ t('common.developerName') }}</a></span>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthState, hasMinRole } from './services/auth';
import { logoutRequest } from './services/api';
import LanguageSwitcher from './components/LanguageSwitcher.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const mobileOpen = ref(false);
const loggingOut = ref(false);
const userMenuOpen = ref(false);
const userMenuRef = ref(null);

const isLoginRoute = computed(() => route.path === '/login');
const { username, isAuthenticated, role } = useAuthState();
const usernameInitial = computed(() => (username.value || 'A').charAt(0).toUpperCase());

const navItems = computed(() =>
  [
    { to: '/', labelKey: 'nav.home', icon: 'bi-house-door', titleKey: 'nav.home', minRole: 'viewer' },
    { to: '/user-owners', labelKey: 'nav.userOwners', icon: 'bi-people', titleKey: 'nav.userOwners', minRole: 'viewer' },
    { to: '/configuration-item', labelKey: 'nav.configurationItems', icon: 'bi-laptop', titleKey: 'nav.configurationItems', minRole: 'viewer' },
    { to: '/assignments', labelKey: 'nav.assignments', icon: 'bi-clipboard', titleKey: 'nav.assignments', minRole: 'viewer' },
    { to: '/letters', labelKey: 'nav.letters', icon: 'bi-envelope', titleKey: 'nav.letters', minRole: 'viewer' },
    { to: '/audit', labelKey: 'nav.audit', icon: 'bi-journal-text', titleKey: 'nav.audit', minRole: 'operator' },
    { to: '/settings', labelKey: 'nav.settings', icon: 'bi-sliders', titleKey: 'nav.settings', minRole: 'admin' },
    { to: '/admins', labelKey: 'nav.admins', icon: 'bi-shield-lock', titleKey: 'nav.admins', minRole: 'admin' },
  ].filter((item) => hasMinRole(item.minRole))
);

const pageTitle = computed(() => {
  const match = navItems.value.find((item) => item.to === route.path);
  return match ? t(match.titleKey) : t('common.appName');
});

const isNavActive = (to) => route.path === to;

const onDocumentClick = (event) => {
  if (!userMenuRef.value) return;
  if (!userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});

watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
    userMenuOpen.value = false;
  }
);

const logout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  userMenuOpen.value = false;
  try {
    await logoutRequest();
    await router.replace('/login');
  } finally {
    loggingOut.value = false;
  }
};
</script>

<style scoped>
.cm-auth-root {
  min-height: 100vh;
}

.cm-shell {
  display: grid;
  grid-template-columns: var(--cm-sidebar-width) 1fr;
  min-height: 100vh;
  transition: grid-template-columns var(--cm-duration-slow) var(--cm-ease);
}

.cm-shell--collapsed {
  grid-template-columns: var(--cm-sidebar-collapsed) 1fr;
}

.cm-shell__backdrop {
  display: none;
}

.cm-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: var(--cm-space-4);
  padding: var(--cm-space-5) var(--cm-space-3);
  background: var(--cm-sidebar-bg);
  background-image:
    linear-gradient(165deg, rgba(15, 118, 110, 0.18) 0%, transparent 42%),
    linear-gradient(180deg, #0c1a24 0%, #0a1520 100%);
  color: var(--cm-sidebar-text);
  z-index: 40;
  overflow: hidden;
}

.cm-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.cm-sidebar__brand i {
  font-size: 1.5rem;
  color: var(--cm-teal-100);
  flex-shrink: 0;
}

.cm-sidebar__brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  opacity: 1;
  transition: opacity var(--cm-duration) var(--cm-ease);
}

.cm-sidebar__brand-name {
  font-family: var(--cm-font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--cm-sidebar-text-active);
  letter-spacing: -0.02em;
}

.cm-sidebar__brand-tag {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cm-teal-100);
  opacity: 0.75;
}

.cm-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.cm-sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.8rem;
  border-radius: var(--cm-radius-sm);
  color: var(--cm-sidebar-text);
  font-family: var(--cm-font-display);
  font-size: var(--cm-fs-sm);
  font-weight: 500;
  transition:
    background-color var(--cm-duration) var(--cm-ease),
    color var(--cm-duration) var(--cm-ease);
}

.cm-sidebar__link i {
  font-size: 1.15rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
}

.cm-sidebar__link:hover {
  background: var(--cm-sidebar-hover);
  color: var(--cm-sidebar-text-active);
}

.cm-sidebar__link.router-link-exact-active {
  background: var(--cm-sidebar-active);
  color: var(--cm-sidebar-text-active);
}

.cm-sidebar__link.router-link-exact-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--cm-teal-600);
}

.cm-sidebar__label {
  white-space: nowrap;
  overflow: hidden;
  transition: opacity var(--cm-duration) var(--cm-ease), width var(--cm-duration) var(--cm-ease);
}

.cm-sidebar__collapse {
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--cm-radius-sm);
  background: transparent;
  color: var(--cm-sidebar-text);
  font-family: var(--cm-font-display);
  font-size: var(--cm-fs-xs);
  cursor: pointer;
}

.cm-sidebar__collapse:hover {
  background: var(--cm-sidebar-hover);
  color: var(--cm-sidebar-text-active);
}

.cm-shell--collapsed .cm-sidebar__brand-text,
.cm-shell--collapsed .cm-sidebar__label {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

.cm-shell--collapsed .cm-sidebar__brand,
.cm-shell--collapsed .cm-sidebar__link,
.cm-shell--collapsed .cm-sidebar__collapse {
  justify-content: center;
  padding-left: 0.65rem;
  padding-right: 0.65rem;
}

.cm-shell--collapsed .cm-sidebar__link.router-link-exact-active::before {
  display: none;
}

.cm-shell__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.cm-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cm-space-4);
  min-height: var(--cm-topbar-height);
  padding: 0.75rem 1.5rem;
  background: var(--cm-white);
  border-bottom: 1px solid var(--cm-border);
}

.cm-topbar__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cm-topbar__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cm-topbar__menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-sm);
  background: var(--cm-white);
  color: var(--cm-slate-800);
  cursor: pointer;
}

.cm-topbar__eyebrow {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--cm-teal-700);
  font-family: var(--cm-font-display);
  font-weight: 600;
}

.cm-topbar__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.cm-topbar__user {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.65rem 0.35rem 0.35rem;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius);
  background: var(--cm-white);
  color: var(--cm-text);
  font-family: var(--cm-font-display);
  font-size: var(--cm-fs-sm);
  font-weight: 500;
  cursor: pointer;
}

.cm-topbar__user:hover {
  border-color: var(--cm-teal-700);
}

.cm-user-menu {
  position: relative;
}

.cm-user-menu__caret {
  font-size: 0.75rem;
  color: var(--cm-text-muted);
}

.cm-user-menu__panel {
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  z-index: 50;
  min-width: 12.5rem;
  padding: 0.4rem;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius);
  background: var(--cm-white);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.cm-user-menu__meta {
  margin: 0;
  padding: 0.45rem 0.65rem 0.35rem;
  color: var(--cm-text-muted);
  font-size: var(--cm-fs-xs);
}

.cm-user-menu__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 0;
  border-radius: var(--cm-radius-sm);
  background: transparent;
  color: var(--cm-text);
  font-family: var(--cm-font-display);
  font-size: var(--cm-fs-sm);
  text-align: left;
  cursor: pointer;
}

.cm-user-menu__item:hover:not(:disabled) {
  background: var(--cm-slate-50);
  color: var(--cm-teal-800);
}

.cm-user-menu__item:disabled {
  opacity: 0.65;
  cursor: wait;
}

.cm-topbar__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--cm-radius-sm);
  background: var(--cm-teal-700);
  color: var(--cm-white);
  font-weight: 700;
}

.cm-content {
  flex: 1;
  padding: 1.5rem;
}

.cm-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.85rem 1.5rem;
  border-top: 1px solid var(--cm-border);
  color: var(--cm-text-muted);
  font-size: var(--cm-fs-xs);
  background: rgba(248, 250, 252, 0.7);
}

.cm-footer__sep {
  opacity: 0.5;
}

.cm-page-enter-active,
.cm-page-leave-active {
  transition: opacity var(--cm-duration) var(--cm-ease);
}

.cm-page-enter-from,
.cm-page-leave-to {
  opacity: 0;
}

@media (max-width: 991.98px) {
  .cm-shell,
  .cm-shell--collapsed {
    grid-template-columns: 1fr;
  }

  .cm-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(18rem, 86vw);
    transform: translateX(-105%);
    transition: transform var(--cm-duration-slow) var(--cm-ease);
    box-shadow: var(--cm-shadow);
  }

  .cm-shell--drawer-open .cm-sidebar {
    transform: translateX(0);
  }

  .cm-shell__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 35;
    animation: cm-fade-in var(--cm-duration) var(--cm-ease);
  }

  .cm-shell--collapsed .cm-sidebar__brand-text,
  .cm-shell--collapsed .cm-sidebar__label {
    opacity: 1;
    width: auto;
    pointer-events: auto;
  }

  .cm-topbar__username {
    display: none;
  }
}
</style>
