import { computed, ref } from 'vue';

const USER_KEY = 'ci_manager_user';

const usernameRef = ref(localStorage.getItem(USER_KEY) || '');
let skipSessionRestore = false;

export function getUsername() {
  return usernameRef.value;
}

export function isAuthenticated() {
  return Boolean(usernameRef.value);
}

export function useAuthState() {
  return {
    username: computed(() => usernameRef.value),
    isAuthenticated: computed(() => Boolean(usernameRef.value)),
  };
}

export function setAuth(username) {
  const value = username || '';
  usernameRef.value = value;
  if (value) {
    localStorage.setItem(USER_KEY, value);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuth() {
  usernameRef.value = '';
  localStorage.removeItem(USER_KEY);
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
