import { render, screen, fireEvent } from "@testing-library/react-native";
import Onboarding from "../../app/onboarding";
import { applyLocale } from "@/i18n";
const mockFinish = jest.fn();
jest.mock("expo-router", () => ({ usePreventRemove: jest.fn() }));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    finishOnboarding: mockFinish,
    colors: {
      text: "#252525",
      surface: "#fff",
      border: "#ddd",
      soft: "#eee",
      action: "#252525",
      onAction: "#fff",
      muted: "#666",
      danger: "#b00",
    },
  }),
}));
beforeEach(() => {
  applyLocale("en");
  mockFinish.mockReset();
  mockFinish.mockResolvedValue(undefined);
});
it("advances through all three slides, allows going back and finishes on the last slide", async () => {
  await render(<Onboarding />);
  expect(screen.getByLabelText("Page 1 of 3")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Page 2 of 3")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Page 1 of 3")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Page 3 of 3")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Get started" }));
  expect(mockFinish).toHaveBeenCalledTimes(1);
});
it("lets an existing user skip directly to sign-in", async () => {
  await render(<Onboarding />);
  await fireEvent.press(screen.getByTestId("skip-onboarding"));
  expect(mockFinish).toHaveBeenCalledTimes(1);
});
