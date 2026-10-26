import { createAdminClient } from "@/lib/supabase/admin";

export async function userHasPremiumAccess(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from("subscriptions")
    .select("id, status, current_period_end, subscription_plans(slug, entitlements)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  const end = data.current_period_end ? new Date(data.current_period_end) : null;
  if (end && end.getTime() < Date.now()) return false;
  return true;
}
