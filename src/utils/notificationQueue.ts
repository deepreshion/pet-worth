export interface NotificationCandidate {
  eventId: string;
  id: number;
  at: Date;
}
export function notificationQueue<T extends NotificationCandidate>(
  items: T[],
  capacity: number,
  now = new Date(),
) {
  const unique = new Map<string, T>();
  for (const item of items)
    if (item.at > now && !unique.has(item.eventId))
      unique.set(item.eventId, item);
  const sorted = [...unique.values()].sort(
    (a, b) =>
      a.at.getTime() - b.at.getTime() || a.eventId.localeCompare(b.eventId),
  );
  return {
    selected: sorted.slice(0, Math.max(0, capacity)),
    omitted: Math.max(0, sorted.length - Math.max(0, capacity)),
  };
}
