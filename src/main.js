// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')