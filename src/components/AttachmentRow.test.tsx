import { Alert } from "react-native";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { AttachmentRow } from "./AttachmentRow";
import { applyLocale } from "@/i18n";
import {
  downloadAttachment,
  shareAttachment,
  openPdf,
  freshAttachmentUrl,
} from "@/platform/files";
jest.mock("expo-router", () => ({ usePreventRemove: jest.fn() }));
const attachment = {
  id: "a",
  eventId: "e",
  storagePath: "private",
  fileName: "Result.pdf",
  mediaType: "application/pdf",
  sizeBytes: 860160,
};
jest.mock("@/platform/files", () => ({
  downloadAttachment: jest.fn(),
  shareAttachment: jest.fn(),
  openPdf: jest.fn(),
  freshAttachmentUrl: jest.fn(),
}));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      text: "#222",
      surface: "#fff",
      soft: "#eee",
      muted: "#666",
      danger: "#b00",
    },
  }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  applyLocale("en");
});
it("opens PDF and provides download/share actions with event context", async () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  await render(
    <AttachmentRow
      attachment={attachment}
      compact
      eventTitle="Blood test"
      eventDate="2026-10-01"
    />,
  );
  expect(screen.getByText(/Blood test/)).toBeTruthy();
  expect(screen.getByText("PDF · 840 KB")).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Open: Result.pdf" }),
  );
  await waitFor(() => expect(openPdf).toHaveBeenCalledWith(attachment));
  await fireEvent.press(
    screen.getByRole("button", { name: "Document actions: Result.pdf" }),
  );
  const actions = alert.mock.calls[0][2]!;
  expect(actions.map((a) => a.text)).toEqual(["Download", "Share", "Cancel"]);
  actions[0].onPress?.();
  await waitFor(() =>
    expect(downloadAttachment).toHaveBeenCalledWith(attachment),
  );
  await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
  actions[1].onPress?.();
  await waitFor(() => expect(shareAttachment).toHaveBeenCalledWith(attachment));
  alert.mockRestore();
});
it("opens image preview and handles expired-link errors locally", async () => {
  jest
    .mocked(freshAttachmentUrl)
    .mockRejectedValueOnce(new Error("FILE_LINK"))
    .mockResolvedValueOnce("https://example.test/photo.jpg");
  const image = {
    ...attachment,
    fileName: "Photo.jpg",
    mediaType: "image/jpeg",
  };
  await render(<AttachmentRow attachment={image} compact />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Open: Photo.jpg" }),
  );
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  await fireEvent.press(
    screen.getByRole("button", { name: "Open: Photo.jpg" }),
  );
  await waitFor(() => expect(screen.getByLabelText("Photo.jpg")).toBeTruthy());
  await fireEvent.press(screen.getByRole("button", { name: "Close" }));
  expect(openPdf).not.toHaveBeenCalled();
});

it("shows a local loader while opening a document and keeps other documents usable", async () => {
  let finish!: () => void;
  jest.mocked(openPdf).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const second = { ...attachment, id: "b", fileName: "Second.pdf" };
  await render(
    <>
      <AttachmentRow attachment={attachment} compact />
      <AttachmentRow attachment={second} compact />
    </>,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Open: Result.pdf" }),
  );
  expect(screen.getByRole("progressbar", { name: "Loading" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Open: Result.pdf" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Open: Second.pdf" }),
  ).not.toBeDisabled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Open: Second.pdf" }),
  );
  expect(openPdf).toHaveBeenCalledWith(second);
  finish();
  await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  expect(
    screen.getByRole("button", { name: "Open: Result.pdf" }),
  ).not.toBeDisabled();
});
