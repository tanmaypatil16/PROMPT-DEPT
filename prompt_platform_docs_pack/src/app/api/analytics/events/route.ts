import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { analyticsEventSchema, sanitizeEventProperties } from "@/lib/analytics/events";
import { checkRateLimit } from "@/lib/analytics/rate-limit";
import { analyticsConfig, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (!checkRateLimit(`analytics:${ip}`, analyticsConfig.rateLimitPerMinute)) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event payload.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, stored: false, reason: "analytics-disabled" });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, stored: false, reason: "service-unavailable" });
  }

  const { user } = await getSessionUser();
  const event = parsed.data;
  let promptId = event.promptId;
  if (!promptId && event.promptSlug) {
    const { data: promptRow } = await admin.from("prompts").select("id").eq("slug", event.promptSlug).maybeSingle();
    promptId = promptRow?.id;
  }

  let categoryId: string | undefined;
  if (event.categorySlug) {
    const { data: cat } = await admin.from("categories").select("id").eq("slug", event.categorySlug).maybeSingle();
    categoryId = cat?.id;
  }

  const { error } = await admin.from("analytics_events").insert({
    id: event.eventId ?? randomUUID(),
    event_type: event.eventType,
    occurred_at: event.occurredAt ?? new Date().toISOString(),
    user_id: user?.id ?? null,
    session_id: event.sessionId ?? null,
    prompt_id: promptId ?? null,
    category_id: categoryId ?? null,
    properties: sanitizeEventProperties(event.properties),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to store event." }, { status: 500 });
  }

  if (user?.id) {
    await admin.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
  }

  return NextResponse.json({ ok: true, stored: true });
}
