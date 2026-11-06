import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

export async function openNotificationSettings() {
  try {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:notifications");
      return;
    }
    const packageName = Constants.expoConfig?.android?.package;
    if (
      Platform.OS === "android" &&
      Number(Platform.Version) >= 26 &&
      packageName
    ) {
      await Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [
        { key: "android.provider.extra.APP_PACKAGE", value: packageName },
      ]);
      return;
    }
  } catch {
    // Some system versions only support the general app settings page.
  }
  await Linking.openSettings();
}
