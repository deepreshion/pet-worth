import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ErrorText, T } from "./ui";
import { NoticeProvider } from "@/providers/Notices";
import { applyLocale } from "@/i18n";
jest.mock("expo-router", () => ({ usePreventRemove: jest.fn() }));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: { text: "#222", surface: "#fff", danger: "#b00" },
  }),
}));
beforeEach(() => applyLocale("en"));
it("shows operational errors in a dismissible bottom modal, leaving content intact", async () => {
  const error = new Error("PHOTO_PERMISSION");
  await render(
    <NoticeProvider>
      <T>Profile content</T>
      <ErrorText error={error} />
    </NoticeProvider>,
  );
  expect(screen.getByRole("alert").props.children).toBe(
    "Could not open photos. Check photo permissions in Settings.",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Dismiss message" }),
  );
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(screen.getByText("Profile content")).toBeTruthy();
});
it("keeps an operation warning visible after its originating screen unmounts", async () => {
  const error = new Error("PHOTO_TOO_LARGE");
  const { rerender } = await render(
    <NoticeProvider>
      <ErrorText error={error} />
    </NoticeProvider>,
  );
  await rerender(
    <NoticeProvider>
      <T>Next screen</T>
    </NoticeProvider>,
  );
  expect(screen.getByRole("alert")).toBeTruthy();
  await fireEvent.press(
    screen.getByRole("button", { name: "Dismiss message" }),
  );
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
it("allows the same error to be displayed again after retry", async () => {
  const { rerender } = await render(<ErrorText error="PHOTO_PERMISSION" />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Dismiss message" }),
  );
  await rerender(<ErrorText error={undefined} />);
  await rerender(<ErrorText error="PHOTO_PERMISSION" />);
  expect(screen.getByRole("alert")).toBeTruthy();
});
