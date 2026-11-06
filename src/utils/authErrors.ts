/** Convert Auth errors to stable UI codes without exposing server text or credentials. */
export function authErrorCode(
  error: unknown,
  operation: "send" | "callback" | "verify",
) {
  const details =
    error && typeof error === "object"
      ? (error as {
          code?: unknown;
          status?: unknown;
          name?: unknown;
          message?: unknown;
        })
      : {};
  const code = typeof details.code === "string" ? details.code : "";
  const status =
    typeof details.status === "number" ? details.status : undefined;
  if (
    status === 429 ||
    ["over_email_send_rate_limit", "over_request_rate_limit"].includes(code)
  )
    return "AUTH_RATE_LIMIT";
  if (code === "email_address_not_authorized") return "AUTH_EMAIL_RESTRICTED";
  if (code === "email_address_invalid" || code === "validation_failed")
    return "EMAIL_INVALID";
  if (operation === "verify" && ["otp_expired", "access_denied"].includes(code))
    return "AUTH_OTP_INVALID";
  if (
    status === 401 ||
    ["email_provider_disabled", "signup_disabled"].includes(code)
  )
    return "AUTH_CONFIGURATION";
  if (status !== undefined && status >= 500) return "AUTH_UNAVAILABLE";
  if (
    (details.name === "AuthRetryableFetchError" && (!status || status === 0)) ||
    (details.name === "TypeError" &&
      typeof details.message === "string" &&
      /network|fetch/i.test(details.message))
  )
    return "AUTH_NETWORK";
  if (
    [
      "otp_expired",
      "bad_code_verifier",
      "flow_state_expired",
      "flow_state_not_found",
    ].includes(code)
  )
    return "AUTH_CALLBACK";
  return operation === "send"
    ? "AUTH_SEND_FAILED"
    : operation === "verify"
      ? "AUTH_VERIFY_FAILED"
      : "AUTH_CALLBACK";
}
