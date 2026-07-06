import { createApp } from 'vue'
import App from '@/App.vue'
import { registerGlobalErrorHandlers, registerTauriTransport } from '@/utils/logger'

registerTauriTransport()
registerGlobalErrorHandlers()

createApp(App).mount('#app')
