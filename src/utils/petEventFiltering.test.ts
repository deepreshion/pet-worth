import { eventsForPet, visiblePetEvents } from "./eventPresentation";
import type { MedicalEvent } from "@/types/domain";
const events = [
  { id: "a", petId: "ray", eventDate: "2026-11-07", eventTime: "11:00" },
  { id: "b", petId: "luna", eventDate: "2026-11-07", eventTime: "10:00" },
  { id: "c", petId: "ray", eventDate: "2026-11-07", eventTime: "09:00" },
  { id: "d", petId: "ray", eventDate: "2026-10-01", eventTime: null },
] as MedicalEvent[];
it("isolates calendar and upcoming data by pet", () => {
  const ray = eventsForPet(events, "ray");
  expect(ray.map((e) => e.id)).toEqual(["a", "c", "d"]);
  expect(visiblePetEvents(ray, null, "2026-11-02").map((e) => e.id)).toEqual([
    "c",
    "a",
  ]);
  expect(eventsForPet(events)).toEqual([]);
});
it("shows date-filtered events in time order and handles empty dates", () => {
  expect(
    visiblePetEvents(
      eventsForPet(events, "ray"),
      "2026-11-07",
      "2026-11-02",
    ).map((e) => e.id),
  ).toEqual(["c", "a"]);
  expect(visiblePetEvents(events, "2026-11-08", "2026-11-02")).toEqual([]);
});
