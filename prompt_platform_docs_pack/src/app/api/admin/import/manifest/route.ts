import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { evaluateManifestDryRun, manifestRequestSchema, MAX_MANIFEST_BYTES, MAX_MANIFEST_ENTRIES } from "@/lib/import/manifest";
import type { ExistingPromptRef } from "@/lib/import/manifest";

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const payloadObject = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const rawEntries = Array.isArray(payloadObject.entries) ? payloadObject.entries : undefined;

  if (rawEntries && rawEntries.length > MAX_MANIFEST_ENTRIES) {
    return NextResponse.json({
      error: `Manifest has too many entries. Maximum allowed is ${MAX_MANIFEST_ENTRIES}.`,
    }, { status: 413 });
  }

  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (payloadSize > MAX_MANIFEST_BYTES) {
    return NextResponse.json({
      error: `Manifest payload is too large. Maximum allowed size is ${MAX_MANIFEST_BYTES} bytes.`,
    }, { status: 413 });
  }

  const parsed = manifestRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entries = parsed.data.entries;

  let existingRecords: ExistingPromptRef[] = [];
  const db = createAdminClient();
  if (db) {
    const [hashesResult, slugsResult] = await Promise.all([
      db.from("prompts").select("id, title, slug, content_hash").not("content_hash", "is", null),
      db.from("prompts").select("id, title, slug, content_hash").not("slug", "is", null),
    ]);

    const promptRows = [...(hashesResult.data ?? []), ...(slugsResult.data ?? [])];
    const deduped = new Map<string, ExistingPromptRef>();
    for (const row of promptRows) {
      if (!row || typeof row !== "object") continue;
      const record = {
        id: String((row as Record<string, unknown>).id ?? ""),
        slug: String((row as Record<string, unknown>).slug ?? ""),
        title: String((row as Record<string, unknown>).title ?? ""),
        content_hash: typeof (row as Record<string, unknown>).content_hash === "string"
          ? (row as Record<string, unknown>).content_hash as string
          : undefined,
      };
      if (record.id) deduped.set(record.id, record);
    }
    existingRecords = Array.from(deduped.values());
  }

  const dryRun = evaluateManifestDryRun(entries, existingRecords);

  return NextResponse.json({
    dryRun: true,
    databaseStatus: db ? "ready" : "not-configured",
    summary: dryRun.summary,
    invalid: dryRun.invalidEntries,
    duplicates: dryRun.duplicatesList,
    notApproved: dryRun.notApprovedEntries,
    conflicts: dryRun.conflictsList,
    wouldInsert: dryRun.wouldInsertEntries,
    wouldSkip: dryRun.wouldSkipEntries,
    flaggedForReview: dryRun.flaggedForReviewEntries,
    warnings: db ? [] : ["No database connection was available for existing-record conflict checks."],
  });
}
