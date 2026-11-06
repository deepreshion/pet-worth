import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { DiscardChanges } from "./FormLayout";
import { PetForm } from "./PetForm";
import { MedicalEventForm } from "./MedicalEventForm";
import { applyLocale } from "@/i18n";
import type { PetSummary } from "@/types/domain";
const mockSave = jest.fn();

it("dismissing the discard confirmation does not discard the form", async () => {
  const discard = jest.fn();
  const onClose = jest.fn();
  await render(
    <DiscardChanges
      action={discard}
      onClose={onClose}
      description="Unsaved data"
    />,
  );
  await fireEvent(screen.getByText("Leave without saving?"), "close");
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(discard).not.toHaveBeenCalled();
});
jest.mock("@/platform/reminderPermission", () => ({
  requestReminderPermission: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/hooks/queries", () => ({
  useSavePet: () => ({ mutateAsync: mockSave, isPending: false }),
  useSaveEvent: () => ({ mutateAsync: mockSave, isPending: false }),
}));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      text: "#171717",
      surface: "#fff",
      border: "#ddd",
      soft: "#eee",
      action: "#171717",
      onAction: "#fff",
      danger: "#b00",
    },
  }),
}));
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  usePreventRemove: jest.fn(),
}));
jest.mock("@/platform/files", () => ({
  pickPhoto: jest.fn(),
  pickDocuments: jest.fn(),
}));
jest.mock("./DateField", () => ({ DateField: () => null }));
const pet: PetSummary = {
  id: "p",
  familyId: "f",
  name: "Сеня",
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
  mockSave.mockReset();
});
it("submits a real native pet edit and prevents duplicate in-flight saves", async () => {
  let finish!: (value: unknown) => void;
  mockSave.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await render(<PetForm pet={pet} />);
  await fireEvent.changeText(screen.getByLabelText("Name *"), "Сеня II");
  await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
  await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ id: "p", name: "Сеня II" }),
  );
  finish({ petId: "p", photoUploadFailed: false });
  await waitFor(() =>
    expect(require("expo-router").router.replace).toHaveBeenCalledWith(
      "/pets/p",
    ),
  );
});
it("does not submit an empty event title", async () => {
  await render(
    <MedicalEventForm
      pet={pet}
      timezone="UTC"
      event={{
        id: "e",
        petId: "p",
        familyId: "f",
        petName: "Сеня",
        petPhotoUrl: null,
        createdBy: "u",
        type: "analysis",
        title: "",
        notes: null,
        eventDate: "2099-01-01",
        eventTime: null,
        eventTimezone: "UTC",
        createdAt: "",
        updatedAt: "",
        canEdit: true,
        attachments: [],
        reminder: null,
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save event" }));
  expect(mockSave).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.getAllByText("Enter a title").length).toBeGreaterThan(0),
  );
});
it("keeps pet save disabled until a value changes", async () => {
  await render(<PetForm pet={pet} />);
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText("Name *"), "Рэй");
  expect(
    screen.getByRole("button", { name: "Save changes" }),
  ).not.toBeDisabled();
});

