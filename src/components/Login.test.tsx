import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Login from "../../app/login";
import { applyLocale } from "@/i18n";

const mockSend = jest.fn();
const mockVerify = jest.fn();
jest.mock("expo-router", () => ({ usePreventRemove: jest.fn() }));
jest.mock("@/lib/supabase", () => ({ configured: true }));
jest.mock("@/providers/Auth", () => ({
  useAuth: () => ({ sendEmailOtp: mockSend, verifyEmailOtp: mockVerify }),
}));
jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({
    locale: "en",
    setLocale: jest.fn(),
    colors: {
      background: "#FCF8F5",
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

beforeEach(() => {
  jest.useFakeTimers();
  applyLocale("en");
  mockSend.mockReset().mockResolvedValue(undefined);
  mockVerify.mockReset().mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());

async function requestCode(email = " owner@example.com ") {
  await fireEvent.changeText(screen.getByTestId("email-input"), email);
  await fireEvent.press(screen.getByTestId("send-otp"));
}

it("validates email before sending and opens the OTP step for the exact trimmed address", async () => {
  await render(<Login />);
  await requestCode("bad");
  expect(mockSend).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeTruthy();
  await requestCode();
  expect(mockSend).toHaveBeenCalledWith("owner@example.com");
  expect(screen.getByText(/owner@example.com/)).toBeTruthy();
  expect(screen.getByTestId("verify-otp")).toBeDisabled();
  expect(screen.getByTestId("resend-otp")).toBeDisabled();
});

it("supports pasting a formatted code, manual confirmation, failure and retry", async () => {
  await render(<Login />);
  await requestCode();
  await fireEvent.changeText(screen.getByTestId("otp-input"), "248 619");
  expect(screen.getByTestId("otp-input").props.value).toBe("248619");
  expect(screen.getByTestId("verify-otp")).toBeEnabled();
  expect(mockVerify).not.toHaveBeenCalled();
  mockVerify.mockRejectedValueOnce(new Error("AUTH_OTP_INVALID"));
  await fireEvent.press(screen.getByTestId("verify-otp"));
  expect(screen.getByRole("alert")).toHaveTextContent(
    /incorrect or has expired/,
  );
  await fireEvent.changeText(screen.getByTestId("otp-input"), "123456");
  expect(screen.queryByRole("alert")).toBeNull();
  await fireEvent.press(screen.getByTestId("verify-otp"));
  expect(mockVerify).toHaveBeenLastCalledWith("owner@example.com", "123456");
});

it("enables resend after 60 seconds and clears the old code only on success", async () => {
  await render(<Login />);
  await requestCode();
  await fireEvent.changeText(screen.getByTestId("otp-input"), "123456");
  await act(() => jest.advanceTimersByTime(60_000));
  expect(screen.getByTestId("resend-otp")).toBeEnabled();
  mockSend.mockRejectedValueOnce(new Error("AUTH_NETWORK"));
  await fireEvent.press(screen.getByTestId("resend-otp"));
  expect(screen.getByTestId("otp-input").props.value).toBe("123456");
  expect(screen.getByRole("alert")).toHaveTextContent(/sign-in server/);
  await fireEvent.press(screen.getByTestId("resend-otp"));
  expect(mockSend).toHaveBeenCalledTimes(3);
  expect(screen.getByTestId("otp-input").props.value).toBe("");
  expect(screen.getByTestId("resend-otp")).toBeDisabled();
});

it("preserves the email when going back and does not bypass its resend cooldown", async () => {
  await render(<Login />);
  await requestCode("owner@example.com");
  await fireEvent.press(screen.getByTestId("change-email"));
  expect(screen.getByTestId("email-input").props.value).toBe(
    "owner@example.com",
  );
  await fireEvent.press(screen.getByTestId("send-otp"));
  expect(mockSend).toHaveBeenCalledTimes(1);
  await requestCode("other@example.com");
  expect(mockSend).toHaveBeenLastCalledWith("other@example.com");
  await fireEvent.changeText(screen.getByTestId("otp-input"), "123456");
  await fireEvent.press(screen.getByTestId("verify-otp"));
  expect(mockVerify).toHaveBeenCalledWith("other@example.com", "123456");
});

it("blocks duplicate verification and changing email while verifying", async () => {
  let finish!: () => void;
  mockVerify.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  await render(<Login />);
  await requestCode();
  await fireEvent.changeText(screen.getByTestId("otp-input"), "123456");
  await fireEvent.press(screen.getByTestId("verify-otp"));
  await fireEvent.press(screen.getByTestId("verify-otp"));
  expect(mockVerify).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("change-email")).toBeDisabled();
  await act(() => finish());
});

it("keeps the email step usable after send failure", async () => {
  applyLocale("ru");
  mockSend.mockRejectedValueOnce(new Error("AUTH_SEND_FAILED"));
  await render(<Login />);
  await requestCode();
  expect(screen.queryByTestId("otp-input")).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent(
    /Не удалось отправить код/,
  );
  await fireEvent.press(screen.getByTestId("send-otp"));
  expect(screen.getByText("Код из письма")).toBeTruthy();
});
