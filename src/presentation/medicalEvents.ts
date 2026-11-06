import { t, intlLocale } from "@/i18n";
import type { MedicalEventType } from "@/types/domain";
export const medicalEventMeta: Record<
  MedicalEventType,
  { label: string; color: string }
> = {
  vaccination: {
    get label() {
      return t("Вакцинация");
    },
    color: "#28843e",
  },
  vet_visit: {
    get label() {
      return t("Приём врача");
    },
    color: "#8b5cf6",
  },
  analysis: {
    get label() {
      return t("Анализ");
    },
    color: "#348bd4",
  },
  procedure: {
    get label() {
      return t("Процедура или операция");
    },
    color: "#b7641b",
  },
};

export function formatEventDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(intlLocale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventWhen(
  date: string,
  time: string | null,
  today = new Date(),
) {
  const day = new Date(`${date}T00:00:00Z`);
  const days = Math.round(
    (day.getTime() -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  const label = new Date(`${date}T12:00:00`).toLocaleDateString(
    intlLocale.value,
    {
      day: "numeric",
      month: "long",
      ...(day.getUTCFullYear() !== today.getFullYear()
        ? { year: "numeric" }
        : {}),
    },
  );
  return [
    label,
    time?.slice(0, 5),
    typeof Intl.RelativeTimeFormat === "function"
      ? new Intl.RelativeTimeFormat(intlLocale.value, {
          numeric: "auto",
        }).format(days, "day")
      : days === 0
        ? t("Сегодня")
        : days === 1
          ? t("Завтра")
          : days === -1
            ? t("Вчера")
            : days > 0
              ? t("Через {days} дн.", { days })
              : t("{days} дн. назад", { days: Math.abs(days) }),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatEventDayHeading(value: string, today = new Date()) {
  const date = new Date(`${value}T12:00:00`);
  const offset = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  const label = date.toLocaleDateString(intlLocale.value, {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
  if (offset === 0) return `${t("Сегодня")}, ${label}`;
  if (offset === 1) return `${t("Завтра")}, ${label}`;
  const weekday = date.toLocaleDateString(intlLocale.value, {
    weekday: "long",
  });
  return `${label} · ${weekday}`;
}

/** Date labels for cards, separate from full dates on the event detail screen. */
export function formatEventCardDate(
  value: string,
  time: string | null,
  relative = false,
  today = new Date(),
) {
  const date = new Date(`${value}T12:00:00`);
  const days = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
  const label =
    relative && (days === 0 || days === 1)
      ? t(days === 0 ? "Сегодня" : "Завтра")
      : date.toLocaleDateString(intlLocale.value, {
          day: "numeric",
          month: "long",
          ...(date.getFullYear() !== today.getFullYear()
            ? { year: "numeric" }
            : {}),
        });
  // Include the year even for a relative label that crosses New Year.
  const year =
    relative &&
    (days === 0 || days === 1) &&
    date.getFullYear() !== today.getFullYear()
      ? `, ${date.toLocaleDateString(intlLocale.value, { day: "numeric", month: "long", year: "numeric" })}`
      : "";
  return `${label}${year} · ${time?.slice(0, 5) || t("Время не указано")}`;
}
