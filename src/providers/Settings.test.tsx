import { render, screen, fireEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsProvider, useSettings } from "./Settings";
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US" }],
}));
function Probe() {
  const settings = useSettings();
  if (!settings.ready) return <Text>Loading</Text>;
  return (
    <>
      <Text>{settings.onboardingComplete ? "Complete" : "First run"}</Text>
      <Pressable onPress={() => void settings.finishOnboarding()}>
        <Text>Finish</Text>
      </Pressable>
      <Text>{settings.locale}</Text>
    </>
  );
}
beforeEach(async () => {
  await AsyncStorage.clear();
});
it("persists completion independently of language and restores it on remount", async () => {
  await AsyncStorage.setItem("app-language", "ru");
  const view = await render(
    <SettingsProvider>
      <Probe />
    </SettingsProvider>,
  );
  await screen.findByText("First run");
  expect(screen.getByText("ru")).toBeTruthy();
  await fireEvent.press(screen.getByText("Finish"));
  await screen.findByText("Complete");
  expect(await AsyncStorage.getItem("app-onboarding-v1")).toBe("done");
  await view.unmount();
  await render(
    <SettingsProvider>
      <Probe />
    </SettingsProvider>,
  );
  await screen.findByText("Complete");
  expect(screen.getByText("ru")).toBeTruthy();
});
it("keeps the first-run fallback usable if storage cannot be read", async () => {
  jest
    .spyOn(AsyncStorage, "multiGet")
    .mockRejectedValueOnce(new Error("storage"));
  await render(
    <SettingsProvider>
      <Probe />
    </SettingsProvider>,
  );
  await screen.findByText("First run");
  expect(screen.getByText("en")).toBeTruthy();
});
