// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/css/main.css'
import './assets/css/template.css'  
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import './assets/css/responsive.css'

const app = createApp(App)
app.use(router)
app.mount('#app')