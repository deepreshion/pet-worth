import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react-native";
import { PetDetailView } from "./PetDetailView";
import { applyLocale } from "@/i18n";
import { router } from "expo-router";
import { pickPhoto } from "@/platform/files";
import type { MedicalEvent, PetSummary } from "@/types/domain";
const mockUpload = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
  },
}));
jest.mock("@/hooks/queries", () => ({
  useUploadPetPhoto: () => ({ mutateAsync: mockUpload }),
}));
jest.mock("@/platform/files", () => ({ pickPhoto: jest.fn() }));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      background: "#FCF8F5",
      surface: "#fff",
      soft: "#F4E6DC",
      text: "#252525",
      muted: "#686260",
      action: "#252525",
      onAction: "#fff",
      border: "#ddd",
      danger: "#b00",
    },
  }),
}));
const pet: PetSummary = {
  id: "ray",
  familyId: "family",
  name: "Ray",
  species: "dog",
  breed: null,
  sex: null,
  birthDate: null,
  birthDateApproximate: false,
  photoPath: null,
  photoUrl: null,
  latestWeightKg: null,
  canEdit: true,
};
const event = {
  id: "vax",
  title: "Vaccine",
  petId: "ray",
  type: "vaccination",
  eventDate: "2020-01-01",
  eventTime: null,
  attachments: [],
} as unknown as MedicalEvent;
const query = (data: MedicalEvent[] = []) => ({
  data,
  isPending: false,
  isError: false,
  refetch: jest.fn(),
});
beforeEach(() => {
  jest.clearAllMocks();
  applyLocale("en");
});
it("shows empty state, missing data and existing creation route", async () => {
  await render(<PetDetailView pet={pet} events={query()} />);
  expect(screen.getByText("Their story starts here")).toBeTruthy();
  expect(
    screen.getByText("Age not specified · Weight not provided"),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Add the first event" }),
  );
  expect(router.push).toHaveBeenCalledWith("/pets/ray/medical-events/new");
  await fireEvent.press(screen.getByRole("tab", { name: "Documents" }));
  expect(screen.getByText("No documents yet")).toBeTruthy();
});
it("hides write actions for viewers", async () => {
  await render(
    <PetDetailView pet={{ ...pet, canEdit: false }} events={query()} />,
  );
  expect(screen.queryByRole("button", { name: "Add a photo" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit pet" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Add the first event" }),
  ).toBeNull();
});
it("filters events and retains selection across tabs", async () => {
  await render(<PetDetailView pet={pet} events={query([event])} />);
  await fireEvent.press(screen.getByRole("radio", { name: "Tests" }));
  expect(screen.getByText("No events of this type")).toBeTruthy();
  await fireEvent.press(screen.getByRole("tab", { name: "Documents" }));
  await fireEvent.press(screen.getByRole("tab", { name: "Events" }));
  expect(
    screen.getByRole("radio", { name: "Tests" }).props.accessibilityState
      .checked,
  ).toBe(true);
});
it("handles cancellation and invalid photos without uploading", async () => {
  jest
    .mocked(pickPhoto)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({
      uri: "file://bad",
      name: "bad.gif",
      mimeType: "image/gif",
      size: 1,
    });
  await render(<PetDetailView pet={pet} events={query()} />);
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await waitFor(() => expect(pickPhoto).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(mockUpload).not.toHaveBeenCalled();
});
it("retries failed photo upload and guards concurrent selection", async () => {
  const photo = {
    uri: "file://ok",
    name: "ok.jpg",
    mimeType: "image/jpeg",
    size: 100,
  };
  jest.mocked(pickPhoto).mockResolvedValue(photo);
  mockUpload
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(undefined);
  await render(<PetDetailView pet={pet} events={query()} />);
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(2));
  expect(mockUpload).toHaveBeenLastCalledWith({
    petId: "ray",
    familyId: "family",
    photo,
  });
  let resolve!: (value: undefined) => void;
  jest.mocked(pickPhoto).mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  expect(pickPhoto).toHaveBeenCalledTimes(3);
  resolve(undefined);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Add a photo" }).props
        .accessibilityState.disabled,
    ).toBe(false),
  );
});
it("keeps profile visible when events fail and retries independently", async () => {
  const failed = { ...query(), isError: true };
  await render(<PetDetailView pet={pet} events={failed} />);
  expect(screen.getByText("Ray")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(failed.refetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Their story starts here")).toBeNull();
});
it("shows document count independently of the event filter", async () => {
  const withFile = {
    ...event,
    attachments: [
      {
        id: "a",
        eventId: event.id,
        fileName: "Test.pdf",
        mediaType: "application/pdf",
        sizeBytes: 1000,
        storagePath: "private",
      },
    ],
  };
  await render(<PetDetailView pet={pet} events={query([withFile])} />);
  await fireEvent.press(screen.getByRole("radio", { name: "Tests" }));
  await fireEvent.press(screen.getByRole("tab", { name: "Documents" }));
  expect(screen.getByText("1 file")).toBeTruthy();
  expect(screen.getByText("Test.pdf")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add an event" })).toBeNull();
});
it("shows photo upload progress until the upload finishes", async () => {
  let complete!: () => void;
  mockUpload.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
  );
  jest.mocked(pickPhoto).mockResolvedValueOnce({
    uri: "file://photo",
    name: "photo.jpg",
    mimeType: "image/jpeg",
    size: 100,
  });
  await render(<PetDetailView pet={pet} events={query()} />);
  await fireEvent.press(screen.getByRole("button", { name: "Add a photo" }));
  await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1));
  expect(
    screen.getByRole("progressbar", { name: "Uploading photo…" }),
  ).toBeTruthy();
  complete();
  await waitFor(() =>
    expect(
      screen.queryByRole("progressbar", { name: "Uploading photo…" }),
    ).toBeNull(),
  );
});
it("fully hides the photo at the docking point and restores it on reverse scroll", async () => {
  await render(
    <PetDetailView
      pet={{ ...pet, photoUrl: "https://example.test/photo.jpg" }}
      events={query([event])}
    />,
  );
  const list = screen.getByTestId("pet-detail-list");
  await fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 232 } } });
  expect(
    require("react-native").StyleSheet.flatten(
      screen.getByTestId("pet-photo-hero").props.style,
    ).opacity,
  ).toBe(0);
  await fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 0 } } });
  expect(
    require("react-native").StyleSheet.flatten(
      screen.getByTestId("pet-photo-hero").props.style,
    ).opacity,
  ).toBe(1);
});
it("uses event skeletons while retaining loaded pet information", async () => {
  await render(
    <PetDetailView pet={pet} events={{ ...query(), isPending: true }} />,
  );
  expect(screen.getByText("Ray")).toBeTruthy();
  expect(screen.getByRole("progressbar", { name: "Loading" })).toBeTruthy();
  expect(screen.queryByText("Their story starts here")).toBeNull();
});

it("keeps only navigation and name in the sticky header and clips corners at the bottom", async () => {
  await render(<PetDetailView pet={pet} events={query([event])} />);
  const header = within(screen.getByTestId("pet-detail-header"));
  expect(header.getByText("Ray")).toBeTruthy();
  expect(header.queryByText("Breed not specified")).toBeNull();
  expect(header.queryByRole("tab", { name: "Events" })).toBeNull();
  expect(screen.getByRole("tab", { name: "Events" })).toBeTruthy();
  const list = screen.getByTestId("pet-detail-list");
  await fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 1000 } } });
  expect(header.getByRole("button", { name: "Back" })).toBeTruthy();
  const style = require("react-native").StyleSheet.flatten(list.props.style);
  expect(style).toMatchObject({ borderRadius: 32, overflow: "hidden" });
});
