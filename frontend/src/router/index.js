import { createRouter, createWebHistory } from 'vue-router';

import Home from '../views/home.vue';
import ConfigurationItem from '../views/configurationItem.vue';

const routes = [
  { path: '/', component: Home },
  {path: '/configuration-item', component: ConfigurationItem},

];

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
