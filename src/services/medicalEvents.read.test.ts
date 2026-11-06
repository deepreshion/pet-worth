import { getMedicalEvent } from "./medicalEvents";
const mockReminder = {
  id: "r",
  event_id: "e",
  scheduled_at: "2026-11-06T07:30:00Z",
  notification_id: 123,
};
let mockRelation: unknown;
jest.mock("@/platform/files", () => ({}));
jest.mock("@/services/notifications", () => ({}));
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: "u" } }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          in: async () => ({ data: [{ family_id: "f" }], error: null }),
          single: async () => ({
            data: {
              id: "e",
              pet_id: "p",
              pets: { family_id: "f", name: "Сеня" },
              medical_attachments: [],
              reminders: mockRelation,
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}));
it.each(["object", "array", "null"])(
  "reads %s reminder relation returned by PostgREST",
  async (shape) => {
    mockRelation =
      shape === "null"
        ? null
        : shape === "array"
          ? [mockReminder]
          : mockReminder;
    const event = await getMedicalEvent("e");
    expect(event.reminder).toEqual(
      shape === "null"
        ? null
        : {
            id: "r",
            eventId: "e",
            scheduledAt: mockReminder.scheduled_at,
            notificationId: 123,
          },
    );
  },
);
