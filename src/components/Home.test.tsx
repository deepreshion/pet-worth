import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text as MockText, Pressable as MockPressable } from "react-native";
import Home from "../../app/(app)/(tabs)/index";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { applyLocale } from "@/i18n";
import { formatEventDayHeading } from "@/presentation/medicalEvents";
const mockPush = jest.fn();
const mockPets = [
  { id: "ray", name: "Ray", species: "dog", photoUrl: null, canEdit: true },
  { id: "luna", name: "Luna", species: "cat", photoUrl: null, canEdit: false },
];
const mockEvents = [
  {
    id: "1",
    petId: "ray",
    title: "Ray event",
    eventDate: "2099-11-07",
    eventTime: "11:00",
  },
  {
    id: "2",
    petId: "luna",
    title: "Luna event",
    eventDate: "2099-11-08",
    eventTime: "11:00",
  },
];
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock("@/hooks/queries", () => ({
  usePets: () => ({ data: mockPets, isPending: false, isError: false }),
  useEvents: () => ({ data: mockEvents, isPending: false, isError: false }),
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

jest.mock("./Brand", () => ({ Brand: () => null }));
jest.mock("./EventRow", () => ({
  EventRow: ({ event }: { event: { title: string } }) => (
    <MockText>{event.title}</MockText>
  ),
}));
jest.mock("./EventCalendar", () => ({
  EventCalendar: ({
    selected,
    onSelect,
    events,
  }: {
    selected: string | null;
    onSelect(v: string | null): void;
    events: { id: string }[];
  }) => (
    <>
      <MockText>{selected || "No selected day"}</MockText>
      <MockText>Calendar events: {events.map((e) => e.id).join(",")}</MockText>
      <MockPressable
        accessibilityRole="button"
        onPress={() => onSelect(selected ? null : "2099-11-07")}
      >
        <MockText>Select day</MockText>
      </MockPressable>
      <MockPressable
        accessibilityRole="button"
        onPress={() => onSelect("2099-11-13")}
      >
        <MockText>Select empty day</MockText>
      </MockPressable>
    </>
  ),
}));
it("switches both calendar and events to the selected pet and resets date selection", async () => {
  applyLocale("en");
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 62, bottom: 34, left: 0, right: 0 },
      }}
    >
      <Home />
    </SafeAreaProvider>,
  );
  expect(screen.getAllByText("Ray event")[0]).toBeTruthy();
  expect(screen.queryByText("Luna event")).toBeNull();
  expect(screen.getByText("Calendar events: 1")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Select day" }));
  expect(screen.getByText("2099-11-07")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Choose a pet" }));
  await fireEvent.press(screen.getByRole("button", { name: "Pet: Luna" }));
  expect(screen.getByText("No selected day")).toBeTruthy();
  expect(screen.getByText("Calendar events: 2")).toBeTruthy();
  expect(screen.queryByText("Ray event")).toBeNull();
  expect(screen.getAllByText("Luna event")[0]).toBeTruthy();
});

it("searches pets, closes without changing selection, and combines all events", async () => {
  applyLocale("en");
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 62, bottom: 34, left: 0, right: 0 },
      }}
    >
      <Home />
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Choose a pet" }));
  await fireEvent.changeText(screen.getByLabelText("Search by name"), "lUnA");
  expect(screen.queryByRole("button", { name: "Pet: Ray" })).toBeNull();
  expect(screen.getByRole("button", { name: "Pet: Luna" })).toBeTruthy();
  await fireEvent.press(screen.getAllByRole("button", { name: "Close" })[0]);
  expect(screen.getByText("Calendar events: 1")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Choose a pet" }));
  await fireEvent.press(screen.getByRole("button", { name: "All pets" }));
  expect(screen.getByText("Calendar events: 1,2")).toBeTruthy();
  expect(screen.getAllByText("Ray event").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Luna event").length).toBeGreaterThan(0);
  await fireEvent.press(screen.getByRole("button", { name: "Add an event" }));
  expect(screen.queryByRole("button", { name: "All pets" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Pet: Luna" })).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Pet: Ray" }));
  expect(mockPush).toHaveBeenCalledWith("/pets/ray/medical-events/new");
});

it("groups multiple events under one day heading and keeps the heading when filtering", async () => {
  applyLocale("en");
  mockEvents.push({
    id: "3",
    petId: "ray",
    title: "Second Ray event",
    eventDate: "2099-11-07",
    eventTime: "16:00",
  });
  try {
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 62, bottom: 34, left: 0, right: 0 },
        }}
      >
        <Home />
      </SafeAreaProvider>,
    );
    const heading = formatEventDayHeading("2099-11-07");
    expect(screen.getAllByText(heading)).toHaveLength(1);
    expect(screen.getByText("Second Ray event")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Choose a pet" }));
    await fireEvent.press(screen.getByRole("button", { name: "All pets" }));
    expect(screen.getByText(formatEventDayHeading("2099-11-08"))).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Select day" }));
    expect(screen.getAllByText(heading)).toHaveLength(1);
    expect(screen.queryByText(formatEventDayHeading("2099-11-08"))).toBeNull();
    expect(screen.getByText("Second Ray event")).toBeTruthy();
  } finally {
    mockEvents.pop();
  }
});

it("shows the selected pet's empty day and restores upcoming events", async () => {
  applyLocale("en");
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 62, bottom: 34, left: 0, right: 0 },
      }}
    >
      <Home />
    </SafeAreaProvider>,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Select empty day" }),
  );
  expect(screen.getByText("No events on this day")).toBeTruthy();
  expect(screen.getByText(formatEventDayHeading("2099-11-13"))).toBeTruthy();
  // The featured upcoming card stays visible; the filtered list is empty.
  expect(screen.getAllByText("Ray event")).toHaveLength(1);
  await fireEvent.press(screen.getByRole("button", { name: "Upcoming" }));
  expect(screen.getByText("No selected day")).toBeTruthy();
  expect(screen.queryByText("No events on this day")).toBeNull();
  expect(screen.getAllByText("Ray event")).toHaveLength(2);
});

it("shows an empty day for all pets and resets to their combined upcoming list", async () => {
  applyLocale("en");
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 62, bottom: 34, left: 0, right: 0 },
      }}
    >
      <Home />
    </SafeAreaProvider>,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Choose a pet" }));
  await fireEvent.press(screen.getByRole("button", { name: "All pets" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Select empty day" }),
  );
  expect(screen.getByText("No events on this day")).toBeTruthy();
  expect(screen.queryByText("Luna event")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Upcoming" }));
  expect(screen.getByText("Luna event")).toBeTruthy();
  expect(screen.queryByText("No events on this day")).toBeNull();
});
