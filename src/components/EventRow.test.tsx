import { render, screen, fireEvent } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SettingsProvider } from "@/providers/Settings";
import { EventRow } from "./EventRow";
import type { MedicalEvent, MedicalEventType } from "@/types/domain";
import { router } from "expo-router";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US" }],
}));
const event: MedicalEvent = {
  id: "event",
  petId: "ray",
  familyId: "family",
  petName: "Ray",
  petPhotoUrl: null,
  createdBy: "user",
  type: "vet_visit",
  title:
    "A long appointment title that must wrap without hiding the date or files",
  notes: "Bring the previous test results",
  eventDate: "2099-11-08",
  eventTime: "11:30:00",
  createdAt: "",
  updatedAt: "",
  eventTimezone: "Asia/Tbilisi",
  canEdit: false,
  attachments: [
    {
      id: "file",
      eventId: "event",
      storagePath: "",
      fileName: "test.pdf",
      mediaType: "application/pdf",
      sizeBytes: 100,
    },
  ],
  reminder: {
    id: "reminder",
    eventId: "event",
    scheduledAt: "",
    notificationId: 1,
  },
};
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
it.each([
  ["vet_visit", "Vet visit", "#EDE7F5", "#332C40"],
  ["vaccination", "Vaccination", "#E4EFE6", "#263A30"],
  ["analysis", "Lab test", "#E3EDF5", "#263747"],
  ["procedure", "Procedure", "#F6E9DE", "#403126"],
] as const)(
  "renders %s with themed category colors and live metadata",
  async (type, label, light, dark) => {
    await AsyncStorage.setItem("app-theme", "light");
    const view = await render(
      <SettingsProvider>
        <EventRow
          event={{ ...event, type: type as MedicalEventType }}
          variant="featured"
          showPet
        />
      </SettingsProvider>,
    );
    await screen.findByText(label);
    expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: light });
    expect(screen.getByText(event.title)).toBeTruthy();
    expect(screen.getByText(event.notes!)).toBeTruthy();
    expect(screen.getByText("1 file")).toBeTruthy();
    expect(screen.getByText("Reminder")).toBeTruthy();
    expect(screen.getByText("Ray")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button"));
    expect(router.push).toHaveBeenCalledWith("/medical-events/event");
    await view.unmount();
    await AsyncStorage.setItem("app-theme", "dark");
    await render(
      <SettingsProvider>
        <EventRow event={{ ...event, type }} variant="featured" />
      </SettingsProvider>,
    );
    await screen.findByText(label);
    expect(screen.getByRole("button")).toHaveStyle({ backgroundColor: dark });
  },
);
it("omits empty metadata and featured notes in grouped cards, localizing missing time", async () => {
  await AsyncStorage.setItem("app-language", "ru");
  await render(
    <SettingsProvider>
      <EventRow
        event={{ ...event, eventTime: null, attachments: [], reminder: null }}
        variant="home-list"
      />
    </SettingsProvider>,
  );
  await screen.findByText("Время не указано");
  expect(screen.queryByText(event.notes!)).toBeNull();
  expect(screen.queryByText("Напоминание")).toBeNull();
  expect(screen.queryByText("1 файл")).toBeNull();
  expect(screen.queryByText("Ray")).toBeNull();
});
