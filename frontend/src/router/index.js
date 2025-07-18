import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Productos from '../views/ejemplo.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/productos', component: Productos },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
