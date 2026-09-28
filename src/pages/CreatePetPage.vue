<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/home" text="" /></ion-buttons>
        <ion-title>Добавить питомца</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <form novalidate @submit="onSubmit">
        <ion-list :inset="true">
          <ion-list-header><ion-label>Основное</ion-label></ion-list-header>

          <ion-item>
            <ion-thumbnail v-if="photoPreview" slot="start"><img :src="photoPreview" alt="Выбранная фотография" /></ion-thumbnail>
            <ion-icon v-else slot="start" :icon="cameraOutline" />
            <ion-label><h2>Фотография</h2><p>Необязательно, до 10 МБ</p></ion-label>
            <ion-button slot="end" fill="outline" type="button" @click="photoInput?.click()">Выбрать</ion-button>
            <input ref="photoInput" hidden type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" @change="pickPhoto" />
          </ion-item>
          <ion-item v-if="photoError" lines="none"><ion-text color="danger" role="alert">{{ photoError }}</ion-text></ion-item>

          <ion-item>
            <ion-input
              v-model="name"
              label="Имя *"
              label-placement="stacked"
              placeholder="Например, Сеня"
              autocomplete="off"
              :class="{ 'ion-invalid': errors.name, 'ion-touched': errors.name }"
              :error-text="errors.name"
            />
          </ion-item>

          <ion-item lines="none"><ion-label>Вид *</ion-label></ion-item>
          <ion-item>
            <ion-segment v-model="species">
              <ion-segment-button value="cat"><ion-label>Кошка</ion-label></ion-segment-button>
              <ion-segment-button value="dog"><ion-label>Собака</ion-label></ion-segment-button>
            </ion-segment>
          </ion-item>
          <ion-item v-if="errors.species" lines="none"><ion-text color="danger">{{ errors.species }}</ion-text></ion-item>

          <ion-item>
            <ion-input v-model="breed" label="Порода" label-placement="stacked" placeholder="Неизвестна" />
          </ion-item>
          <ion-item>
            <ion-select v-model="sex" label="Пол" label-placement="stacked" interface="action-sheet">
              <ion-select-option value="unknown">Неизвестен</ion-select-option>
              <ion-select-option value="female">Самка</ion-select-option>
              <ion-select-option value="male">Самец</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-list :inset="true">
          <ion-list-header><ion-label>Возраст и вес</ion-label></ion-list-header>
          <ion-radio-group v-model="birthMode">
            <ion-item><ion-radio value="unknown" justify="space-between">Не знаю возраст</ion-radio></ion-item>
            <ion-item><ion-radio value="exact" justify="space-between">Указать дату рождения</ion-radio></ion-item>
            <ion-item><ion-radio value="approximate" justify="space-between">Указать примерный возраст</ion-radio></ion-item>
          </ion-radio-group>

          <ion-item v-if="birthMode === 'exact'">
            <ion-input
              v-model="birthDate"
              type="date"
              label="Дата рождения"
              label-placement="stacked"
              :max="today"
              :class="{ 'ion-invalid': errors.birthDate, 'ion-touched': errors.birthDate }"
              :error-text="errors.birthDate"
            />
          </ion-item>

          <template v-if="birthMode === 'approximate'">
            <ion-item>
              <ion-input :model-value="Number(ageYears || 0)" type="number" inputmode="numeric" min="0" max="40" label="Полных лет" label-placement="stacked" @ion-input="ageYears = Number($event.detail.value || 0)" />
            </ion-item>
            <ion-item>
              <ion-input :model-value="Number(ageMonths || 0)" type="number" inputmode="numeric" min="0" max="11" label="Месяцев" label-placement="stacked" @ion-input="ageMonths = Number($event.detail.value || 0)" />
            </ion-item>
            <ion-item v-if="errors.ageYears || errors.ageMonths" lines="none"><ion-text color="danger">{{ errors.ageYears || errors.ageMonths }}</ion-text></ion-item>
          </template>

          <ion-item>
            <ion-input
              :model-value="weightKg == null ? undefined : Number(weightKg)"
              type="number"
              inputmode="decimal"
              min="0.1"
              max="200"
              step="0.01"
              label="Вес, кг"
              label-placement="stacked"
              placeholder="4,8"
              :class="{ 'ion-invalid': errors.weightKg, 'ion-touched': errors.weightKg }"
              :error-text="errors.weightKg"
              @ion-input="weightKg = $event.detail.value === '' || $event.detail.value == null ? undefined : Number($event.detail.value)"
            />
          </ion-item>
        </ion-list>

        <ion-text v-if="submitError" color="danger" role="alert" class="ion-padding-horizontal"><p>{{ submitError }}</p></ion-text>
        <div class="ion-padding">
          <ion-button expand="block" type="submit" :disabled="isPending">
            <ion-spinner v-if="isPending" slot="start" name="crescent" />
            {{ isPending ? 'Сохраняем' : 'Сохранить профиль' }}
          </ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList,
  IonListHeader, IonPage, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, IonSelect, IonSelectOption,
  IonSpinner, IonText, IonThumbnail, IonTitle, IonToolbar, toastController,
} from '@ionic/vue'
import { cameraOutline } from 'ionicons/icons'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useCreatePetMutation } from '@/composables/usePets'
import { approximateBirthDate, validatePhoto } from '@/utils/pet'
import { captureTechnicalError, trackProductEvent } from '@/lib/monitoring'

