import { intlLocale } from "@/i18n";
import type {
  MedicalAttachment,
  MedicalEvent,
  MedicalEventType,
} from "@/types/domain";

export type PetDocument = MedicalAttachment & {
  eventTitle: string;
  eventDate: string;
};
const chronological = (a: MedicalEvent, b: MedicalEvent) =>
  a.eventDate.localeCompare(b.eventDate) ||
  (a.eventTime ?? "23:59").localeCompare(b.eventTime ?? "23:59") ||
  a.id.localeCompare(b.id);
export function groupPetEvents(
  events: MedicalEvent[],
  today: string,
  filter: MedicalEventType | "" = "",
) {
  const visible = events.filter((e) => !filter || e.type === filter);
  return {
    upcoming: visible.filter((e) => e.eventDate >= today).sort(chronological),
    history: visible
      .filter((e) => e.eventDate < today)
      .sort((a, b) => chronological(b, a)),
  };
}
export function petDocuments(events: MedicalEvent[]): PetDocument[] {
  return [...events]
    .sort((a, b) => chronological(b, a))
    .flatMap((event) =>
      event.attachments.map((attachment) => ({
        ...attachment,
        eventTitle: event.title,
        eventDate: event.eventDate,
      })),
    );
}

export function groupHistoryByMonth(events: MedicalEvent[]) {
  const groups: { key: string; title: string; events: MedicalEvent[] }[] = [];
  for (const event of [...events].sort((a, b) => chronological(b, a))) {
    const key = event.eventDate.slice(0, 7);
    let group = groups[groups.length - 1];
    if (group?.key !== key) {
      const label = new Date(`${key}-01T12:00:00`).toLocaleDateString(
        intlLocale.value,
        { month: "long", year: "numeric" },
      );
      group = {
        key,
        title: label.charAt(0).toUpperCase() + label.slice(1),
        events: [],
      };
      groups.push(group);
    }
    group.events.push(event);
  }
  return groups;
}
