export function approximateBirthDate(years: number, months: number, today = new Date()): string {
  const totalMonths = years * 12 + months
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  date.setUTCMonth(date.getUTCMonth() - totalMonths)
  return date.toISOString().slice(0, 10)
}

export function approximateAgeParts(birthDate: string, today = new Date()): { years: number; months: number } {
  const birth = new Date(`${birthDate}T00:00:00Z`)
  let totalMonths = (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 + today.getUTCMonth() - birth.getUTCMonth()
  if (today.getUTCDate() < birth.getUTCDate()) totalMonths -= 1
  totalMonths = Math.max(0, totalMonths)
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
}

export function formatPetAge(birthDate: string | null, approximate: boolean, today = new Date()): string | null {
  if (!birthDate) return null
  const birth = new Date(`${birthDate}T00:00:00Z`)
  let months = (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 + today.getUTCMonth() - birth.getUTCMonth()
  if (today.getUTCDate() < birth.getUTCDate()) months -= 1
  months = Math.max(0, months)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = [years ? `${years} ${plural(years, 'год', 'года', 'лет')}` : '', rest ? `${rest} мес.` : ''].filter(Boolean)
  return `${approximate ? '≈ ' : ''}${parts.join(' ') || 'меньше месяца'}`
}

function plural(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function validatePhoto(file: File): string | null {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  if (!allowed.includes(file.type)) return 'Поддерживаются JPEG, PNG, WebP и HEIC.'
  if (file.size > 10 * 1024 * 1024) return 'Фотография должна быть не больше 10 МБ.'
  return null
}

export function shouldCreateWeightRecord(current: number | null, next: number | undefined): boolean {
  return next != null && next !== current
}
