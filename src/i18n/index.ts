import { en } from "./en";
export type Locale = "ru" | "en";
export type MessageKey = keyof typeof en;
let current: Locale = "en";
export const locale = {
  get value() {
    return current;
  },
};
export const intlLocale = {
  get value() {
    return current === "ru" ? "ru-RU" : "en-US";
  },
};
export function applyLocale(value: Locale) {
  current = value;
}
export function resolveLocale(
  saved: string | null,
  languages: readonly string[],
): Locale {
  if (saved === "ru" || saved === "en") return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (base === "ru" || base === "en") return base;
  }
  return "en";
}
export function t(
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const message = current === "en" ? en[key] : key;
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    String(params[name] ?? match),
  );
}
