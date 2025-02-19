// /src/main.js (Unchanged)
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/css/main.css' // Keep this line (now it imports Bootstrap CSS)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Import Bootstrap JS bundle

const app = createApp(App)

app.use(router)

app.mount('#app')
