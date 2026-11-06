import { groupPetEvents, groupHistoryByMonth, petDocuments } from "./petDetail";
import { fileCount } from "./counts";
import { applyLocale } from "@/i18n";
import type { MedicalEvent } from "@/types/domain";
const events = [
  {
    id: "past",
    type: "analysis",
    eventDate: "2026-10-01",
    eventTime: null,
    title: "Blood",
    attachments: [{ id: "file" }],
  },
  {
    id: "later",
    type: "vaccination",
    eventDate: "2026-11-04",
    eventTime: null,
    attachments: [],
  },
  {
    id: "today",
    type: "analysis",
    eventDate: "2026-11-03",
    eventTime: "08:00",
    title: "Today",
    attachments: [{ id: "new" }],
  },
  {
    id: "old",
    type: "analysis",
    eventDate: "2025-01-01",
    eventTime: null,
    attachments: [],
  },
] as MedicalEvent[];
it("includes today, orders all future events ascending and history descending", () => {
  const result = groupPetEvents(events, "2026-11-03");
  expect(result.upcoming.map((e) => e.id)).toEqual(["today", "later"]);
  expect(result.history.map((e) => e.id)).toEqual(["past", "old"]);
  expect(events[0].id).toBe("past");
});
it("filters both groups and handles no matches", () => {
  const result = groupPetEvents(events, "2026-11-03", "analysis");
  expect(result.upcoming.map((e) => e.id)).toEqual(["today"]);
  expect(result.history).toHaveLength(2);
  expect(groupPetEvents(events, "2026-11-03", "procedure")).toEqual({
    upcoming: [],
    history: [],
  });
});
it("collects documents by descending event date with context", () => {
  expect(
    petDocuments(events).map((d) => [d.id, d.eventTitle, d.eventDate]),
  ).toEqual([
    ["new", "Today", "2026-11-03"],
    ["file", "Blood", "2026-10-01"],
  ]);
  expect(petDocuments([])).toEqual([]);
});
it("counts files in both languages", () => {
  applyLocale("ru");
  expect([1, 3, 11, 21].map(fileCount)).toEqual([
    "1 файл",
    "3 файла",
    "11 файлов",
    "21 файл",
  ]);
  applyLocale("en");
  expect([1, 3].map(fileCount)).toEqual(["1 file", "3 files"]);
});

it("groups history by month and year in descending order without mutating input", () => {
  applyLocale("ru");
  const history = [
    { ...events[0], id: "a", eventDate: "2025-12-31" },
    { ...events[0], id: "b", eventDate: "2026-01-02" },
    { ...events[0], id: "c", eventDate: "2026-01-01" },
    { ...events[0], id: "d", eventDate: "2025-01-01" },
  ];
  const groups = groupHistoryByMonth(history);
  expect(groups.map((g) => [g.key, g.events.map((e) => e.id)])).toEqual([
    ["2026-01", ["b", "c"]],
    ["2025-12", ["a"]],
    ["2025-01", ["d"]],
  ]);
  expect(groups[0].title).toMatch(/Январь 2026/);
  expect(history.map((e) => e.id)).toEqual(["a", "b", "c", "d"]);
  applyLocale("en");
  expect(groupHistoryByMonth(history)[0].title).toBe("January 2026");
  expect(groupHistoryByMonth([])).toEqual([]);
});
