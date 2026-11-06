import { NoticeProvider } from "@/providers/Notices";
import { NotificationWarning } from "@/components/NotificationWarning";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CatLoader } from "@/components/CatLoader";
import { StartupError } from "@/components/StartupError";
import { useStartupData } from "@/hooks/useStartupData";
import {
  Stack,
  router,
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope/800ExtraBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { SettingsProvider, useSettings } from "@/providers/Settings";
import { AuthProvider, useAuth } from "@/providers/Auth";
import { queryClient } from "@/lib/query";
import {
  eventFromNotification,
  syncMedicalNotifications,
} from "@/services/notifications";
import { initializeMonitoring, captureTechnicalError } from "@/lib/monitoring";
void SplashScreen.preventAutoHideAsync();
initializeMonitoring();
function hideSplash() {
  requestAnimationFrame(() => {
    void SplashScreen.hideAsync().catch((error) =>
      captureTechnicalError(error, "splash_screen"),
    );
  });
}
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NoticeProvider>
                <Navigation />
              </NoticeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
function Navigation() {
  const settings = useSettings();
  const auth = useAuth();
  const startup = useStartupData(
    auth.ready ? (auth.session?.user.id ?? null) : null,
  );
  const [fonts, error] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    if (settings.ready && auth.session && !settings.onboardingComplete) {
      void settings
        .finishOnboarding()
        .catch((e) => captureTechnicalError(e, "onboarding_storage"));
    }
  }, [settings, auth.session]);
  const handled = useRef(new Set<string>());
  const opened = useRef<string | null>(null);
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = eventFromNotification(response);
      const key = response?.notification.request.identifier;
      if (!id || !key || handled.current.has(key)) return;
      handled.current.add(key);
      setTarget(id);
      void Notifications.clearLastNotificationResponseAsync();
    };
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (settings.ready && auth.ready && (fonts || error)) hideSplash();
  }, [settings.ready, auth.ready, fonts, error]);
  useEffect(() => {
    if (
      auth.session &&
      target &&
      target !== opened.current &&
      settings.ready &&
      (fonts || error) &&
      startup.status === "ready"
    ) {
      opened.current = target;
      router.push(`/medical-events/${target}`);
    }
  }, [auth.session, target, settings.ready, fonts, error, startup.status]);
  useEffect(() => {
    if (settings.ready && auth.session)
      void syncMedicalNotifications().catch((e) =>
        captureTechnicalError(e, "language_notifications"),
      );
  }, [settings.locale, settings.ready, auth.session]);
  if (
    !settings.ready ||
    !auth.ready ||
    (!fonts && !error) ||
    startup.status === "loading"
  )
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <StatusBar style="dark" />
        <CatLoader variant="fullscreen" onReady={hideSplash} />
      </View>
    );
  if (startup.status === "error")
    return (
      <>
        <StatusBar style={settings.dark ? "light" : "dark"} />
        <StartupError onRetry={startup.retry} />
      </>
    );
  const base = settings.dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: settings.colors.background,
          card: settings.colors.surface,
          text: settings.colors.text,
          border: settings.colors.border,
          primary: settings.colors.action,
        },
      }}
    >
      <View style={{ flex: 1 }}>
        <StatusBar style={settings.dark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={Boolean(auth.session)}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected
            guard={!auth.session && !settings.onboardingComplete}
          >
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={!auth.session && settings.onboardingComplete}>
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Screen name="auth/callback" />
        </Stack>
        {auth.session && auth.notificationWarning ? (
          <NotificationWarning key={auth.session.user.id} />
        ) : null}
      </View>
    </ThemeProvider>
  );
}
