import { applyLocale } from "@/i18n";
import {
  formatEventCardDate,
  formatEventDayHeading,
  formatEventWhen,
} from "./medicalEvents";

describe("event dates without Intl.RelativeTimeFormat (Hermes)", () => {
  const original = Intl.RelativeTimeFormat;
  beforeEach(() => {
    Object.defineProperty(Intl, "RelativeTimeFormat", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    applyLocale("ru");
  });
  afterEach(() => {
    Object.defineProperty(Intl, "RelativeTimeFormat", {
      configurable: true,
      writable: true,
      value: original,
    });
    applyLocale("en");
  });

  it.each([
    ["2026-11-04", "Вчера"],
    ["2026-11-05", "Сегодня"],
    ["2026-11-06", "Завтра"],
    ["2026-11-07", "Через 2 дн."],
    ["2026-10-20", "16 дн. назад"],
  ])("renders %s without crashing", (date, relative) => {
    expect(formatEventWhen(date, "11:30", new Date(2026, 10, 5))).toContain(
      `11:30 · ${relative}`,
    );
  });

  it("localizes the fallback in English", () => {
    applyLocale("en");
    expect(
      formatEventWhen("2026-11-07", null, new Date(2026, 10, 5)),
    ).toContain("In 2 days");
  });
});

describe("event day headings", () => {
  afterEach(() => applyLocale("en"));

  it("labels today and tomorrow across a year boundary", () => {
    applyLocale("ru");
    const today = new Date(2026, 11, 31, 23, 30);
    expect(formatEventDayHeading("2026-12-31", today)).toBe(
      "Сегодня, 31 декабря",
    );
    expect(formatEventDayHeading("2027-01-01", today)).toMatch(
      /^Завтра, 1 января 2027/,
    );
    expect(formatEventDayHeading("2027-01-02", today)).toMatch(
      /2 января 2027.* · суббота/,
    );
  });

  it("localizes English headings", () => {
    applyLocale("en");
    const today = new Date(2026, 10, 5);
    expect(formatEventDayHeading("2026-11-05", today)).toBe(
      "Today, November 5",
    );
    expect(formatEventDayHeading("2026-11-06", today)).toBe(
      "Tomorrow, November 6",
    );
    expect(formatEventDayHeading("2026-11-07", today)).toBe(
      "November 7 · Saturday",
    );
  });
});

describe("card date labels", () => {
  afterEach(() => applyLocale("en"));
  it("uses relative labels across midnight and preserves a different year", () => {
    applyLocale("ru");
    const today = new Date(2026, 11, 31, 23, 59);
    expect(formatEventCardDate("2026-12-31", "14:30:00", true, today)).toBe(
      "Сегодня · 14:30",
    );
    expect(formatEventCardDate("2027-01-01", null, true, today)).toMatch(
      /^Завтра, 1 января 2027.* · Время не указано$/,
    );
    expect(formatEventCardDate("2026-12-30", "09:00", false, today)).toBe(
      "30 декабря · 09:00",
    );
  });
  it("formats absolute and relative cards in English", () => {
    applyLocale("en");
    const today = new Date(2026, 10, 5);
    expect(formatEventCardDate("2026-11-06", "11:00", true, today)).toBe(
      "Tomorrow · 11:00",
    );
    expect(formatEventCardDate("2026-11-08", null, false, today)).toBe(
      "November 8 · Time not specified",
    );
    expect(formatEventCardDate("2027-11-08", "11:00", false, today)).toBe(
      "November 8, 2027 · 11:00",
    );
  });
});