const today = new Date().toISOString().slice(0, 10)
const optionalNumber = z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional())
const schema = toTypedSchema(z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(80, 'Не больше 80 символов'),
  species: z.enum(['cat', 'dog'], { required_error: 'Выберите вид' }),
  breed: z.string().max(100, 'Не больше 100 символов').optional(),
  sex: z.enum(['female', 'male', 'unknown']).optional(),
  birthMode: z.enum(['unknown', 'exact', 'approximate']),
  birthDate: z.string().optional(),
  ageYears: optionalNumber.pipe(z.number().int().min(0).max(40).optional()),
  ageMonths: optionalNumber.pipe(z.number().int().min(0).max(11).optional()),
  weightKg: optionalNumber.pipe(z.number().positive('Вес должен быть больше нуля').max(200, 'Проверьте значение веса').optional()),
}).superRefine((value, ctx) => {
  if (value.birthMode === 'exact' && (!value.birthDate || value.birthDate > today)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birthDate'], message: 'Укажите прошедшую дату' })
  }
  if (value.birthMode === 'approximate' && !(Number(value.ageYears || 0) || Number(value.ageMonths || 0))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ageYears'], message: 'Укажите примерный возраст' })
  }
}))

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: { species: 'cat' as const, sex: 'unknown' as const, birthMode: 'unknown' as const, ageYears: 0, ageMonths: 0 },
})
const [name] = defineField('name')
const [species] = defineField('species')
const [breed] = defineField('breed')
const [sex] = defineField('sex')
const [birthMode] = defineField('birthMode')
const [birthDate] = defineField('birthDate')
const [ageYears] = defineField('ageYears')
const [ageMonths] = defineField('ageMonths')
const [weightKg] = defineField('weightKg')

const router = useRouter()
const { mutateAsync, isPending } = useCreatePetMutation()
const photoInput = ref<HTMLInputElement>()
const photo = ref<File>()
const photoError = ref('')
const photoPreview = ref('')
const submitError = ref('')
const requestId = ref(crypto.randomUUID())

const normalizedBirthDate = computed(() => {
  if (birthMode.value === 'exact') return birthDate.value
  if (birthMode.value === 'approximate') return approximateBirthDate(Number(ageYears.value || 0), Number(ageMonths.value || 0))
  return undefined
})

function pickPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const error = validatePhoto(file)
  photoError.value = error ?? ''
  if (error) return
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photo.value = file
  photoPreview.value = URL.createObjectURL(file)
}

const onSubmit = handleSubmit(async (values) => {
  if (photoError.value) return
  submitError.value = ''
  try {
    const result = await mutateAsync({
      requestId: requestId.value,
      name: values.name,
      species: values.species,
      breed: values.breed,
      sex: values.sex,
      birthDate: normalizedBirthDate.value,
      birthDateApproximate: values.birthMode === 'approximate',
      weightKg: values.weightKg,
      photo: photo.value,
    })
    trackProductEvent('pet_created')
    if (result.photoUploadFailed) {
      const toast = await toastController.create({ message: 'Профиль сохранён без фото. Его можно загрузить в карточке питомца.', duration: 4500, color: 'warning' })
      await toast.present()
    }
    await router.replace(`/pets/${result.petId}`)
  } catch (error) {
    captureTechnicalError(error, 'create_pet')
    submitError.value = 'Не удалось сохранить профиль. Проверьте соединение и попробуйте снова.'
  }
})

onBeforeUnmount(() => { if (photoPreview.value) URL.revokeObjectURL(photoPreview.value) })
</script>
