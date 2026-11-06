import { Stack } from "expo-router";
import { t } from "@/i18n";
import { useSettings } from "@/providers/Settings";
export default function AppLayout() {
  useSettings();
  return (
    <Stack screenOptions={{ headerBackTitle: t("Назад"), title: "Pet Worth" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pets/new" options={{ headerShown: false }} />
      <Stack.Screen name="pets/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="pets/[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen
        name="pets/[id]/medical-events/new"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="medical-events/[id]/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="medical-events/[id]/edit"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ui-kit" options={{ title: "UI kit" }} />
    </Stack>
  );
}
