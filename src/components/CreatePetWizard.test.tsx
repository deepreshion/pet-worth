import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";

import { applyLocale } from "@/i18n";
import { CreatePetWizard } from "./CreatePetWizard";
const mockSave = jest.fn();
const mockPick = jest.fn();
const mockReplace = jest.fn();
const mockPrevent = jest.fn();
jest.mock("@/hooks/queries", () => ({
  useSavePet: () => ({ mutateAsync: mockSave, isPending: false }),
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
      danger: "#b00",
    },
  }),
}));
jest.mock("@/platform/files", () => ({ pickPhoto: () => mockPick() }));
jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  },
  usePreventRemove: (...args: unknown[]) => mockPrevent(...args),
}));
jest.mock("./DateField", () => ({ DateField: () => null }));
async function next() {
  await fireEvent.press(screen.getByRole("button", { name: "Next" }));
}
async function reachAge() {
  await fireEvent.changeText(screen.getByLabelText("Pet name"), "Ray");
  await next();
  await next();
}
beforeEach(() => {
  applyLocale("en");
  mockSave.mockReset();
  mockPick.mockReset();
  mockReplace.mockReset();
  mockPrevent.mockReset();
});
it("validates name before advancing and keeps values when going back", async () => {
  await render(<CreatePetWizard />);
  await next();
  expect(screen.getByLabelText("Pet name")).toBeTruthy();
  expect(mockSave).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText("Pet name"), "Ray");
  await next();
  await fireEvent.changeText(screen.getByLabelText("Breed"), "Retriever");
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Pet name").props.value).toBe("Ray");
  await next();
  expect(screen.getByLabelText("Breed").props.value).toBe("Retriever");
});
it("saves unknown age, accepts a decimal comma and prevents duplicate requests", async () => {
  let finish!: (v: unknown) => void;
  mockSave.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await render(<CreatePetWizard />);
  await reachAge();
  await fireEvent.changeText(screen.getByLabelText("Weight, kg"), "4,5");
  await fireEvent.press(screen.getByRole("button", { name: "Add a pet" }));
  await fireEvent.press(screen.getByRole("button", { name: "Add a pet" }));
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "Ray",
      weightKg: 4.5,
      birthDate: undefined,
      birthDateApproximate: false,
    }),
  );
  finish({ petId: "p", photoUploadFailed: false });
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/pets/p"));
});
it("validates approximate age and retains data and request id for a retry", async () => {
  mockSave
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ petId: "p", photoUploadFailed: false });
  await render(<CreatePetWizard />);
  await reachAge();
  await fireEvent.press(screen.getByRole("radio", { name: "Approximate" }));
  await fireEvent.press(screen.getByRole("button", { name: "Add a pet" }));
  expect(mockSave).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText("Years"), "4");
  await fireEvent.press(screen.getByRole("button", { name: "Add a pet" }));
  await screen.findByText(
    "Could not save your pet. Check your connection and try again.",
  );
  expect(screen.getByLabelText("Years").props.value).toBe("4");
  await fireEvent.press(screen.getByRole("button", { name: "Add a pet" }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(mockSave.mock.calls[0][0].requestId).toBe(
    mockSave.mock.calls[1][0].requestId,
  );
  expect(mockSave.mock.calls[1][0].birthDateApproximate).toBe(true);
});
it("allows replacing and removing a selected photo", async () => {
  mockPick.mockResolvedValue({
    uri: "file://cat.jpg",
    name: "cat.jpg",
    mimeType: "image/jpeg",
    size: 100,
  });
  await render(<CreatePetWizard />);
  await fireEvent.press(
    screen.getAllByRole("button", { name: "Choose from gallery" })[0],
  );
  await screen.findByText("Photo");
  await fireEvent.press(screen.getByRole("button", { name: "Replace" }));
  expect(mockPick).toHaveBeenCalledTimes(2);
  await fireEvent.press(screen.getByRole("button", { name: "Delete" }));
  expect(screen.queryByText("Photo")).toBeNull();
});
it.each(["button", "sheet dismissal"])(
  "cancels discarding dirty data via %s",
  async (method) => {
    await render(<CreatePetWizard />);
    await fireEvent.changeText(screen.getByLabelText("Pet name"), "Ray");
    const [dirty, callback] = mockPrevent.mock.calls.at(-1)!;
    expect(dirty).toBe(true);
    const repeat = jest.fn();
    await act(() => callback({ repeat }));
    expect(screen.getByText("Leave without saving?")).toBeTruthy();
    if (method === "sheet dismissal") {
      await fireEvent(screen.getByText("Leave without saving?"), "close");
    } else {
      await fireEvent.press(
        screen.getByRole("button", { name: "Keep editing" }),
      );
    }
    expect(screen.queryByText("Leave without saving?")).toBeNull();
    expect(screen.getByLabelText("Pet name").props.value).toBe("Ray");
    expect(repeat).not.toHaveBeenCalled();
  },
);
