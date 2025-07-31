
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Importa CSS y JS de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js' 
import 'bootstrap-icons/font/bootstrap-icons.css'

import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';   

const app = createApp(App)
app.component('EasyDataTable', Vue3EasyDataTable);

app.use(router)
app.mount('#app')