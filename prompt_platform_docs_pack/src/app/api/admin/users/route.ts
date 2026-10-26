import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));
  const q = request.nextUrl.searchParams.get("q")?.trim();

  let query = db
    .from("profiles")
    .select("id, display_name, role, account_status, created_at, last_active_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (q) query = query.or(`display_name.ilike.%${q}%`);

  const { data: profiles, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const [likes, saves, studio] = await Promise.all([
        db.from("prompt_likes").select("prompt_id", { count: "exact", head: true }).eq("user_id", profile.id),
        db.from("saved_prompts").select("prompt_id", { count: "exact", head: true }).eq("user_id", profile.id),
        db.from("analytics_events").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("event_type", "prompt_studio_started"),
      ]);
      const { data: sub } = await db
        .from("subscriptions")
        .select("status, subscription_plans(name)")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle();
      return {
        ...profile,
        likes: likes.count ?? 0,
        saves: saves.count ?? 0,
        studioUsage: studio.count ?? 0,
        subscriptionStatus: sub?.status ?? "none",
        planName: (sub as { subscription_plans?: { name: string } } | null)?.subscription_plans?.name ?? null,
      };
    }),
  );

  return NextResponse.json({ users: enriched, total: count ?? 0, page, pageSize });
}

const patchSchema = z.object({
  userId: z.string().uuid(),
  account_status: z.enum(["active", "suspended", "deleted"]).optional(),
});

export async function PATCH(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, account_status } = parsed.data;
  if (userId === adminUser.user.id && account_status && account_status !== "active") {
    return NextResponse.json({ error: "Cannot suspend your own administrator account." }, { status: 400 });
  }

  const { error } = await db.from("profiles").update({ account_status }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "user.update_status",
    targetType: "profile",
    targetId: userId,
    metadata: { account_status },
  });

  return NextResponse.json({ ok: true });
}
