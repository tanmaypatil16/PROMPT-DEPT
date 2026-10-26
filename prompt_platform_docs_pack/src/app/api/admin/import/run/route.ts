import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCsvContent, parseJsonContent } from "@/lib/import/parse-records";
import { fetchGitHubText, isAllowedGitHubUrl } from "@/lib/import/github-fetch";
import { logAdminAction } from "@/lib/admin/audit";
import { slugify } from "@/lib/prompts/hash";

const runSchema = z.object({
  sourceType: z.enum(["csv", "json", "github"]),
  content: z.string().max(5_000_000).optional(),
  githubUrl: z.string().url().max(2000).optional(),
  originalFilename: z.string().max(300).optional(),
  fieldMapping: z.record(z.string(), z.string()).default({}),
});

const BATCH = 25;

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const parsed = runSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sourceType, fieldMapping, originalFilename } = parsed.data;
  let content = parsed.data.content ?? "";
  let sourceUrl: string | null = parsed.data.githubUrl ?? null;

  if (sourceType === "github") {
    const url = parsed.data.githubUrl;
    if (!url || !isAllowedGitHubUrl(url)) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }
    content = await fetchGitHubText(url);
  }

  const parsedRecords = sourceType === "json" || content.trim().startsWith("[") || content.trim().startsWith("{")
    ? parseJsonContent(content, fieldMapping)
    : parseCsvContent(content, fieldMapping);

  const { data: job, error: jobError } = await db
    .from("prompt_import_jobs")
    .insert({
      created_by: adminUser.user.id,
      source_type: sourceType,
      source_url: sourceUrl,
      original_filename: originalFilename ?? null,
      status: "processing",
      total_records: parsedRecords.records.length + parsedRecords.invalid.length,
      field_mapping: fieldMapping,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) return NextResponse.json({ error: jobError?.message ?? "Job create failed" }, { status: 500 });

  let imported = 0;
  let duplicate = 0;
  let invalid = parsedRecords.invalid.length;
  let failed = 0;

  for (const inv of parsedRecords.invalid) {
    await db.from("prompt_import_items").insert({
      import_job_id: job.id,
      row_number: inv.rowNumber,
      status: "invalid",
      error_message: inv.errors.join("; ").slice(0, 2000),
    });
  }

  const categoryCache = new Map<string, string>();
  async function categoryIdFor(name?: string) {
    if (!name) return null;
    const slug = slugify(name);
    if (categoryCache.has(slug)) return categoryCache.get(slug)!;
    const { data: existing } = await db.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (existing?.id) {
      categoryCache.set(slug, existing.id);
      return existing.id;
    }
    const { data: created } = await db.from("categories").insert({ name, slug, is_active: true }).select("id").single();
    if (created?.id) categoryCache.set(slug, created.id);
    return created?.id ?? null;
  }

  for (let i = 0; i < parsedRecords.records.length; i += BATCH) {
    const batch = parsedRecords.records.slice(i, i + BATCH);
    for (const record of batch) {
      const { data: dup } = await db.from("prompts").select("id").eq("content_hash", record.content_hash).maybeSingle();
      if (dup) {
        duplicate += 1;
        await db.from("prompt_import_items").insert({
          import_job_id: job.id,
          row_number: record.rowNumber,
          status: "duplicate",
          source_record_key: record.slug,
          prompt_id: dup.id,
        });
        continue;
      }

      const category_id = await categoryIdFor(record.category);
      const source_type = sourceType === "github" ? "github_import" : sourceType === "csv" ? "csv_import" : "json_import";
      const { data: inserted, error } = await db
        .from("prompts")
        .insert({
          title: record.title,
          slug: record.slug,
          description: record.description,
          prompt_text: record.prompt_text,
          category_id,
          preview_image_url: record.preview_image_url || null,
          status: "draft",
          access_tier: record.access_tier ?? "free",
          source_type,
          source_url: record.source_url ?? sourceUrl,
          source_license: record.source_license ?? null,
          attribution: record.attribution ?? null,
          content_hash: record.content_hash,
          author_id: adminUser.user.id,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        failed += 1;
        await db.from("prompt_import_items").insert({
          import_job_id: job.id,
          row_number: record.rowNumber,
          status: "failed",
          error_message: error?.message?.slice(0, 2000) ?? "Insert failed",
        });
        continue;
      }

      imported += 1;
      for (const tagName of record.normalized_tags) {
        const tagSlug = slugify(tagName);
        const { data: tag } = await db.from("tags").upsert({ name: tagName, slug: tagSlug }, { onConflict: "slug" }).select("id").single();
        if (tag) await db.from("prompt_tags").upsert({ prompt_id: inserted.id, tag_id: tag.id });
      }

      await db.from("prompt_import_items").insert({
        import_job_id: job.id,
        row_number: record.rowNumber,
        status: "imported",
        prompt_id: inserted.id,
        source_record_key: record.slug,
      });
    }
  }

  const status = failed > 0 || invalid > 0 ? "completed_with_errors" : "completed";
  await db
    .from("prompt_import_jobs")
    .update({
      status,
      valid_records: parsedRecords.records.length,
      imported_records: imported,
      duplicate_records: duplicate,
      invalid_records: invalid,
      failed_records: failed,
      completed_at: new Date().toISOString(),
      error_summary: failed ? `${failed} records failed to import` : null,
    })
    .eq("id", job.id);

  await logAdminAction({
    actorId: adminUser.user.id,
    action: "import.run",
    targetType: "prompt_import_job",
    targetId: job.id,
    metadata: { imported, duplicate, invalid, failed },
  });

  return NextResponse.json({ jobId: job.id, imported, duplicate, invalid, failed, status });
}
