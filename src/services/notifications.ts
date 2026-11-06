import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { IosAuthorizationStatus, AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { notificationQueue } from "@/utils/notificationQueue";
import { t } from "@/i18n";
const source = "pet-worth-medical";
const registryKey = "pet-worth-notifications-v2";
const identifier = (id: number) => `pet-worth-${id}`;
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work);
  chain = next.catch(() => undefined);
  return next;
}
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
async function allowed(request: boolean) {
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && request && permission.canAskAgain)
    permission = await Notifications.requestPermissionsAsync();
  const notificationsAllowed =
    permission.granted ||
    permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (!notificationsAllowed) return false;
  if (Platform.OS === "android") {
    let exact = await Notifications.getExactAlarmPermissionsAsync();
    if (!exact.granted && request && exact.canAskAgain)
      exact = await Notifications.requestExactAlarmPermissionsAsync();
    return exact.granted;
  }
  return true;
}
async function channel() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("medical-reminders", {
      name: t("Напоминания"),
      importance: AndroidImportance.HIGH,
    });
}
async function schedule(input: { id: number; eventId: string; at: Date }) {
  await Notifications.scheduleNotificationAsync({
    identifier: identifier(input.id),
    content: {
      title: t("Напоминания"),
      body: t("Открыть событие"),
      data: { source, eventId: input.eventId },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.at,
      channelId: "medical-reminders",
    },
  });
}
export function scheduleEventNotification(input: {
  id: number;
  eventId: string;
  petName: string;
  title: string;
  at: Date;
}) {
  return serial(async () => {
    if (!(await allowed(true))) return { scheduled: false, denied: true };
    await channel();
    // Reconcile the entire queue so the nearest events win when iOS reaches its limit.
    const result = await reconcile();
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    return {
      scheduled: pending.some((n) => n.identifier === identifier(input.id)),
      denied:
        result.failed ||
        !pending.some((n) => n.identifier === identifier(input.id)),
    };
  });
}
export function cancelEventNotification(id: number) {
  return serial(async () => {
    await Notifications.cancelScheduledNotificationAsync(identifier(id));
  });
}
export function clearMedicalNotifications() {
  return serial(async () => {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const saved = JSON.parse(
      (await AsyncStorage.getItem(registryKey)) ?? "[]",
    ) as string[];
    const ids = new Set([
      ...saved,
      ...pending
        .filter((n) => n.content.data?.source === source)
        .map((n) => n.identifier),
    ]);
    for (const id of ids)
      await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(registryKey);
  });
}
async function reconcile() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const rows: {
    event_id: string;
    scheduled_at: string;
    notification_id: number;
  }[] = [];
  if (session) {
    for (let page = 0; ; page++) {
      const { data, error } = await supabase
        .from("reminders")
        .select("event_id,scheduled_at,notification_id")
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at")
        .order("id")
        .range(page * 500, page * 500 + 499);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 500) break;
    }
  }
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const owned = pending.filter((n) => n.content.data?.source === source);
  const capacity =
    Platform.OS === "ios"
      ? Math.max(0, 64 - (pending.length - owned.length))
      : 500;
  const queue = notificationQueue(
    rows.map((r) => ({
      eventId: r.event_id,
      id: r.notification_id,
      at: new Date(r.scheduled_at),
    })),
    capacity,
  );
  if (!(await allowed(false))) {
    for (const n of owned)
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    await AsyncStorage.removeItem(registryKey);
    return { failed: rows.length > 0, omitted: queue.omitted };
  }
  await channel();
  for (const n of owned)
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  const scheduled: string[] = [];
  let failed = false;
  for (const item of queue.selected) {
    try {
      await schedule(item);
      scheduled.push(identifier(item.id));
    } catch {
      failed = true;
    }
  }
  await AsyncStorage.setItem(registryKey, JSON.stringify(scheduled));
  return { failed, omitted: queue.omitted };
}
export function syncMedicalNotifications() {
  return serial(reconcile);
}
export function eventFromNotification(
  response: Notifications.NotificationResponse | null,
) {
  const data = response?.notification.request.content.data;
  return data?.source === source &&
    typeof data.eventId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.eventId,
    )
    ? data.eventId
    : null;
}
