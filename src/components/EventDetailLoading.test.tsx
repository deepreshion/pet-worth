import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import EventDetail from "../../app/(app)/medical-events/[id]/index";
import { applyLocale } from "@/i18n";

const mockQuery = {
  isPending: true,
  isError: false,
  data: undefined,
  refetch: jest.fn(),
};
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  router: {
    canGoBack: () => mockCanGoBack(),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: "event-1" }),
}));
jest.mock("@/hooks/queries", () => ({
  useEvent: () => mockQuery,
  useDeleteEvent: () => ({ isPending: false }),
}));
jest.mock("./AttachmentRow", () => ({ AttachmentRow: () => null }));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    colors: {
      background: "#F4F5F7",
      surface: "#fff",
      border: "#D8DEE6",
      text: "#24272C",
    },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.isPending = true;
  mockQuery.isError = false;
  mockCanGoBack.mockReturnValue(true);
  applyLocale("en");
});

it("shows a page skeleton and keeps back navigation available while loading", async () => {
  await render(<EventDetail />);
  expect(screen.getByRole("progressbar", { name: "Loading" })).toBeTruthy();
  expect(screen.getByRole("header", { name: "Event" })).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalledTimes(1);
});

it("can leave a directly opened event before its data loads", async () => {
  mockCanGoBack.mockReturnValue(false);
  await render(<EventDetail />);
  await fireEvent.press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/pets");
});

it("replaces the skeleton with a retry state when loading fails", async () => {
  const view = await render(<EventDetail />);
  mockQuery.isPending = false;
  mockQuery.isError = true;
  await view.rerender(<EventDetail />);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText("Could not load data")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(mockQuery.refetch).toHaveBeenCalledTimes(1);
});
