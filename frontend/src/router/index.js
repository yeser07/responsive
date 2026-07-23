import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, clearAuth, shouldSkipSessionRestore } from '../services/auth';
import { fetchCurrentUser } from '../services/api';

import Home from '../views/home.vue';
import Login from '../views/login.vue';
import ConfigurationItem from '../views/configurationItem.vue';
import UserOwner from '../views/userOwner.vue';
import Assignments from '../views/assignments.vue';
import Letters from '../views/letters.vue';
import Admins from '../views/admins.vue';

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/', component: Home },
  { path: '/configuration-item', component: ConfigurationItem },
  { path: '/user-owners', component: UserOwner },
  { path: '/assignments', component: Assignments },
  { path: '/letters', component: Letters },
  { path: '/admins', component: Admins },
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

  return true;
});

export default router;
