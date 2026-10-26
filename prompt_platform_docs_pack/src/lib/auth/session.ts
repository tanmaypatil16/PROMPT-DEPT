import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

export type AppProfile = {
  id: string;
  display_name: string | null;
  role: "user" | "admin";
  account_status: string;
};

type SessionUserResult =
  | { status: "unauthenticated"; user: null; profile: null }
  | { status: "unavailable"; user: User | null; profile: null }
  | { status: "missing"; user: User; profile: null }
  | { status: "loaded"; user: User; profile: AppProfile };

export async function getSessionUser() {
  if (!isSupabaseConfigured()) {
    return { status: "unavailable", user: null, profile: null } satisfies SessionUserResult;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { status: "unauthenticated", user: null, profile: null } satisfies SessionUserResult;
  }

  const admin = createAdminClient();
  if (!admin) {
    return { status: "unavailable", user, profile: null } satisfies SessionUserResult;
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, display_name, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load signed-in user's profile", error);
    return { status: "unavailable", user, profile: null } satisfies SessionUserResult;
  }
  if (!profile) {
    return { status: "missing", user, profile: null } satisfies SessionUserResult;
  }

  return { status: "loaded", user, profile: profile as AppProfile } satisfies SessionUserResult;
}

export async function requireAdmin() {
  const session = await getSessionUser();
  if (
    session.status !== "loaded"
    || session.profile.role !== "admin"
    || session.profile.account_status !== "active"
  ) {
    return null;
  }
  return { user: session.user, profile: session.profile };
}
