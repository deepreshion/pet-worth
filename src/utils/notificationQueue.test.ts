import { notificationQueue } from "./notificationQueue";
const now = new Date("2026-11-01T00:00:00Z");
const item = (id: number, at: string) => ({
  eventId: String(id),
  id,
  at: new Date(at),
});
it("prioritizes nearest events, excludes expired and duplicate events, and reports overflow", () => {
  const queue = notificationQueue(
    [
      item(1, "2026-11-03"),
      item(2, "2026-11-02"),
      item(2, "2026-11-02"),
      item(3, "2026-10-01"),
    ],
    1,
    now,
  );
  expect(queue.selected.map((x) => x.id)).toEqual([2]);
  expect(queue.omitted).toBe(1);
});
it("respects space occupied by other apps features in the iOS queue", () => {
  const items = Array.from({ length: 1000 }, (_, i) => item(i, "2026-12-01"));
  expect(notificationQueue(items, 60, now)).toMatchObject({ omitted: 940 });
  expect(notificationQueue(items, 0, now).selected).toEqual([]);
});
