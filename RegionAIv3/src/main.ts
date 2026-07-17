import '@/styles/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import {
  registerGlobalErrorHandlers,
  registerTauriTransport,
} from '@/utils/logger'
import router from '@/router'
//import i18n from "./stores/language";

registerTauriTransport()
registerGlobalErrorHandlers()

const app = createApp(App)
app.use(createPinia())
app.use(router)
//app.use(i18n);
app.mount('#app')
