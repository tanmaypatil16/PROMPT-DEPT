import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchVerifiedSource, getSourceIdentity, TRUSTED_SOURCE_REPOSITORIES, validateSourceReference } from "@/lib/import/source-verification";

const reviewStatusSchema = z.enum(["approved", "requires_review", "excluded", "rejected"]);

const reviewRequestSchema = z.object({
  decisions: z.array(z.object({
    entryId: z.string().min(1).max(120),
    sourceRepository: z.string().min(1).max(200),
    sourcePath: z.string().min(1).max(500),
    sourceCommit: z.string().min(1).max(120),
    reviewStatus: reviewStatusSchema,
    rationale: z.string().max(2000).optional(),
  }).strict()).min(1).max(250),
}).strict();

const MAX_REVIEW_REQUEST_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_REVIEW_REQUEST_BYTES) {
      return NextResponse.json({ error: "Review request is too large." }, { status: 413 });
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_REVIEW_REQUEST_BYTES) {
      return NextResponse.json({ error: "Review request is too large." }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = reviewRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const decisions = parsed.data.decisions;
  const identitySet = new Set<string>();
  for (const decision of decisions) {
    const validationError = validateSourceReference(decision);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const sourceIdentity = getSourceIdentity(decision.sourceRepository, decision.sourcePath);
    if (identitySet.has(sourceIdentity)) {
      return NextResponse.json({ error: "Duplicate source identities are not allowed in one review request." }, { status: 409 });
    }
    identitySet.add(sourceIdentity);

    if (decision.reviewStatus === "approved" && (decision.rationale?.trim().length ?? 0) < 20) {
      return NextResponse.json({
        error: "An approval decision requires a rationale of at least 20 characters.",
      }, { status: 400 });
    }
  }

  if (decisions.length !== 1) {
    return NextResponse.json({
      error: "Submit one source decision per request so each review state and audit entry remains atomic.",
    }, { status: 400 });
  }

  const decision = decisions[0];
  if (!TRUSTED_SOURCE_REPOSITORIES.includes(decision.sourceRepository as typeof TRUSTED_SOURCE_REPOSITORIES[number])) {
    return NextResponse.json({ error: "Unsupported source repository." }, { status: 400 });
  }

  let verifiedSource;
  try {
    verifiedSource = await fetchVerifiedSource(decision);
  } catch (error) {
    console.error("Failed to verify source content for import review", error);
    return NextResponse.json({ error: "Unable to verify the source file from the trusted repository." }, { status: 502 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const { data: currentState, error: stateError } = await db
    .from("import_source_review_state")
    .select("updated_at")
    .eq("source_identity", verifiedSource.sourceIdentity)
    .maybeSingle();

  if (stateError) {
    console.error("Failed to read import source review state", stateError);
    return NextResponse.json({ error: "Unable to load the current review state." }, { status: 500 });
  }

  const { data: reviewResult, error: reviewError } = await db.rpc("record_import_source_review", {
    p_source_identity: verifiedSource.sourceIdentity,
    p_source_repository: verifiedSource.sourceRepository,
    p_source_path: verifiedSource.sourcePath,
    p_source_commit: verifiedSource.sourceCommit,
    p_source_content_hash: verifiedSource.sourceContentHash,
    p_review_status: decision.reviewStatus,
    p_reviewer_id: adminUser.user.id,
    p_rationale: decision.rationale?.trim() || null,
    p_expected_updated_at: currentState?.updated_at ?? null,
  });

  if (reviewError) {
    if (reviewError.code === "40001") {
      return NextResponse.json({ error: "Review state changed concurrently. Refresh the review and try again." }, { status: 409 });
    }
    if (reviewError.code === "42501") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (reviewError.code === "22023") {
      return NextResponse.json({ error: "The review decision or status transition is invalid." }, { status: 400 });
    }
    console.error("Failed to persist import source review and audit record", reviewError);
    return NextResponse.json({ error: "The review decision and audit record could not be saved." }, { status: 500 });
  }

  if (!reviewResult || typeof reviewResult !== "object") {
    console.error("Import source review RPC returned no review state");
    return NextResponse.json({ error: "The review decision could not be confirmed." }, { status: 500 });
  }

  const result = reviewResult as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    entryId: decision.entryId,
    sourceIdentity: verifiedSource.sourceIdentity,
    sourceContentHash: verifiedSource.sourceContentHash,
    reviewStatus: result.review_status,
    reviewerId: result.reviewer_id,
    reviewedAt: result.reviewed_at,
    updatedAt: result.updated_at,
    idempotent: result.idempotent === true,
    rightsIndependentlyVerified: false,
    message: result.review_status === "requires_review" && decision.reviewStatus !== "requires_review"
      ? "Source content changed since its previous review. The prior decision was invalidated and manual review is required."
      : undefined,
  });
}
