import axios from 'axios';
import apiUrl from '../config';
import { clearAuth, getUsername, setAuth, beginLogout } from './auth';

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

let refreshPromise = null;

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiUrl}/auth/refresh`, null, { withCredentials: true })
      .then((response) => {
        const username = response.data?.user?.username;
        if (username) {
          setAuth(username);
        }
        return response;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function redirectToLogin() {
  beginLogout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function isAuthPath(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/me')
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    if (status !== 401 || !original || original._retry || isAuthPath(url) || original._skipAuthRedirect) {
      if (status === 401 && !isAuthPath(url) && !original?._skipAuthRedirect) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshSession();
      return api(original);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  }
);

export async function fetchCurrentUser() {
  try {
    const { data } = await api.get('/auth/me', { _skipAuthRedirect: true });
    const username = data?.user?.username || '';
    if (username) {
      setAuth(username);
    }
    return username || getUsername();
  } catch (error) {
    if (error.response?.status !== 401) {
      throw error;
    }
    try {
      await refreshSession();
      const { data } = await api.get('/auth/me', { _skipAuthRedirect: true });
      const username = data?.user?.username || '';
      if (username) {
        setAuth(username);
      }
      return username || getUsername();
    } catch {
      clearAuth();
      throw error;
    }
  }
}

export async function logoutRequest() {
  beginLogout();
  try {
    await api.post('/auth/logout', null, { _skipAuthRedirect: true });
  } catch {
    // ignore logout errors; local session already cleared
  } finally {
    clearAuth();
  }
}

export default api;
