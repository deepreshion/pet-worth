import { completeMagicLink, sendEmailOtp, verifyEmailOtp } from "./Auth";
import { supabase } from "@/lib/supabase";
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}));
jest.mock("@/services/notifications", () => ({}));
jest.mock("@/services/profile", () => ({}));
jest.mock("@/services/storageCleanup", () => ({}));
jest.mock("@/platform/files", () => ({}));
jest.mock("@/lib/monitoring", () => ({}));
const exchange = supabase.auth.exchangeCodeForSession as jest.Mock;
beforeEach(() => exchange.mockReset());
it("exchanges concurrent and repeated callbacks only once", async () => {
  exchange.mockResolvedValue({ error: null });
  await Promise.all([completeMagicLink("one"), completeMagicLink("one")]);
  await completeMagicLink("one");
  expect(exchange).toHaveBeenCalledTimes(1);
});
it("allows an explicit retry after a failed exchange", async () => {
  exchange
    .mockResolvedValueOnce({ error: new Error("expired") })
    .mockResolvedValueOnce({ error: null });
  await expect(completeMagicLink("retry")).rejects.toThrow("expired");
  await completeMagicLink("retry");
  expect(exchange).toHaveBeenCalledTimes(2);
});

const send = supabase.auth.signInWithOtp as jest.Mock;
it("passes the native callback and trimmed email to Supabase", async () => {
  send.mockResolvedValue({ error: null });
  await sendEmailOtp(" owner@example.com ");
  expect(send).toHaveBeenCalledWith({
    email: "owner@example.com",
    options: {
      emailRedirectTo: "petworth://auth/callback",
      shouldCreateUser: true,
    },
  });
});
it("propagates network failures from the real send path as a sign-in error", async () => {
  send.mockResolvedValueOnce({
    error: { name: "AuthRetryableFetchError", status: 0 },
  });
  await expect(sendEmailOtp("owner@example.com")).rejects.toThrow(
    "AUTH_NETWORK",
  );
  send.mockRejectedValueOnce(new TypeError("Network request failed"));
  await expect(sendEmailOtp("owner@example.com")).rejects.toThrow(
    "AUTH_NETWORK",
  );
});

const verify = supabase.auth.verifyOtp as jest.Mock;
it("verifies an email code and lets the auth subscription receive the session", async () => {
  verify.mockResolvedValueOnce({ error: null });
  await verifyEmailOtp(" owner@example.com ", "248619");
  expect(verify).toHaveBeenCalledWith({
    email: "owner@example.com",
    token: "248619",
    type: "email",
  });
});
it.each(["12345", "1234567", "12345678", "12a456"])(
  "rejects invalid code %s without a server request",
  async (token) => {
    verify.mockClear();
    await expect(verifyEmailOtp("owner@example.com", token)).rejects.toThrow(
      "AUTH_OTP_FORMAT",
    );
    expect(verify).not.toHaveBeenCalled();
  },
);
it("maps a rejected OTP and allows retrying", async () => {
  verify.mockResolvedValueOnce({ error: { code: "otp_expired", status: 403 } });
  await expect(verifyEmailOtp("owner@example.com", "000000")).rejects.toThrow(
    "AUTH_OTP_INVALID",
  );
  verify.mockResolvedValueOnce({ error: null });
  await expect(
    verifyEmailOtp("owner@example.com", "248619"),
  ).resolves.toBeUndefined();
});
it("does not expose server errors or credentials from OTP verification", async () => {
  verify.mockRejectedValueOnce(new Error("private token=secret"));
  await expect(verifyEmailOtp("owner@example.com", "248619")).rejects.toThrow(
    "AUTH_VERIFY_FAILED",
  );
});
