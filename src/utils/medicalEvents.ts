import type {
  MedicalEvent,
  MedicalEventType,
  UploadAsset,
} from "@/types/domain";

export function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function zonedEventDateTime(
  date: string,
  time = "10:00",
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desiredWallTime;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const renderedWallTime = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    instant += desiredWallTime - renderedWallTime;
  }
  const check = Object.fromEntries(
    formatter
      .formatToParts(new Date(instant))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
  if (
    Date.UTC(
      check.year,
      check.month - 1,
      check.day,
      check.hour,
      check.minute,
    ) !== desiredWallTime
  )
    throw new Error("INVALID_EVENT_TIME");
  return new Date(instant);
}

export function isReminderEligible(
  date: string,
  time = "10:00",
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
) {
  try {
    return (
      zonedEventDateTime(date, time, timeZone).getTime() - now.getTime() >=
      24 * 60 * 60 * 1000
    );
  } catch {
    return false;
  }
}

export function reminderScheduledAt(
  date: string,
  time = "10:00",
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
) {
  return new Date(
    zonedEventDateTime(date, time, timeZone).getTime() - 24 * 60 * 60 * 1000,
  );
}

export function deterministicAttachmentId(requestId: string, index: number) {
  const seed = `${requestId}:${index}`;
  let first = 2166136261;
  let second = 0x9e3779b9;
  for (const char of seed) {
    first = Math.imul(first ^ char.charCodeAt(0), 16777619);
    second = Math.imul(second ^ char.charCodeAt(0), 2246822519);
  }
  const hex = `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}${((first ^ second) >>> 0).toString(16).padStart(8, "0")}${(Math.imul(first, second) >>> 0).toString(16).padStart(8, "0")}`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function stableNotificationId(id: string) {
  let hash = 2166136261;
  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2_147_483_646) + 1;
}

export function calendarDots(events: MedicalEvent[]) {
  const days = new Map<string, MedicalEventType[]>();
  for (const event of events) {
    const types = days.get(event.eventDate) ?? [];
    if (!types.includes(event.type)) types.push(event.type);
    days.set(event.eventDate, types);
  }
  return days;
}

export const acceptedMedicalMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];
export const maxMedicalFileSize = 20 * 1024 * 1024;

export function validateMedicalFiles(files: UploadAsset[]) {
  if (files.some((file) => !acceptedMedicalMimeTypes.includes(file.mimeType)))
    return "INVALID_FILE_TYPE";
  if (files.some((file) => file.size <= 0 || file.size > maxMedicalFileSize))
    return "INVALID_FILE_SIZE";
  return null;
}
