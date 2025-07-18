// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
// This configuration sets up Vite to use Vue.js and proxies API requests to a backend server running on port 3000.
// The proxy allows the frontend to communicate with the backend without CORS issues during development.
// The `vue` plugin is used to handle Vue single-file components (.vue files).
// The `defineConfig` function is used to create a Vite configuration object.
// This configuration is essential for a smooth development experience, allowing the frontend to fetch data from the backend seamlessly.
// The `server` property specifies the development server settings, including the proxy configuration.
// The `plugins` array includes the Vue plugin to enable Vue.js support in the Vite build process.
// This setup is commonly used in modern web applications that separate frontend and backend concerns, allowing for a more modular architecture.
// The proxy configuration is particularly useful in development environments to avoid CORS issues when the frontend and backend are served from different origins.
// This Vite configuration is a standard practice in Vue.js projects, especially when integrating with a backend API.
// It ensures that the frontend can make API requests without running into cross-origin resource sharing (CORS) problems, which is a common issue when developing applications that have separate frontend and backend servers.