it("creates an event from a single form and keeps the same request after a failure", async () => {
  mockSave.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({
    eventId: "new",
    attachmentWarnings: [],
    cleanupWarnings: [],
    reminderWarning: false,
  });
  await render(<MedicalEventForm pet={pet} timezone="UTC" />);
  await fireEvent.changeText(
    screen.getByLabelText("Event title"),
    "  Annual checkup  ",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add a note" }));
  await fireEvent.changeText(screen.getByLabelText("Notes"), "Bring passport");
  await fireEvent.press(screen.getByRole("button", { name: "Save event" }));
  await waitFor(() =>
    expect(screen.getByText("Could not save")).toBeOnTheScreen(),
  );
  expect(screen.getByLabelText("Event title")).toHaveProp(
    "value",
    "  Annual checkup  ",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(2));
  expect(mockSave.mock.calls[0][0]).toEqual(mockSave.mock.calls[1][0]);
  expect(mockSave.mock.calls[1][0]).toEqual(
    expect.objectContaining({
      title: "Annual checkup",
      notes: "Bring passport",
      reminderEnabled: false,
    }),
  );
  await waitFor(() =>
    expect(require("expo-router").router.replace).toHaveBeenCalledWith({
      pathname: "/medical-events/[id]",
      params: { id: "new", saved: "1" },
    }),
  );
});

it("does not lose event fields when the date dialog is cancelled", async () => {
  await render(<MedicalEventForm pet={pet} timezone="UTC" />);
  await fireEvent.changeText(
    screen.getByLabelText("Event title"),
    "Vaccination",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Event date" }));
  await fireEvent.press(screen.getByRole("button", { name: "Tomorrow" }));
  const closeButtons = screen.getAllByRole("button", { name: "Close" });
  await fireEvent.press(closeButtons[closeButtons.length - 1]);
  expect(screen.getByLabelText("Event title")).toHaveProp(
    "value",
    "Vaccination",
  );
  expect(mockSave).not.toHaveBeenCalled();
});

it("keeps a selected document after a save error", async () => {
  const file = {
    uri: "file:///passport.pdf",
    name: "passport.pdf",
    mimeType: "application/pdf",
    size: 1024,
  };
  require("@/platform/files").pickDocuments.mockResolvedValue([file]);
  mockSave.mockRejectedValue(new Error("offline"));
  await render(<MedicalEventForm pet={pet} timezone="UTC" />);
  await fireEvent.changeText(screen.getByLabelText("Event title"), "Checkup");
  await fireEvent.press(
    screen.getByRole("button", { name: "Add a photo or PDF" }),
  );
  await waitFor(() =>
    expect(screen.getByText("passport.pdf")).toBeOnTheScreen(),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save event" }));
  await waitFor(() =>
    expect(screen.getByText("Could not save")).toBeOnTheScreen(),
  );
  expect(screen.getByText("passport.pdf")).toBeOnTheScreen();
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ files: [file] }),
  );
});

it("handles a document read failure and allows selecting a PDF again", async () => {
  const picker = require("@/platform/files").pickDocuments;
  picker.mockRejectedValueOnce(
    new Error("Missing 'READ' permission for accessing the file."),
  );
  await render(<MedicalEventForm pet={pet} timezone="UTC" />);
  await fireEvent.changeText(screen.getByLabelText("Event title"), "Checkup");
  await fireEvent.press(
    screen.getByRole("button", { name: "Add a photo or PDF" }),
  );
  await waitFor(() =>
    expect(screen.getByText("Could not save")).toBeOnTheScreen(),
  );
  expect(screen.getByLabelText("Event title")).toHaveProp("value", "Checkup");
  picker.mockResolvedValueOnce([
    {
      uri: "file:///cache/passport.pdf",
      name: "passport.pdf",
      mimeType: "application/pdf",
      size: 1024,
    },
  ]);
  await fireEvent.press(
    screen.getByRole("button", { name: "Add a photo or PDF" }),
  );
  await waitFor(() =>
    expect(screen.getByText("passport.pdf")).toBeOnTheScreen(),
  );
});

it("shows reminders enabled for future dates and clears them when returning to today", async () => {
  mockSave.mockResolvedValue({
    eventId: "new",
    attachmentWarnings: [],
    cleanupWarnings: [],
    reminderWarning: false,
  });
  await render(<MedicalEventForm pet={pet} timezone="UTC" />);
  const reminder = "Remind me 24 hours before";
  expect(screen.queryByRole("switch", { name: reminder })).toBeNull();
  const chooseDay = async (day: "Today" | "Tomorrow") => {
    await fireEvent.press(screen.getByRole("button", { name: "Event date" }));
    await fireEvent.press(screen.getByRole("button", { name: day }));
    await fireEvent.press(screen.getByRole("button", { name: /^Choose / }));
  };
  await chooseDay("Tomorrow");
  expect(screen.getByRole("switch", { name: reminder })).toHaveProp(
    "value",
    true,
  );
  await fireEvent(
    screen.getByRole("switch", { name: reminder }),
    "valueChange",
    false,
  );
  await chooseDay("Tomorrow");
  expect(screen.getByRole("switch", { name: reminder })).toHaveProp(
    "value",
    false,
  );
  await chooseDay("Today");
  expect(screen.queryByRole("switch", { name: reminder })).toBeNull();
  await chooseDay("Tomorrow");
  expect(screen.getByRole("switch", { name: reminder })).toHaveProp(
    "value",
    true,
  );
  await chooseDay("Today");
  await fireEvent.changeText(screen.getByLabelText("Event title"), "Checkup");
  await fireEvent.press(screen.getByRole("button", { name: "Save event" }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ reminderEnabled: false }),
    ),
  );
});
