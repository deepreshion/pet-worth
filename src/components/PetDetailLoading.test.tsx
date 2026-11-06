import { render, screen, fireEvent } from "@testing-library/react-native";
import PetDetail from "../../app/(app)/pets/[id]/index";
import { applyLocale } from "@/i18n";
import { router } from "expo-router";
const mockPet = {
  isPending: true,
  isError: false,
  data: undefined,
  refetch: jest.fn(),
};
jest.mock("expo-router", () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: "ray" }),
}));
jest.mock("@/hooks/queries", () => ({
  usePet: () => mockPet,
  useEvents: () => ({ isPending: true }),
  useUploadPetPhoto: () => ({}),
}));
jest.mock("@/platform/files", () => ({}));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      background: "#FCF8F5",
      surface: "#fff",
      border: "#ddd",
      soft: "#F4E6DC",
      text: "#222",
    },
  }),
}));
it("shows a full-page skeleton with working back navigation while the pet loads", async () => {
  applyLocale("en");
  await render(<PetDetail />);
  expect(screen.getByRole("progressbar", { name: "Loading" })).toBeTruthy();
  expect(screen.queryByText("Could not load data")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalledTimes(1);
});
