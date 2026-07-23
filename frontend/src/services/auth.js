import { computed, ref } from 'vue';

const USER_KEY = 'ci_manager_user';
const ROLE_KEY = 'ci_manager_role';
const MUST_CHANGE_KEY = 'ci_manager_must_change';

const usernameRef = ref(localStorage.getItem(USER_KEY) || '');
const roleRef = ref(localStorage.getItem(ROLE_KEY) || '');
const mustChangePasswordRef = ref(localStorage.getItem(MUST_CHANGE_KEY) === 'true');
let skipSessionRestore = false;

const ROLE_RANK = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

export function getUsername() {
  return usernameRef.value;
}

export function getRole() {
  return roleRef.value || 'viewer';
}

export function isAuthenticated() {
  return Boolean(usernameRef.value);
}

export function hasMinRole(minRole) {
  return (ROLE_RANK[getRole()] || 0) >= (ROLE_RANK[minRole] || 99);
}

export function useAuthState() {
  return {
    username: computed(() => usernameRef.value),
    role: computed(() => roleRef.value || 'viewer'),
    mustChangePassword: computed(() => mustChangePasswordRef.value),
    isAuthenticated: computed(() => Boolean(usernameRef.value)),
    hasMinRole,
  };
}

export function setAuth(username, extras = {}) {
  const value = username || '';
  usernameRef.value = value;
  if (value) {
    localStorage.setItem(USER_KEY, value);
  } else {
    localStorage.removeItem(USER_KEY);
  }

  if (extras.role !== undefined) {
    roleRef.value = extras.role || '';
    if (extras.role) localStorage.setItem(ROLE_KEY, extras.role);
    else localStorage.removeItem(ROLE_KEY);
  }

  if (extras.mustChangePassword !== undefined) {
    mustChangePasswordRef.value = Boolean(extras.mustChangePassword);
    if (extras.mustChangePassword) localStorage.setItem(MUST_CHANGE_KEY, 'true');
    else localStorage.removeItem(MUST_CHANGE_KEY);
  }
}

export function clearAuth() {
  usernameRef.value = '';
  roleRef.value = '';
  mustChangePasswordRef.value = false;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(MUST_CHANGE_KEY);
  localStorage.removeItem('ci_manager_token');
}

export function beginLogout() {
  skipSessionRestore = true;
  clearAuth();
}

export function shouldSkipSessionRestore() {
  if (!skipSessionRestore) return false;
  skipSessionRestore = false;
  return true;
}
