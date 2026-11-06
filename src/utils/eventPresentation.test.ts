import type { MedicalEvent } from "@/types/domain";
import { upcomingEvents } from "./eventPresentation";
const event = (
  id: string,
  eventDate: string,
  eventTime: string | null = null,
) => ({ id, eventDate, eventTime }) as MedicalEvent;
it("sorts and limits upcoming events without modifying the source", () => {
  const events = [
    event("past", "2026-10-19"),
    event("later", "2026-11-01"),
    event("untimed", "2026-10-20"),
    event("morning", "2026-10-20", "10:00"),
    event("early", "2026-10-20", "09:00"),
  ];
  expect(upcomingEvents(events, "2026-10-20").map((e) => e.id)).toEqual([
    "early",
    "morning",
    "untimed",
  ]);
  expect(events[0].id).toBe("past");
});
describe("upcoming empty state", () => {
  it("excludes past events", () =>
    expect(upcomingEvents([event("old", "2025-10-20")], "2026-10-20")).toEqual(
      [],
    ));
});
