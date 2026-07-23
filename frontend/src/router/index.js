import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, clearAuth, shouldSkipSessionRestore, hasMinRole, useAuthState } from '../services/auth';
import { fetchCurrentUser } from '../services/api';

const routes = [
  {
    path: '/login',
    component: () => import('../views/login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../views/home.vue'),
  },
  {
    path: '/configuration-item',
    component: () => import('../views/configurationItem.vue'),
    meta: { minRole: 'viewer' },
  },
  {
    path: '/user-owners',
    component: () => import('../views/userOwner.vue'),
    meta: { minRole: 'viewer' },
  },
  {
    path: '/assignments',
    component: () => import('../views/assignments.vue'),
    meta: { minRole: 'viewer' },
  },
  {
    path: '/letters',
    component: () => import('../views/letters.vue'),
    meta: { minRole: 'viewer' },
  },
  {
    path: '/admins',
    component: () => import('../views/admins.vue'),
    meta: { minRole: 'admin' },
  },
  {
    path: '/audit',
    component: () => import('../views/audit.vue'),
    meta: { minRole: 'operator' },
  },
  {
    path: '/settings',
    component: () => import('../views/settings.vue'),
    meta: { minRole: 'admin' },
  },
  {
    path: '/change-password',
    component: () => import('../views/changePassword.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/notFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

async function ensureSession() {
  try {
    await fetchCurrentUser();
    return isAuthenticated();
  } catch {
    clearAuth();
    return false;
  }
}

router.beforeEach(async (to) => {
  if (to.meta.public) {
    if (to.path === '/login') {
      if (shouldSkipSessionRestore()) {
        return true;
      }
      if (await ensureSession()) {
        return '/';
      }
    }
    return true;
  }

  if (!(await ensureSession())) {
    return '/login';
  }

  const { mustChangePassword } = useAuthState();
  if (mustChangePassword.value && to.path !== '/change-password') {
    return '/change-password';
  }

  if (to.meta.minRole && !hasMinRole(to.meta.minRole)) {
    return '/';
  }

  return true;
});

export default router;
