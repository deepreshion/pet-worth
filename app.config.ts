import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Pet Worth",
  slug: "pet-worth",
  version: "0.2.0",
  scheme: "petworth",
  platforms: ["ios", "android"],
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "app.petworth.mobile",
    supportsTablet: true,
    infoPlist: {
      UIFileSharingEnabled: true,
      LSSupportsOpeningDocumentsInPlace: true,
    },
  },
  android: {
    package: "app.petworth.mobile",
    permissions: ["android.permission.SCHEDULE_EXACT_ALARM"],
  },
  plugins: [
    "expo-image",
    "expo-sharing",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFFFF",
        image: "./assets/loader/cat-splash.png",
        imageWidth: 140,
        resizeMode: "contain",
        dark: {
          backgroundColor: "#FFFFFF",
          image: "./assets/loader/cat-splash.png",
        },
      },
    ],
    "expo-status-bar",
    "@react-native-community/datetimepicker",
    "expo-router",
    "expo-dev-client",
    "expo-font",
    "expo-localization",
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Pet Worth to select a photo for your pet.",
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    "expo-document-picker",
    ["expo-notifications", { defaultChannel: "medical-reminders" }],
    [
      "expo-build-properties",
      { ios: { deploymentTarget: "16.4" }, android: { minSdkVersion: 24 } },
    ],
  ],
  experiments: { typedRoutes: true },
};
export default config;
