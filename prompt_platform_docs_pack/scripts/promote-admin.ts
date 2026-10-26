/**
 * Promote one existing profile through the service-role-only database function.
 * Usage: node --experimental-strip-types scripts/promote-admin.ts <auth-user-uuid>
 */
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd());

const userId = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  || process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim()
  || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
  if (!userId || !uuidPattern.test(userId)) {
    throw new Error("Usage: node --experimental-strip-types scripts/promote-admin.ts <auth-user-uuid>");
  }
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and " +
      "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local or the process environment.",
    );
  }

  await promoteUser(url, serviceKey, userId);
}

async function promoteUser(projectUrl: string, secretKey: string, targetUserId: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(projectUrl);
  } catch {
    throw new Error("Supabase project URL is invalid.");
  }
  if (!["https:", "http:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new Error("Supabase project URL must be an HTTP(S) URL without embedded credentials.");
  }

  let response: Response;
  try {
    response = await fetch(new URL("/auth/v1/health", parsedUrl), {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : undefined;
    const code = cause && "code" in cause && typeof cause.code === "string" ? ` (${cause.code})` : "";
    throw new Error(`Cannot reach the configured Supabase project${code}. Check the URL and network.`);
  }
  if (response.status >= 500) {
    throw new Error(`Supabase Auth health endpoint returned HTTP ${response.status}.`);
  }

  const admin = createClient(parsedUrl.toString().replace(/\/$/, ""), secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: promotionError } = await admin.rpc("promote_user_to_admin", {
    target_user_id: targetUserId,
  });
  if (promotionError) {
    throw new Error(
      `Trusted promotion function failed (${promotionError.code ?? "unknown"}): ${promotionError.message}`,
    );
  }

  const { data: profile, error: verificationError } = await admin
    .from("profiles")
    .select("id, role, account_status")
    .eq("id", targetUserId)
    .maybeSingle();
  if (verificationError) {
    throw new Error(`Promotion ran, but profile verification failed: ${verificationError.message}`);
  }
  if (!profile || profile.role !== "admin" || profile.account_status !== "active") {
    throw new Error("Promotion ran, but the target profile is missing or is not an active administrator.");
  }

  console.log(`Verified active administrator profile ${profile.id}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected promotion failure.";
  console.error(message);
  process.exitCode = 1;
});
