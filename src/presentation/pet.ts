import { t, locale } from "@/i18n";
export function formatPetAge(
  birthDate: string | null,
  approximate: boolean,
  today = new Date(),
): string | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let months =
    (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    birth.getUTCMonth();
  if (today.getUTCDate() < birth.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years
      ? `${years} ${locale.value === "en" ? (years === 1 ? "year" : "years") : plural(years, t("год"), t("года"), t("лет"))}`
      : "",
    rest ? `${rest} ${t("мес.")}` : "",
  ].filter(Boolean);
  return `${approximate ? "≈ " : ""}${parts.join(" ") || t("меньше месяца")}`;
}

function plural(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
