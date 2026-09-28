import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/auth/callback', name: 'auth-callback', component: () => import('@/pages/AuthCallbackPage.vue') },
  { path: '/ui-kit', name: 'ui-kit', component: () => import('@/pages/UIKitPage.vue') },
  { path: '/home', name: 'home', component: () => import('@/pages/HomePage.vue'), meta: { requiresAuth: true } },
  { path: '/pets/new', name: 'pet-create', component: () => import('@/pages/CreatePetPage.vue'), meta: { requiresAuth: true } },
  { path: '/pets/:id', name: 'pet-detail', component: () => import('@/pages/PetDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.user) return { name: 'home' }
})

export default router
