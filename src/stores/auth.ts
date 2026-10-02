import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { captureTechnicalError, trackProductEvent } from '@/lib/monitoring'
import { disableDemoMode, enableDemoMode, isDemoMode } from '@/lib/demo'
import { syncMedicalNotifications } from '@/services/notifications'
import { syncCurrentProfileTimezone } from '@/services/profile'
import { reconcileStorageCleanup } from '@/services/storageCleanup'

interface AuthState {
  session: Session | null
  user: User | null
  initialized: boolean
}

const redirectKey = 'pet-worth-auth-redirect'

function isSafeInternalPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('://')
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ session: null, user: null, initialized: false }),
  actions: {
    async initialize() {
      if (this.initialized) return
      if (isDemoMode()) {
        this.user = { id: 'demo-user', email: 'demo@petworth.local' } as User
        this.initialized = true
        return
      }
      const { data, error } = await supabase.auth.getSession()
      if (error) captureTechnicalError(error, 'auth_restore_session')
      this.session = data.session
      this.user = data.session?.user ?? null
      this.initialized = true

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
        void (async () => {
          if (session) await syncCurrentProfileTimezone()
          if (session) await reconcileStorageCleanup()
          await syncMedicalNotifications()
        })().catch((error) => captureTechnicalError(error, 'reconcile_device_auth_change'))
      })
    },
    async sendMagicLink(email: string) {
      const redirectTo = Capacitor.isNativePlatform()
        ? 'petworth://auth/callback'
        : `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })
      if (error) throw error
    },
    async completeMagicLink(code: string) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      this.session = data.session
      this.user = data.user
      await syncCurrentProfileTimezone()
      await reconcileStorageCleanup()
      void syncMedicalNotifications().catch((error) => captureTechnicalError(error, 'sync_medical_notifications_sign_in'))
      trackProductEvent('sign_in_completed')
    },
    async signOut() {
      if (isDemoMode()) {
        disableDemoMode()
        this.session = null
        this.user = null
        return
      }
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.session = null
      this.user = null
      void syncMedicalNotifications().catch((error) => captureTechnicalError(error, 'sync_medical_notifications_sign_out'))
    },
    rememberRedirect(path: string) {
      if (isSafeInternalPath(path)) window.localStorage.setItem(redirectKey, path)
    },
    consumeRedirect() {
      const path = window.localStorage.getItem(redirectKey)
      window.localStorage.removeItem(redirectKey)
      return path && isSafeInternalPath(path) ? path : '/home'
    },
    enterDemo() {
      enableDemoMode()
      this.user = { id: 'demo-user', email: 'demo@petworth.local' } as User
    },
  },
})
