import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeContentHash, slugify } from "@/lib/prompts/hash";
import { logAdminAction } from "@/lib/admin/audit";
import { isAllowedPreviewUrl, sanitizePreviewUrl } from "@/lib/prompts/preview-url";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  prompt_text: z.string().min(1).max(50000).optional(),
  category_id: z.string().uuid().nullable().optional(),
  preview_image_url: z.string().url().max(2000).nullable().optional(),
  preview_url: z.string().url().max(2000).nullable().optional(),
  status: z.enum(["draft", "pending_review", "published", "rejected", "archived"]).optional(),
  access_tier: z.enum(["free", "premium"]).optional(),
  is_featured: z.boolean().optional(),
  source_url: z.string().url().max(2000).nullable().optional(),
  source_license: z.string().max(500).nullable().optional(),
  attribution: z.string().max(500).nullable().optional(),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await db
    .from("prompts")
    .select("*, categories(id, name, slug), prompt_tags(tags(id, name, slug))")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const views = await db.from("analytics_events").select("id", { count: "exact", head: true }).eq("prompt_id", id).eq("event_type", "prompt_view");
  const copies = await db.from("analytics_events").select("id", { count: "exact", head: true }).eq("prompt_id", id).eq("event_type", "prompt_copy");
  const likes = await db.from("prompt_likes").select("prompt_id", { count: "exact", head: true }).eq("prompt_id", id);
  const saves = await db.from("saved_prompts").select("prompt_id", { count: "exact", head: true }).eq("prompt_id", id);
  const studio = await db.from("analytics_events").select("id", { count: "exact", head: true }).eq("prompt_id", id).eq("event_type", "prompt_generation_completed");

  return NextResponse.json({
    prompt: data,
    analytics: {
      views: views.count ?? 0,
      copies: copies.count ?? 0,
      likes: likes.count ?? 0,
      saves: saves.count ?? 0,
      generations: studio.count ?? 0,
    },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const patch = { ...parsed.data } as Record<string, unknown>;
  if ("preview_url" in patch) {
    const previewUrl = typeof patch.preview_url === "string" ? patch.preview_url : null;
    if (previewUrl && !isAllowedPreviewUrl(previewUrl)) {
      return NextResponse.json({ error: "Preview URL must use an approved HTTPS preview host." }, { status: 400 });
    }
    patch.preview_url = sanitizePreviewUrl(previewUrl);
  }
  if (patch.prompt_text) patch.content_hash = computeContentHash(String(patch.prompt_text));
  if (patch.title && !patch.slug) patch.slug = slugify(String(patch.title));
  if (patch.status === "published") patch.published_at = new Date().toISOString();

  const { data, error } = await db.from("prompts").update(patch).eq("id", id).select("id, slug, status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (patch.prompt_text || patch.title) {
    const { count } = await db.from("prompt_versions").select("id", { count: "exact", head: true }).eq("prompt_id", id);
    await db.from("prompt_versions").insert({
      prompt_id: id,
      version_number: (count ?? 0) + 1,
      title_snapshot: String(patch.title ?? data.slug),
      prompt_text_snapshot: String(patch.prompt_text ?? ""),
      change_summary: "Administrator edit",
      changed_by: adminUser.user.id,
    });
  }

  await logAdminAction({ actorId: adminUser.user.id, action: "prompt.update", targetType: "prompt", targetId: id, metadata: { status: data.status } });
  return NextResponse.json({ prompt: data });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { error } = await db.from("prompts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logAdminAction({ actorId: adminUser.user.id, action: "prompt.delete", targetType: "prompt", targetId: id });
  return NextResponse.json({ ok: true });
}
