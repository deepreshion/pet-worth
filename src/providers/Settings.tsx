import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { applyLocale, resolveLocale, type Locale } from "@/i18n";
export type ThemePreference = "system" | "light" | "dark";
const light = {
  background: "#F4F5F7",
  surface: "#FFFFFF",
  card: "#E9ECEF",
  soft: "#E5E9EF",
  text: "#24272C",
  secondary: "#626A75",
  muted: "#626A75",
  border: "#D8DEE6",
  action: "#24272C",
  onAction: "#FFFFFF",
  diaryVetBg: "#EDE7F5",
  diaryVetInk: "#66517E",
  diaryVaxBg: "#E4EFE6",
  diaryVaxInk: "#3D6950",
  diaryLabBg: "#E3EDF5",
  diaryLabInk: "#436780",
  diaryCareBg: "#F6E9DE",
  diaryCareInk: "#865932",
  danger: "#B3261E",
  dangerSoft: "#FDEBEC",
};
const dark: typeof light = {
  background: "#101216",
  surface: "#1A1D22",
  card: "#242830",
  soft: "#303640",
  text: "#EFF2F6",
  secondary: "#A6AFBD",
  muted: "#A6AFBD",
  border: "#3B424F",
  action: "#E6EAF0",
  onAction: "#101216",
  diaryVetBg: "#332C40",
  diaryVetInk: "#D4C1EC",
  diaryVaxBg: "#263A30",
  diaryVaxInk: "#B5DBC2",
  diaryLabBg: "#263747",
  diaryLabInk: "#B9D6EB",
  diaryCareBg: "#403126",
  diaryCareInk: "#E8C3A1",
  danger: "#FFB4AB",
  dangerSoft: "#3A2325",
};
interface Settings {
  ready: boolean;
  onboardingComplete: boolean;
  finishOnboarding(): Promise<void>;
  locale: Locale;
  theme: ThemePreference;
  colors: typeof light;
  dark: boolean;
  setLocale(value: Locale): Promise<void>;
  setTheme(value: ThemePreference): Promise<void>;
}
const Context = createContext<Settings>(null!);
export const useSettings = () => useContext(Context);
export function SettingsProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<Locale>("en");
  const [theme, setThemeState] = useState<ThemePreference>("system");
  useEffect(() => {
    void (async () => {
      let entries: readonly (readonly [string, string | null])[] = [];
      try {
        entries = await AsyncStorage.multiGet([
          "app-language",
          "app-theme",
          "app-onboarding-v1",
        ]);
      } catch {
        /* Device defaults remain usable. */
      }
      const saved = Object.fromEntries(entries);
      const lang = resolveLocale(
        saved["app-language"],
        getLocales().map((l) => l.languageTag),
      );
      setOnboardingComplete(saved["app-onboarding-v1"] === "done");
      applyLocale(lang);
      setLanguage(lang);
      if (saved["app-theme"] === "light" || saved["app-theme"] === "dark")
        setThemeState(saved["app-theme"]);
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (ready) Appearance.setColorScheme(theme === "system" ? "auto" : theme);
  }, [ready, theme]);
  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  return (
    <Context.Provider
      value={{
        ready,
        onboardingComplete,
        async finishOnboarding() {
          await AsyncStorage.setItem("app-onboarding-v1", "done");
          setOnboardingComplete(true);
        },
        locale: language,
        theme,
        colors: isDark ? dark : light,
        dark: isDark,
        async setLocale(value) {
          await AsyncStorage.setItem("app-language", value);
          applyLocale(value);
          setLanguage(value);
        },
        async setTheme(value) {
          await AsyncStorage.setItem("app-theme", value);
          setThemeState(value);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
