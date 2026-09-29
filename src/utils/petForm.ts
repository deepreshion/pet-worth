import { z } from 'zod'

const optionalNumber = z.preprocess((value) => value === '' || value == null ? undefined : Number(value), z.number().optional())

export function createPetFormSchema(today = new Date().toISOString().slice(0, 10)) {
  return z.object({
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
  })
}
