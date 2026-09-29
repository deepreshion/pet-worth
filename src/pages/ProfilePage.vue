<template>
  <ion-page>
    <ion-header :translucent="true"><ion-toolbar><ion-title>Пользователь</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" class="page-content">
      <div v-if="isPending" class="form-skeleton" aria-busy="true"><ion-skeleton-text v-for="item in 4" :key="item" :animated="true" /></div>
      <section v-else-if="isError || !profile" class="state-card"><h2>Не удалось открыть профиль</h2><p>Проверьте соединение и повторите попытку.</p><ion-button @click="refetch()">Повторить</ion-button></section>
      <form v-else class="profile-form" @submit.prevent="save">
        <ion-list :inset="true">
          <ion-list-header><ion-label>Личные данные</ion-label></ion-list-header>
          <ion-item><ion-input :model-value="profile.email" label="Электронная почта" label-placement="stacked" readonly /></ion-item>
          <ion-item><ion-input v-model="displayName" label="Отображаемое имя" label-placement="stacked" autocomplete="name" placeholder="Как к вам обращаться" :error-text="nameError" :class="{ 'ion-invalid ion-touched': nameError }" /></ion-item>
        </ion-list>
        <ion-list :inset="true">
          <ion-list-header><ion-label>Оформление</ion-label></ion-list-header>
          <div class="theme-picker">
            <p id="theme-description" class="theme-picker__label">Тема приложения хранится только на этом устройстве.</p>
            <ion-segment :value="themePreference" aria-labelledby="theme-description" @ion-change="changeTheme($event.detail.value)">
              <ion-segment-button value="system"><ion-icon :icon="phonePortraitOutline" /><ion-label>Системная</ion-label></ion-segment-button>
              <ion-segment-button value="light"><ion-icon :icon="sunnyOutline" /><ion-label>Светлая</ion-label></ion-segment-button>
              <ion-segment-button value="dark"><ion-icon :icon="moonOutline" /><ion-label>Тёмная</ion-label></ion-segment-button>
            </ion-segment>
            <ion-text v-if="themeError" color="danger" role="alert"><small>{{ themeError }}</small></ion-text>
          </div>
        </ion-list>
        <ion-text v-if="formError" color="danger" role="alert" class="ion-padding-horizontal"><p>{{ formError }}</p></ion-text>
        <ion-text v-if="success" color="success" role="status" class="ion-padding-horizontal"><p>Настройки сохранены.</p></ion-text>
        <div class="ion-padding"><ion-button expand="block" type="submit" :disabled="updatePending"><ion-spinner v-if="updatePending" slot="start" name="crescent" />{{ updatePending ? 'Сохраняем' : 'Сохранить' }}</ion-button><ion-button expand="block" fill="outline" color="danger" type="button" @click="logout">Выйти из аккаунта</ion-button></div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonSegment, IonSegmentButton, IonSkeletonText, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/vue'
import { moonOutline, phonePortraitOutline, sunnyOutline } from 'ionicons/icons'
import { useProfileQuery, useUpdateProfileMutation } from '@/composables/useProfile'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { captureTechnicalError } from '@/lib/monitoring'

const router = useRouter(); const auth = useAuthStore(); const { data: profile, isPending, isError, refetch } = useProfileQuery(); const { mutateAsync, isPending: updatePending } = useUpdateProfileMutation()
const { themePreference, setTheme } = useTheme()
const displayName = ref(''); const formError = ref(''); const success = ref(false); const dirty = ref(false); const saved = ref(false)
const themeError = ref('')
const nameError = computed(() => { const value = displayName.value.trim(); if (!value) return 'Укажите отображаемое имя'; if (value.length > 100) return 'Не больше 100 символов'; return '' })
watch(profile, (value) => { if (!value) return; displayName.value = value.displayName ?? ''; dirty.value = false }, { immediate: true })
watch(displayName, () => { if (profile.value) { dirty.value = displayName.value !== (profile.value.displayName ?? ''); success.value = false } })
async function save() {
  if (nameError.value) return
  formError.value = ''; success.value = false
  try { await mutateAsync({ displayName: displayName.value }); saved.value = true; dirty.value = false; success.value = true }
  catch (error) { captureTechnicalError(error, 'update_profile'); formError.value = 'Не удалось сохранить настройки. Попробуйте ещё раз.' }
}
async function logout() { await auth.signOut(); await router.replace('/login') }
async function changeTheme(value: unknown) {
  if (value !== 'system' && value !== 'light' && value !== 'dark') return
  themeError.value = ''
  try { await setTheme(value) }
  catch (error) { captureTechnicalError(error, 'save_theme'); themeError.value = 'Не удалось сохранить тему на устройстве.' }
}
onBeforeRouteLeave(() => !dirty.value || saved.value || window.confirm('Есть несохранённые изменения. Покинуть страницу?'))
</script>
