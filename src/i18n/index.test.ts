import { applyLocale, resolveLocale, t } from "./index";
it("uses saved language, then first supported device language, then English", () => {
  expect(resolveLocale("ru", ["en"])).toBe("ru");
  expect(resolveLocale(null, ["ka-GE", "ru-RU", "en-US"])).toBe("ru");
  expect(resolveLocale(null, ["ka-GE"])).toBe("en");
});
it("translates interface messages without translating user interpolation", () => {
  applyLocale("en");
  expect(t("Открыть профиль питомца {name}", { name: "Сеня" })).toContain(
    "Сеня",
  );
  applyLocale("ru");
  expect(t("Сохранить")).toBe("Сохранить");
});
