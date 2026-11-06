import type { MedicalEvent } from "@/types/domain";
export function upcomingEvents(
  events: MedicalEvent[],
  today: string,
  limit = 3,
) {
  return events
    .filter((event) => event.eventDate >= today)
    .sort(
      (a, b) =>
        a.eventDate.localeCompare(b.eventDate) ||
        (a.eventTime ?? "23:59").localeCompare(b.eventTime ?? "23:59") ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

export function eventsForPet(events: MedicalEvent[], petId?: string) {
  return petId ? events.filter((event) => event.petId === petId) : [];
}
export function visiblePetEvents(
  events: MedicalEvent[],
  date: string | null,
  today: string,
) {
  return date
    ? events
        .filter((event) => event.eventDate === date)
        .sort(
          (a, b) =>
            (a.eventTime ?? "23:59").localeCompare(b.eventTime ?? "23:59") ||
            a.id.localeCompare(b.id),
        )
    : upcomingEvents(events, today);
}
