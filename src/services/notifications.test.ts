import * as N from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import {
  clearMedicalNotifications,
  eventFromNotification,
  scheduleEventNotification,
  syncMedicalNotifications,
} from "./notifications";
jest.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: jest.fn() }, from: jest.fn() },
}));
jest.mock("expo-notifications", () => ({
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExactAlarmPermissionsAsync: jest.fn(),
  requestExactAlarmPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));
const api = supabase as unknown as {
  auth: { getSession: jest.Mock };
  from: jest.Mock;
};
const granted = N.getPermissionsAsync as jest.Mock;
const pending = N.getAllScheduledNotificationsAsync as jest.Mock;
const schedule = N.scheduleNotificationAsync as jest.Mock;
const cancel = N.cancelScheduledNotificationAsync as jest.Mock;
const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const row = {
  event_id: eventId,
  notification_id: 42,
  scheduled_at: "2099-01-01T10:00:00Z",
};
function rows(items: unknown[]) {
  api.from.mockReturnValue({
    select: () => ({
      gt: () => ({
        order: () => ({
          order: () => ({ range: async () => ({ data: items, error: null }) }),
        }),
      }),
    }),
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
  granted.mockResolvedValue({ granted: true });
  pending.mockResolvedValue([]);
  schedule.mockResolvedValue("ok");
  api.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u" } } },
  });
  rows([row]);
});
it("does not prompt during passive reconciliation", async () => {
  granted.mockResolvedValue({ granted: false, canAskAgain: true });
  expect(await syncMedicalNotifications()).toMatchObject({ failed: true });
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(schedule).not.toHaveBeenCalled();
});
it("replaces owned requests while preserving unrelated notifications", async () => {
  pending.mockResolvedValue([
    { identifier: "old", content: { data: { source: "pet-worth-medical" } } },
    { identifier: "other", content: { data: { source: "other" } } },
  ]);
  await syncMedicalNotifications();
  expect(cancel).toHaveBeenCalledWith("old");
  expect(cancel).not.toHaveBeenCalledWith("other");
  expect(schedule).toHaveBeenCalledWith(
    expect.objectContaining({
      identifier: "pet-worth-42",
      content: expect.objectContaining({
        data: { source: "pet-worth-medical", eventId },
      }),
    }),
  );
});
it("limits iOS requests and reports omitted reminders", async () => {
  rows(
    Array.from({ length: 70 }, (_, i) => ({
      ...row,
      event_id: `event-${i}`,
      notification_id: i + 1,
    })),
  );
  const result = await syncMedicalNotifications();
  expect(schedule).toHaveBeenCalledTimes(64);
  expect(result.omitted).toBe(6);
});
it("reports native scheduling failure without claiming success", async () => {
  schedule.mockRejectedValue(new Error("permission"));
  expect(await syncMedicalNotifications()).toMatchObject({ failed: true });
});
it("requires exact-alarm permission on Android when enabling reminders", async () => {
  Object.defineProperty(Platform, "OS", {
    value: "android",
    configurable: true,
  });
  (N.getExactAlarmPermissionsAsync as jest.Mock).mockResolvedValue({
    granted: false,
    canAskAgain: true,
  });
  (N.requestExactAlarmPermissionsAsync as jest.Mock).mockResolvedValue({
    granted: false,
  });
  expect(
    await scheduleEventNotification({
      id: 42,
      eventId,
      petName: "private",
      title: "private",
      at: new Date(row.scheduled_at),
    }),
  ).toEqual({ scheduled: false, denied: true });
  expect(N.requestExactAlarmPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(schedule).not.toHaveBeenCalled();
});
it("clears only application requests at logout", async () => {
  pending.mockResolvedValue([
    {
      identifier: "pet-worth-42",
      content: { data: { source: "pet-worth-medical" } },
    },
  ]);
  await clearMedicalNotifications();
  expect(cancel).toHaveBeenCalledWith("pet-worth-42");
});
it("rejects unrelated or malformed notification navigation", () => {
  expect(eventFromNotification(null)).toBeNull();
  expect(
    eventFromNotification({
      notification: {
        request: { content: { data: { source: "other", eventId } } },
      },
    } as unknown as N.NotificationResponse),
  ).toBeNull();
  expect(
    eventFromNotification({
      notification: {
        request: {
          content: { data: { source: "pet-worth-medical", eventId } },
        },
      },
    } as unknown as N.NotificationResponse),
  ).toBe(eventId);
});
