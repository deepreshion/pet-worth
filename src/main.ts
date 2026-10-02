import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { App as CapacitorApp } from '@capacitor/app'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/flex-utils.css'
import './styles/theme.css'

import App from './App.vue'
import { initializeNotificationNavigation, syncMedicalNotifications } from '@/services/notifications'
import { syncCurrentProfileTimezone } from '@/services/profile'
import router from './router'
import { useAuthStore } from './stores/auth'
import { captureTechnicalError, initializeMonitoring } from './lib/monitoring'
import { initializeTheme } from './composables/useTheme'
import { reconcileStorageCleanup } from '@/services/storageCleanup'

const app = createApp(App)
const pinia = createPinia()

app.use(IonicVue)
app.use(pinia)
app.use(VueQueryPlugin)
app.use(router)

initializeMonitoring(app, router)
await initializeTheme()

const auth = useAuthStore(pinia)
await auth.initialize()
async function reconcileDeviceState(context: string) {
  try { await syncCurrentProfileTimezone() } catch (error) { captureTechnicalError(error, `sync_profile_timezone_${context}`) }
  try { await reconcileStorageCleanup() } catch (error) { captureTechnicalError(error, `sync_storage_cleanup_${context}`) }
  try { await syncMedicalNotifications() } catch (error) { captureTechnicalError(error, `sync_medical_notifications_${context}`) }
}
void reconcileDeviceState('start')

CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
  if (!url.startsWith('petworth://auth/callback')) return
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')
  const error = parsed.searchParams.get('error_description') ?? parsed.searchParams.get('error')
  await router.replace({ name: 'auth-callback', query: { ...(code ? { code } : {}), ...(error ? { error } : {}) } })
})
CapacitorApp.addListener('appStateChange', ({ isActive }) => {
  if (isActive) void reconcileDeviceState('resume')
})

await router.isReady()
app.mount('#app')
void initializeNotificationNavigation(router)
