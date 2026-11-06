import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const authUrl = new URL(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://invalid",
);
if (!["127.0.0.1", "localhost", "10.0.2.2"].includes(authUrl.hostname))
  throw new Error(
    "E2E requires EXPO_PUBLIC_SUPABASE_URL to point to local Supabase; restart Metro with the same URL",
  );
const platform = process.env.E2E_PLATFORM ?? "ios";
if (!["ios", "android"].includes(platform))
  throw new Error("E2E_PLATFORM must be ios or android");
const mail = new URL(process.env.E2E_MAIL_URL ?? "http://127.0.0.1:54324");
if (!["127.0.0.1", "localhost", "10.0.2.2"].includes(mail.hostname))
  throw new Error("E2E requires a local mailbox");
const mailbox = `pw-${randomUUID()}`;
const env = {
  ...process.env,
  E2E_EMAIL: `${mailbox}@example.test`,
  E2E_PET: `Pet ${mailbox.slice(0, 12)}`,
};
function run(command, args, quiet = false) {
  const result = spawnSync(command, args, {
    env,
    stdio: quiet ? "pipe" : "inherit",
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} failed; check native tooling and local Supabase`,
    );
}
run("maestro", ["test", "e2e/login.yaml"]);
let otp;
for (let attempt = 0; attempt < 60 && !otp; attempt++) {
  let body = "";
  const listing = await fetch(
    new URL(
      `/api/v1/search?query=${encodeURIComponent(`to:${env.E2E_EMAIL}`)}`,
      mail,
    ),
  );
  if (listing.ok && listing.headers.get("content-type")?.includes("json")) {
    const data = await listing.json();
    const latest = data.messages?.[0];
    if (latest) {
      const message = await (
        await fetch(new URL(`/api/v1/message/${latest.ID}`, mail))
      ).json();
      body = [message.Text, message.HTML].filter(Boolean).join("\n");
    }
  } else {
    const old = await fetch(new URL(`/api/v1/mailbox/${mailbox}`, mail));
    if (old.ok) {
      const latest = (await old.json()).at(-1);
      if (latest) {
        const message = await (
          await fetch(new URL(`/api/v1/mailbox/${mailbox}/${latest.id}`, mail))
        ).json();
        body = [message.body?.text, message.body?.html]
          .filter(Boolean)
          .join("\n");
      }
    }
  }
  if (body) {
    otp = body.match(/data-petworth-otp[^>]*>\s*([0-9]{6})\s*</)?.[1];
  }
  if (!otp) await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!otp)
  throw new Error(
    "Local OTP was not delivered; check both email templates and otp_length = 6",
  );
// This is an ephemeral code for a disposable local test account, never a production code.
env.E2E_OTP = otp;
try {
  run("maestro", ["test", "e2e/verify-otp.yaml"]);
} finally {
  delete env.E2E_OTP;
  otp = undefined;
}
run("maestro", ["test", "e2e/pets.yaml"]);
