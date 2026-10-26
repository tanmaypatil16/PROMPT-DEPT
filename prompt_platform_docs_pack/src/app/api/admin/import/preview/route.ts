import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCsvContent, parseJsonContent } from "@/lib/import/parse-records";
import { fetchGitHubText, isAllowedGitHubUrl } from "@/lib/import/github-fetch";

const previewSchema = z.object({
  sourceType: z.enum(["csv", "json", "github"]),
  content: z.string().max(5_000_000).optional(),
  githubUrl: z.string().url().max(2000).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = previewSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { sourceType, fieldMapping } = parsed.data;
  let content = parsed.data.content ?? "";
  if (sourceType === "github") {
    const url = parsed.data.githubUrl;
    if (!url || !isAllowedGitHubUrl(url)) {
      return NextResponse.json({ error: "Invalid or disallowed GitHub URL." }, { status: 400 });
    }
    try {
      content = await fetchGitHubText(url);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Fetch failed" }, { status: 400 });
    }
  }

  const result = sourceType === "json" || content.trim().startsWith("[") || content.trim().startsWith("{")
    ? parseJsonContent(content, fieldMapping)
    : parseCsvContent(content, fieldMapping);

  const admin = createAdminClient();
  const existingHashes = new Set<string>();
  if (admin && result.records.length) {
    const hashes = result.records.map((r) => r.content_hash);
    const { data } = await admin.from("prompts").select("content_hash").in("content_hash", hashes);
    for (const row of data ?? []) {
      if (row.content_hash) existingHashes.add(row.content_hash);
    }
  }

  const preview = result.records.map((record) => ({
    ...record,
    duplicate: existingHashes.has(record.content_hash),
  }));

  return NextResponse.json({
    summary: {
      total: preview.length + result.invalid.length,
      valid: preview.filter((r) => !r.duplicate).length,
      duplicate: preview.filter((r) => r.duplicate).length,
      invalid: result.invalid.length,
    },
    records: preview.slice(0, 100),
    invalid: result.invalid.slice(0, 50),
    truncated: preview.length > 100,
  });
}
