import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Text as MockText } from "react-native";
import RootLayout from "../../app/_layout";
import { StartupError } from "./StartupError";
import { applyLocale } from "@/i18n";
import { SettingsProvider } from "@/providers/Settings";

const mockRetry = jest.fn();
const mockPush = jest.fn();
let mockStartup: "loading" | "ready" | "error" = "loading";
let mockFonts = false;
let mockAuthenticated = true;
let mockDark = false;
const mockNotification = {
  notification: { request: { identifier: "notice-1" } },
};

jest.mock("@/hooks/useStartupData", () => ({
  useStartupData: () => ({ status: mockStartup, retry: mockRetry }),
}));
jest.mock("@/providers/Settings", () => {
  return {
    SettingsProvider: ({ children }: PropsWithChildren) => children,
    useSettings: () => ({
      ready: true,
      onboardingComplete: true,
      dark: mockDark,
      colors: {
        background: mockDark ? "#101216" : "#F4F5F7",
        text: mockDark ? "#EFF2F6" : "#24272C",
        muted: mockDark ? "#A6AFBD" : "#626A75",
        surface: mockDark ? "#1A1D22" : "#FFFFFF",
        action: "#24272C",
        onAction: "#FFFFFF",
      },
    }),
  };
});
jest.mock("@/providers/Auth", () => ({
  AuthProvider: ({ children }: PropsWithChildren) => children,
  useAuth: () => ({
    ready: true,
    session: mockAuthenticated ? { user: { id: "owner" } } : null,
  }),
}));
jest.mock("@/providers/Notices", () => ({
  NoticeProvider: ({ children }: PropsWithChildren) => children,
}));
jest.mock("./NotificationWarning", () => ({ NotificationWarning: () => null }));
jest.mock("./CatLoader", () => ({
  CatLoader: () => <MockText>Startup cat</MockText>,
}));
jest.mock("expo-font", () => ({ useFonts: () => [mockFonts, null] }));
jest.mock("@expo-google-fonts/manrope/400Regular", () => ({
  Manrope_400Regular: 1,
}));
jest.mock("@expo-google-fonts/manrope/600SemiBold", () => ({
  Manrope_600SemiBold: 1,
}));
jest.mock("@expo-google-fonts/manrope/700Bold", () => ({ Manrope_700Bold: 1 }));
jest.mock("@expo-google-fonts/manrope/800ExtraBold", () => ({
  Manrope_800ExtraBold: 1,
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-notifications", () => ({
  getLastNotificationResponseAsync: () => Promise.resolve(mockNotification),
  clearLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
}));
jest.mock("@/services/notifications", () => ({
  eventFromNotification: () => "event-1",
  syncMedicalNotifications: () => Promise.resolve(),
}));
jest.mock("@/lib/monitoring", () => ({
  initializeMonitoring: jest.fn(),
  captureTechnicalError: jest.fn(),
}));
jest.mock("expo-router", () => {
  const Stack = () => <MockText>Navigation ready</MockText>;
  Stack.Protected = function Protected() {
    return null;
  };
  Stack.Screen = function Screen() {
    return null;
  };
  return {
    Stack,
    router: { push: (...args: unknown[]) => mockPush(...args) },
    ThemeProvider: ({ children }: PropsWithChildren) => children,
    DarkTheme: { colors: {} },
    DefaultTheme: { colors: {} },
  };
});
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaProvider: View, SafeAreaView: View };
});

beforeEach(() => {
  mockStartup = "loading";
  mockFonts = false;
  mockAuthenticated = true;
  mockDark = false;
  mockRetry.mockClear();
  mockPush.mockClear();
  applyLocale("ru");
});

it("keeps the cat until fonts and data are ready, then opens the notification target", async () => {
  const view = await render(<RootLayout />);
  expect(screen.getByText("Startup cat")).toBeTruthy();
  mockFonts = true;
  await view.rerender(<RootLayout />);
  expect(screen.getByText("Startup cat")).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
  mockStartup = "ready";
  await view.rerender(<RootLayout />);
  expect(screen.queryByText("Startup cat")).toBeNull();
  expect(screen.getByText("Navigation ready")).toBeTruthy();
  expect(mockPush).toHaveBeenCalledWith("/medical-events/event-1");
});

it("retains a notification through a startup error and a manual retry", async () => {
  mockFonts = true;
  mockStartup = "error";
  const view = await render(<RootLayout />);
  expect(screen.queryByText("Navigation ready")).toBeNull();
  expect(screen.getByText("Не получилось загрузить данные")).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Повторить загрузку" }),
  );
  expect(mockRetry).toHaveBeenCalledTimes(1);
  mockStartup = "loading";
  await view.rerender(<RootLayout />);
  expect(screen.getByText("Startup cat")).toBeTruthy();
  mockStartup = "ready";
  await view.rerender(<RootLayout />);
  expect(mockPush).toHaveBeenCalledTimes(1);
});

it("opens unauthenticated navigation without a private-data gate", async () => {
  mockAuthenticated = false;
  mockFonts = true;
  mockStartup = "ready";
  await render(<RootLayout />);
  expect(screen.getByText("Navigation ready")).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
});

it.each([false, true])(
  "renders the error and retry in both themes (dark=%s)",
  async (dark) => {
    mockDark = dark;
    applyLocale("en");
    await act(async () => {
      await render(
        <SettingsProvider>
          <StartupError onRetry={mockRetry} />
        </SettingsProvider>,
      );
    });
    expect(screen.getByText("Couldn't load your data")).toBeTruthy();
    expect(
      screen.getByText("Check your internet connection and try again."),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  },
);
