<template>
  <form novalidate @submit="onSubmit">
    <ion-list :inset="true">
      <ion-list-header><ion-label>Основное</ion-label></ion-list-header>
      <ion-item>
        <ion-thumbnail v-if="photoPreview || pet?.photoUrl" slot="start"><img :src="photoPreview || pet?.photoUrl || ''" alt="Фотография питомца" /></ion-thumbnail>
        <ion-icon v-else slot="start" :icon="cameraOutline" />
        <ion-label><h2>Фотография</h2><p>Необязательно, до 10 МБ</p></ion-label>
        <ion-button slot="end" fill="outline" type="button" @click="photoInput?.click()">{{ pet?.photoUrl ? 'Заменить' : 'Выбрать' }}</ion-button>
        <input ref="photoInput" hidden type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" @change="pickPhoto" />
      </ion-item>
      <ion-item v-if="photoError" lines="none"><ion-text color="danger" role="alert">{{ photoError }}</ion-text></ion-item>
      <ion-item><ion-input v-model="name" label="Имя *" label-placement="stacked" placeholder="Например, Сеня" autocomplete="off" :class="{ 'ion-invalid': errors.name, 'ion-touched': errors.name }" :error-text="errors.name" /></ion-item>
      <ion-item lines="none"><ion-label>Вид *</ion-label></ion-item>
      <ion-item><ion-segment v-model="species" aria-label="Вид питомца"><ion-segment-button value="cat"><ion-label>Кошка</ion-label></ion-segment-button><ion-segment-button value="dog"><ion-label>Собака</ion-label></ion-segment-button></ion-segment></ion-item>
      <ion-item v-if="errors.species" lines="none"><ion-text color="danger">{{ errors.species }}</ion-text></ion-item>
      <ion-item><ion-input v-model="breed" label="Порода" label-placement="stacked" placeholder="Неизвестна" :error-text="errors.breed" /></ion-item>
      <ion-item><ion-select v-model="sex" label="Пол" label-placement="stacked" interface="action-sheet"><ion-select-option value="unknown">Неизвестен</ion-select-option><ion-select-option value="female">Самка</ion-select-option><ion-select-option value="male">Самец</ion-select-option></ion-select></ion-item>
    </ion-list>
    <ion-list :inset="true">
      <ion-list-header><ion-label>Возраст и вес</ion-label></ion-list-header>
      <ion-radio-group v-model="birthMode"><ion-item><ion-radio value="unknown" justify="space-between">Не знаю возраст</ion-radio></ion-item><ion-item><ion-radio value="exact" justify="space-between">Указать дату рождения</ion-radio></ion-item><ion-item><ion-radio value="approximate" justify="space-between">Указать примерный возраст</ion-radio></ion-item></ion-radio-group>
      <ion-item v-if="birthMode === 'exact'"><ion-input v-model="birthDate" type="date" label="Дата рождения" label-placement="stacked" :max="today" :class="{ 'ion-invalid': errors.birthDate, 'ion-touched': errors.birthDate }" :error-text="errors.birthDate" /></ion-item>
      <template v-if="birthMode === 'approximate'">
        <ion-item><ion-input :model-value="Number(ageYears || 0)" type="number" inputmode="numeric" min="0" max="40" label="Полных лет" label-placement="stacked" @ion-input="ageYears = Number($event.detail.value || 0)" /></ion-item>
        <ion-item><ion-input :model-value="Number(ageMonths || 0)" type="number" inputmode="numeric" min="0" max="11" label="Месяцев" label-placement="stacked" @ion-input="ageMonths = Number($event.detail.value || 0)" /></ion-item>
        <ion-item v-if="errors.ageYears || errors.ageMonths" lines="none"><ion-text color="danger">{{ errors.ageYears || errors.ageMonths }}</ion-text></ion-item>
      </template>
      <ion-item><ion-input :model-value="weightKg == null ? undefined : Number(weightKg)" type="number" inputmode="decimal" min="0.1" max="200" step="0.01" label="Текущий вес, кг" label-placement="stacked" placeholder="4,8" :class="{ 'ion-invalid': errors.weightKg, 'ion-touched': errors.weightKg }" :error-text="errors.weightKg" @ion-input="weightKg = $event.detail.value === '' || $event.detail.value == null ? undefined : Number($event.detail.value)" /></ion-item>
    </ion-list>
    <ion-text v-if="error" color="danger" role="alert" class="ion-padding-horizontal"><p>{{ error }}</p></ion-text>
    <div class="ion-padding"><ion-button expand="block" type="submit" :disabled="submitting"><ion-spinner v-if="submitting" slot="start" name="crescent" />{{ submitting ? 'Сохраняем' : submitLabel }}</ion-button></div>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonRadio, IonRadioGroup, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSpinner, IonText, IonThumbnail } from '@ionic/vue'
