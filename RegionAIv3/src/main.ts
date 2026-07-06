import '@/styles/index.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import { registerGlobalErrorHandlers, registerTauriTransport } from '@/utils/logger'
import router from '@/router'

registerTauriTransport()
registerGlobalErrorHandlers()

const app = createApp(App)
app.use(router)
app.mount('#app')
