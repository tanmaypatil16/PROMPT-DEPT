import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeContentHash, slugify } from "@/lib/prompts/hash";
import { logAdminAction } from "@/lib/admin/audit";

const promptWriteSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).default(""),
  prompt_text: z.string().min(1).max(50000),
  category_id: z.string().uuid().nullable().optional(),
  preview_image_url: z.string().url().max(2000).nullable().optional(),
  status: z.enum(["draft", "pending_review", "published", "rejected", "archived"]).default("draft"),
  access_tier: z.enum(["free", "premium"]).default("free"),
  is_featured: z.boolean().default(false),
  source_url: z.string().url().max(2000).nullable().optional(),
  source_license: z.string().max(500).nullable().optional(),
  attribution: z.string().max(500).nullable().optional(),
  tag_names: z.array(z.string().max(80)).max(20).optional(),
});

export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));
  const status = request.nextUrl.searchParams.get("status");
  const q = request.nextUrl.searchParams.get("q")?.trim();

  let query = db
    .from("prompts")
    .select("id, slug, title, status, access_tier, is_featured, updated_at, categories(name)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompts: data, total: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await request.json();
  const parsed = promptWriteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const input = parsed.data;
  const slug = input.slug?.trim() || slugify(input.title);
  const content_hash = computeContentHash(input.prompt_text);
  const published_at = input.status === "published" ? new Date().toISOString() : null;

  const { data: prompt, error } = await db
    .from("prompts")
    .insert({
      title: input.title,
      slug,
      description: input.description,
      prompt_text: input.prompt_text,
      category_id: input.category_id ?? null,
      preview_image_url: input.preview_image_url ?? null,
      status: input.status,
      access_tier: input.access_tier,
      is_featured: input.is_featured,
      source_url: input.source_url ?? null,
      source_license: input.source_license ?? null,
      attribution: input.attribution ?? null,
      content_hash,
      published_at,
      author_id: adminUser.user.id,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (input.tag_names?.length) {
    for (const name of input.tag_names) {
      const tagSlug = slugify(name);
      const { data: tag } = await db.from("tags").upsert({ name, slug: tagSlug }, { onConflict: "slug" }).select("id").single();
      if (tag) await db.from("prompt_tags").upsert({ prompt_id: prompt.id, tag_id: tag.id });
    }
  }

  await db.from("prompt_versions").insert({
    prompt_id: prompt.id,
    version_number: 1,
    title_snapshot: input.title,
    prompt_text_snapshot: input.prompt_text,
    change_summary: "Initial version",
    changed_by: adminUser.user.id,
  });

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "prompt.create",
    targetType: "prompt",
    targetId: prompt.id,
  });

  return NextResponse.json({ prompt }, { status: 201 });
}