import { cameraOutline } from 'ionicons/icons'
import type { PetFormSubmission, PetSummary } from '@/types/domain'
import { approximateAgeParts, approximateBirthDate, validatePhoto } from '@/utils/pet'
import { createPetFormSchema } from '@/utils/petForm'

const props = defineProps<{ pet?: PetSummary; submitting: boolean; error?: string; submitLabel?: string }>()
const emit = defineEmits<{ save: [value: PetFormSubmission] }>()
const today = new Date().toISOString().slice(0, 10)
const age = props.pet?.birthDate && props.pet.birthDateApproximate ? approximateAgeParts(props.pet.birthDate) : { years: 0, months: 0 }
const initialBirthMode = props.pet?.birthDate ? (props.pet.birthDateApproximate ? 'approximate' : 'exact') : 'unknown'
const petFormSchema = createPetFormSchema(today)
const { defineField, errors, handleSubmit, meta } = useForm({ validationSchema: toTypedSchema(petFormSchema), initialValues: {
  name: props.pet?.name ?? '', species: props.pet?.species ?? 'cat', breed: props.pet?.breed ?? '', sex: props.pet?.sex ?? 'unknown', birthMode: initialBirthMode as 'unknown' | 'exact' | 'approximate', birthDate: props.pet?.birthDate ?? '', ageYears: age.years, ageMonths: age.months, weightKg: props.pet?.latestWeightKg ?? undefined,
} })
const [name] = defineField('name'); const [species] = defineField('species'); const [breed] = defineField('breed'); const [sex] = defineField('sex'); const [birthMode] = defineField('birthMode'); const [birthDate] = defineField('birthDate'); const [ageYears] = defineField('ageYears'); const [ageMonths] = defineField('ageMonths'); const [weightKg] = defineField('weightKg')
const photoInput = ref<HTMLInputElement>(); const photo = ref<File>(); const photoError = ref(''); const photoPreview = ref(''); const saved = ref(false)
const submitLabel = computed(() => props.submitLabel ?? 'Сохранить профиль')
function pickPhoto(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; const validationError = validatePhoto(file); photoError.value = validationError ?? ''; if (validationError) return; if (photoPreview.value) URL.revokeObjectURL(photoPreview.value); photo.value = file; photoPreview.value = URL.createObjectURL(file) }
const onSubmit = handleSubmit((values) => { if (photoError.value) return; const normalizedBirthDate = values.birthMode === 'exact' ? values.birthDate : values.birthMode === 'approximate' ? approximateBirthDate(Number(values.ageYears || 0), Number(values.ageMonths || 0)) : undefined; saved.value = true; emit('save', { name: values.name, species: values.species, breed: values.breed, sex: values.sex, birthDate: normalizedBirthDate, birthDateApproximate: values.birthMode === 'approximate', weightKg: values.weightKg, photo: photo.value }) })
onBeforeRouteLeave(() => !meta.value.dirty || saved.value || window.confirm('Есть несохранённые изменения. Покинуть страницу?'))
onBeforeUnmount(() => { if (photoPreview.value) URL.revokeObjectURL(photoPreview.value) })
</script>
