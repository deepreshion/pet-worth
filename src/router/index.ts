import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/auth/callback', name: 'auth-callback', component: () => import('@/pages/AuthCallbackPage.vue') },
  { path: '/ui-kit', name: 'ui-kit', component: () => import('@/pages/UIKitPage.vue') },
  {
    path: '/',
    component: () => import('@/pages/TabsPage.vue'),
    redirect: '/home',
    meta: { requiresAuth: true },
    children: [
      { path: 'home', name: 'home', component: () => import('@/pages/HomePage.vue') },
      { path: 'pets', name: 'pets', component: () => import('@/pages/PetsPage.vue') },
      { path: 'pets/new', name: 'pet-create', component: () => import('@/pages/CreatePetPage.vue') },
      { path: 'pets/:id/edit', name: 'pet-edit', component: () => import('@/pages/EditPetPage.vue') },
      { path: 'pets/:petId/medical-events/new', name: 'medical-event-create', component: () => import('@/pages/CreateMedicalEventPage.vue') },
      { path: 'pets/:id', name: 'pet-detail', component: () => import('@/pages/PetDetailPage.vue') },
      { path: 'medical-events/:id/edit', name: 'medical-event-edit', component: () => import('@/pages/EditMedicalEventPage.vue') },
      { path: 'medical-events/:id', name: 'medical-event-detail', component: () => import('@/pages/MedicalEventDetailPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('@/pages/ProfilePage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized) await auth.initialize()
  if (to.meta.requiresAuth && !auth.user) {
    auth.rememberRedirect(to.fullPath)
    return { name: 'login' }
  }
  if (to.meta.guestOnly && auth.user) return { name: 'home' }
})

export default router
