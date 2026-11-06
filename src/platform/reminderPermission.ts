import { IosAuthorizationStatus } from "expo-notifications";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function requestReminderPermission() {
  let result = await Notifications.getPermissionsAsync();
  if (!result.granted && result.canAskAgain)
    result = await Notifications.requestPermissionsAsync();
  if (
    !result.granted &&
    result.ios?.status !== IosAuthorizationStatus.PROVISIONAL
  )
    return false;
  if (Platform.OS === "android") {
    let exact = await Notifications.getExactAlarmPermissionsAsync();
    if (!exact.granted && exact.canAskAgain)
      exact = await Notifications.requestExactAlarmPermissionsAsync();
    return exact.granted;
  }
  return true;
}
