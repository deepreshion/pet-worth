import { authErrorCode } from "./authErrors";
import { errorMessage } from "@/presentation/errors";
import { applyLocale } from "@/i18n";

it("identifies the React Native network failure instead of a save failure", () => {
  expect(
    authErrorCode({ name: "AuthRetryableFetchError", status: 0 }, "send"),
  ).toBe("AUTH_NETWORK");
  expect(authErrorCode(new TypeError("Network request failed"), "send")).toBe(
    "AUTH_NETWORK",
  );
});
it("distinguishes network errors from server outages and rate limits", () => {
  expect(
    authErrorCode({ name: "AuthRetryableFetchError", status: 503 }, "send"),
  ).toBe("AUTH_UNAVAILABLE");
  expect(
    authErrorCode({ code: "over_email_send_rate_limit", status: 429 }, "send"),
  ).toBe("AUTH_RATE_LIMIT");
});
it("explains restricted SMTP, invalid addresses and disabled auth", () => {
  expect(authErrorCode({ code: "email_address_not_authorized" }, "send")).toBe(
    "AUTH_EMAIL_RESTRICTED",
  );
  expect(authErrorCode({ code: "email_address_invalid" }, "send")).toBe(
    "EMAIL_INVALID",
  );
  expect(authErrorCode({ status: 401 }, "send")).toBe("AUTH_CONFIGURATION");
});
it("uses a sign-in-specific fallback without displaying raw server details", () => {
  applyLocale("ru");
  const code = authErrorCode(
    new Error("private@email.test token=private"),
    "send",
  );
  expect(errorMessage(code)).toBe(
    "Не удалось отправить код для входа. Попробуйте ещё раз.",
  );
  applyLocale("en");
  expect(errorMessage("AUTH_NETWORK")).toContain("sign-in server");
});
it("handles invalid or expired callback codes separately", () => {
  expect(authErrorCode({ code: "otp_expired" }, "callback")).toBe(
    "AUTH_CALLBACK",
  );
  expect(authErrorCode(undefined, "send")).toBe("AUTH_SEND_FAILED");
});
