<template>
  <div class="login cm-page-enter">
    <section class="login__brand" :aria-label="t('login.brandAria')">
      <div class="login__brand-inner">
        <p class="login__eyebrow">{{ t('common.opsStudio') }}</p>
        <h1 class="login__brand-name">{{ t('common.appName') }}</h1>
        <p class="login__lead">{{ t('login.lead') }}</p>
      </div>
      <div class="login__mesh" aria-hidden="true" />
    </section>

    <section class="login__form-panel">
      <div class="login__lang">
        <LanguageSwitcher />
      </div>
      <form class="login__form" @submit.prevent="handleLogin">
        <h2 class="login__form-title">{{ t('login.title') }}</h2>
        <p class="login__form-sub">{{ t('login.subtitle') }}</p>

        <div class="mb-3">
          <label class="form-label" for="username">{{ t('login.username') }}</label>
          <input
            id="username"
            v-model="username"
            class="form-control"
            autocomplete="username"
            required
          />
        </div>
        <div class="mb-4">
          <label class="form-label" for="password">{{ t('login.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            autocomplete="current-password"
            required
          />
        </div>
        <button class="btn btn-primary w-100" type="submit" :disabled="loading">
          {{ loading ? t('login.submitting') : t('login.submit') }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiUrl from '../config';
import { setAuth } from '../services/auth';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';

const { t } = useI18n();
const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  try {
    const { data } = await axios.post(
      `${apiUrl}/auth/login`,
      {
        username: username.value,
        password: password.value,
      },
      { withCredentials: true }
    );
    setAuth(data.user.username);
    router.push('/');
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: t('login.errorTitle'),
      text: error.response?.data?.message || t('login.invalidCredentials'),
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  min-height: 100vh;
}

.login__brand {
  position: relative;
  display: flex;
  align-items: center;
  padding: clamp(2rem, 6vw, 5rem);
  background: #0c1a24;
  color: var(--cm-slate-50);
  overflow: hidden;
}

.login__mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(13, 148, 136, 0.35), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(148, 163, 184, 0.18), transparent 45%),
    repeating-linear-gradient(
      -12deg,
      transparent 0,
      transparent 18px,
      rgba(255, 255, 255, 0.02) 18px,
      rgba(255, 255, 255, 0.02) 19px
    );
  pointer-events: none;
}

.login__brand-inner {
  position: relative;
  z-index: 1;
  max-width: 28rem;
  animation: cm-fade-in 0.45s var(--cm-ease) both;
}

.login__eyebrow {
  margin: 0 0 0.75rem;
  font-family: var(--cm-font-display);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cm-teal-100);
}

.login__brand-name {
  margin: 0 0 1rem;
  font-size: clamp(2.4rem, 5vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #fff;
  line-height: 1.05;
}

.login__lead {
  margin: 0;
  font-size: 1.125rem;
  color: rgba(248, 250, 252, 0.78);
  max-width: 22rem;
}

.login__form-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background:
    linear-gradient(160deg, rgba(15, 118, 110, 0.06), transparent 40%),
    var(--cm-slate-50);
}

.login__lang {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
}

.login__form {
  width: min(400px, 100%);
  animation: cm-fade-in 0.45s var(--cm-ease) 0.08s both;
}

.login__form-title {
  margin-bottom: 0.35rem;
  font-size: 1.5rem;
}

.login__form-sub {
  margin-bottom: 1.75rem;
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
  }

  .login__brand {
    min-height: 38vh;
    padding: 2rem 1.5rem;
  }

  .login__brand-name {
    font-size: 2.25rem;
  }
}
</style>
