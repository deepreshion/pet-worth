import type { UploadAsset } from "@/types/domain";
export function approximateBirthDate(
  years: number,
  months: number,
  today = new Date(),
): string {
  const totalMonths = years * 12 + months;
  const day = today.getUTCDate();
  const date = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - totalMonths, 1),
  );
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString().slice(0, 10);
}

export function approximateAgeParts(
  birthDate: string,
  today = new Date(),
): { years: number; months: number } {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let totalMonths =
    (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    birth.getUTCMonth();
  if (today.getUTCDate() < birth.getUTCDate()) totalMonths -= 1;
  totalMonths = Math.max(0, totalMonths);
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

export function validatePhoto(file: UploadAsset): string | null {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];
  if (!allowed.includes(file.mimeType)) return "PHOTO_TYPE_INVALID";
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) return "PHOTO_TOO_LARGE";
  return null;
}

export function shouldCreateWeightRecord(
  current: number | null,
  next: number | undefined,
): boolean {
  return next != null && next !== current;
}
