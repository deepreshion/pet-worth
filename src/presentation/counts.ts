import { locale, t } from "@/i18n";
function plural(count: number) {
  if (locale.value === "en") return count === 1 ? "one" : "many";
  const last = count % 10,
    teen = count % 100;
  return last === 1 && teen !== 11
    ? "one"
    : last >= 2 && last <= 4 && (teen < 12 || teen > 14)
      ? "few"
      : "many";
}
export function petCount(count: number) {
  const kind = plural(count);
  return t(
    kind === "one"
      ? "{count} питомец"
      : kind === "few"
        ? "{count} питомца"
        : "{count} питомцев",
    { count },
  );
}
export function eventCount(count: number) {
  const kind = plural(count);
  return t(
    kind === "one"
      ? "{count} событие"
      : kind === "few"
        ? "{count} события"
        : "{count} событий",
    { count },
  );
}

export function fileCount(count: number) {
  const kind = plural(count);
  return t(
    kind === "one"
      ? "{count} файл"
      : kind === "few"
        ? "{count} файла"
        : "{count} файлов",
    { count },
  );
}
