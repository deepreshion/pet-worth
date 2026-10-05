import { t } from '@/i18n'
import { z } from 'zod'

function optionalNumber() {
  return z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number({ invalid_type_error: t('Укажите число') }).optional())
}

export function createPetFormSchema(today = new Date().toISOString().slice(0, 10)) {
  return z.object({
    name: z.string().trim().min(1, t('Укажите имя')).max(80, t('Не больше 80 символов')),
    species: z.enum(['cat', 'dog'], { required_error: t('Выберите вид') }),
    breed: z.string().max(100, t('Не больше 100 символов')).optional(),
    sex: z.enum(['female', 'male', 'unknown']).optional(),
    birthMode: z.enum(['unknown', 'exact', 'approximate']),
    birthDate: z.string().optional(),
    ageYears: optionalNumber().pipe(z.number().int(t('Укажите целое число от 0 до 40')).min(0, t('Укажите целое число от 0 до 40')).max(40, t('Укажите целое число от 0 до 40')).optional()),
    ageMonths: optionalNumber().pipe(z.number().int(t('Укажите целое число от 0 до 11')).min(0, t('Укажите целое число от 0 до 11')).max(11, t('Укажите целое число от 0 до 11')).optional()),
    weightKg: optionalNumber().pipe(z.number().positive(t('Вес должен быть больше нуля')).max(200, t('Проверьте значение веса')).optional()),
  }).superRefine((value, ctx) => {
    if (value.birthMode === 'exact' && (!value.birthDate || value.birthDate > today)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['birthDate'], message: t('Укажите прошедшую дату') })
    }
    if (value.birthMode === 'approximate' && !(Number(value.ageYears || 0) || Number(value.ageMonths || 0))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ageYears'], message: t('Укажите примерный возраст') })
    }
  })
}
