import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import Vue3EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

const app = createApp(App)
app.component('EasyDataTable', Vue3EasyDataTable)

app.use(router)
app.use(i18n)
app.mount('#app')
