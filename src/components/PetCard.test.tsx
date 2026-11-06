import { render, screen, fireEvent } from "@testing-library/react-native";
import { PetCard } from "./PetCard";
import { applyLocale } from "@/i18n";
import type { PetSummary } from "@/types/domain";
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      text: "#252525",
      surface: "#fff",
      border: "#ddd",
      soft: "#eee",
      action: "#252525",
      onAction: "#fff",
      muted: "#666",
    },
  }),
}));
const pet: PetSummary = {
  id: "p",
  familyId: "f",
  name: "Luna",
  species: "cat",
  breed: null,
  sex: null,
  birthDate: null,
  birthDateApproximate: false,
  photoPath: null,
  photoUrl: null,
  latestWeightKg: null,
  canEdit: true,
};
beforeEach(() => {
  applyLocale("en");
  mockPush.mockReset();
});
it("renders usable list rows without photo, breed or age and opens details", async () => {
  await render(<PetCard pet={pet} variant="list" />);
  expect(screen.getByText("Breed unknown")).toBeTruthy();
  expect(screen.getByText("Age unknown")).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Open Luna’s profile" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/pets/p");
});
it("targets the selected pet when creating an event and respects edit permissions", async () => {
  const view = await render(<PetCard pet={pet} />);
  await fireEvent.press(screen.getByRole("button", { name: "Add an event" }));
  expect(mockPush).toHaveBeenCalledWith("/pets/p/medical-events/new");
  await view.rerender(<PetCard pet={{ ...pet, canEdit: false }} />);
  expect(screen.queryByRole("button", { name: "Add an event" })).toBeNull();
});
