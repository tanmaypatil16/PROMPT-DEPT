import { z } from "zod";
import { slugify } from "@/lib/prompts/hash";

export const MAX_MANIFEST_ENTRIES = 250;
export const MAX_MANIFEST_BYTES = 250 * 1024;

export const approvedSourceEntrySchema = z.object({
  id: z.string().min(1).max(120),
  sourceRepository: z.string().min(1).max(200),
  sourcePath: z.string().min(1).max(500),
  sourceCommit: z.string().max(120).optional(),
  sourceContentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  reviewedTitle: z.string().min(1).max(300),
  reviewedDescription: z.string().max(2000).optional().default(""),
  reviewedCategory: z.string().max(100).optional(),
  reviewedTags: z.array(z.string().min(1).max(50)).max(20).default([]),
  attribution: z.string().max(500).optional(),
  licenseStatus: z.enum(["confirmed", "review-pending", "excluded", "not-applicable"]).default("review-pending"),
  previewType: z.enum(["image", "placeholder", "none"]).default("placeholder"),
  previewUrl: z.string().url().max(2000).optional(),
  status: z.enum(["review-pending", "approved", "rejected", "imported"]).default("review-pending"),
  reviewNotes: z.string().max(2000).optional(),
});

export const manifestRequestSchema = z.object({
  entries: z.array(z.unknown()).max(MAX_MANIFEST_ENTRIES),
  name: z.string().max(200).optional(),
}).passthrough();

export const reviewDecisionStatusSchema = z.enum(["approved", "requires_review", "excluded", "rejected"]);

export const manifestReviewDecisionSchema = z.object({
  decisions: z.array(z.object({
    index: z.number().int().min(0).max(MAX_MANIFEST_ENTRIES - 1),
    entryId: z.string().min(1).max(120),
    sourceIdentity: z.string().min(1).max(500),
    sourceRepository: z.string().min(1).max(200).optional(),
    sourcePath: z.string().min(1).max(500).optional(),
    sourceContentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    title: z.string().max(300).optional(),
    manifestStatus: z.enum(["review-pending", "approved", "rejected", "imported"]).optional(),
    licenseStatus: z.enum(["confirmed", "review-pending", "excluded", "not-applicable"]).optional(),
    reviewStatus: reviewDecisionStatusSchema.default("requires_review"),
    reason: z.string().max(2000).optional(),
  })).min(1).max(MAX_MANIFEST_ENTRIES),
}).passthrough();

export type ApprovedSourceEntry = z.infer<typeof approvedSourceEntrySchema>;
export type ManifestReviewDecisionStatus = z.infer<typeof reviewDecisionStatusSchema>;
export type ManifestReviewDecision = z.infer<typeof manifestReviewDecisionSchema>;

export type ExistingPromptRef = {
  id: string;
  slug: string;
  title: string;
  content_hash?: string | null;
};

export type ManifestValidationResult = {
  valid: ApprovedSourceEntry[];
  invalid: Array<{ index: number; errors: string[] }>;
};

export type ManifestDryRunResult = {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  conflicts: number;
  notApproved: number;
  flaggedForReview: number;
  wouldInsert: number;
  wouldSkip: number;
  invalidEntries: Array<{ index: number; entryId?: string; errors: string[] }>;
  duplicatesList: Array<{ sourceIdentity: string; entryIds: string[]; indexes: number[] }>;
  notApprovedEntries: Array<{ index: number; entryId: string; reason: string }>;
  conflictsList: Array<{ index: number; entryId: string; type: "content_hash" | "slug"; reason: string; existingId?: string; existingTitle?: string }>;
  wouldInsertEntries: Array<{ index: number; entryId: string; title: string }>;
  wouldSkipEntries: Array<{ index: number; entryId: string; title: string; reason: string }>;
  flaggedForReviewEntries: Array<{ index: number; entryId: string; title: string; reason: string }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    conflicts: number;
    notApproved: number;
    flaggedForReview: number;
    wouldInsert: number;
    wouldSkip: number;
  };
};

export function normalizeManifestEntry(entry: unknown): ApprovedSourceEntry {
  const source = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
  const normalized = {
    id: String(source.id ?? ""),
    sourceRepository: String(source.sourceRepository ?? ""),
    sourcePath: String(source.sourcePath ?? ""),
    sourceCommit: typeof source.sourceCommit === "string" ? source.sourceCommit : undefined,
    sourceContentHash: typeof source.sourceContentHash === "string" ? source.sourceContentHash : undefined,
    reviewedTitle: String(source.reviewedTitle ?? ""),
    reviewedDescription: typeof source.reviewedDescription === "string" ? source.reviewedDescription : "",
    reviewedCategory: typeof source.reviewedCategory === "string" ? source.reviewedCategory : undefined,
    reviewedTags: Array.isArray(source.reviewedTags)
      ? source.reviewedTags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 20)
      : [],
    attribution: typeof source.attribution === "string" ? source.attribution : undefined,
    licenseStatus: (typeof source.licenseStatus === "string" ? source.licenseStatus : "review-pending") as ApprovedSourceEntry["licenseStatus"],
    previewType: (typeof source.previewType === "string" ? source.previewType : "placeholder") as ApprovedSourceEntry["previewType"],
    previewUrl: typeof source.previewUrl === "string" && source.previewUrl.trim() ? source.previewUrl.trim() : undefined,
    status: (typeof source.status === "string" ? source.status : "review-pending") as ApprovedSourceEntry["status"],
    reviewNotes: typeof source.reviewNotes === "string" ? source.reviewNotes : undefined,
  };

  return approvedSourceEntrySchema.parse(normalized);
}

export function validateManifest(entries: unknown): ManifestValidationResult {
  const list = Array.isArray(entries) ? entries : [];
  const valid: ApprovedSourceEntry[] = [];
  const invalid: ManifestValidationResult["invalid"] = [];

  list.forEach((entry, index) => {
    try {
      valid.push(normalizeManifestEntry(entry));
    } catch (error) {
      const issues = error instanceof z.ZodError ? error.issues.map((issue) => issue.message) : ["Manifest entry is invalid"];
      invalid.push({ index, errors: issues });
    }
  });

  return { valid, invalid };
}

export function getManifestSourceIdentity(entry: ApprovedSourceEntry): string {
  const identity = [
    entry.sourceRepository,
    entry.sourcePath,
    entry.sourceCommit ?? entry.sourceContentHash ?? "",
  ].join("|");
  return identity || entry.id;
}

export function evaluateManifestDryRun(entries: unknown, existingRecords: ExistingPromptRef[] = []): ManifestDryRunResult {
  const list = Array.isArray(entries) ? entries : [];
  const checked = list.flatMap((entry, index) => {
    try {
      return [{ index, entry: normalizeManifestEntry(entry) }];
    } catch {
      return [];
    }
  });

  const invalidEntries = list.flatMap((entry, index) => {
    try {
      normalizeManifestEntry(entry);
      return [];
    } catch (error) {
      const issues = error instanceof z.ZodError ? error.issues.map((issue) => issue.message) : ["Manifest entry is invalid"];
      return [{ index, entryId: typeof entry === "object" && entry !== null && "id" in entry ? String((entry as Record<string, unknown>).id ?? "") : undefined, errors: issues }];
    }
  });

  const validEntries = checked.map(({ index, entry }) => ({ index, entry }));

  const byIdentity = new Map<string, number[]>();
  for (const { index, entry } of validEntries) {
    const identity = getManifestSourceIdentity(entry);
    const current = byIdentity.get(identity) ?? [];
    current.push(index);
    byIdentity.set(identity, current);
  }

  const duplicatesList = Array.from(byIdentity.entries())
    .filter(([, indexes]) => indexes.length > 1)
    .map(([sourceIdentity, indexes]) => ({
      sourceIdentity,
      entryIds: indexes.map((index) => {
        const validEntry = validEntries.find((item) => item.index === index);
        return validEntry?.entry.id ?? `index-${index}`;
      }),
      indexes,
    }));

  const existingByHash = new Map<string, ExistingPromptRef>();
  const existingBySlug = new Map<string, ExistingPromptRef>();
  for (const record of existingRecords) {
    if (record.content_hash) existingByHash.set(record.content_hash, record);
    existingBySlug.set(slugify(record.slug || record.title), record);
  }

  const notApprovedEntries: ManifestDryRunResult["notApprovedEntries"] = [];
  const conflictsList: ManifestDryRunResult["conflictsList"] = [];
  const wouldInsertEntries: ManifestDryRunResult["wouldInsertEntries"] = [];
  const wouldSkipEntries: ManifestDryRunResult["wouldSkipEntries"] = [];
  const flaggedForReviewEntries: ManifestDryRunResult["flaggedForReviewEntries"] = [];

  for (const { index, entry } of validEntries) {
    const duplicateIndexes = duplicatesList.flatMap((item) => item.indexes.includes(index) ? [item.sourceIdentity] : []);
    const isDuplicate = duplicateIndexes.length > 0;
    const isNotApproved = entry.status !== "approved" || entry.licenseStatus !== "confirmed";
    const slug = slugify(entry.reviewedTitle);
    const conflictHash = entry.sourceContentHash ? existingByHash.get(entry.sourceContentHash) : undefined;
    const conflictSlug = slug ? existingBySlug.get(slug) : undefined;

    if (isNotApproved) {
      notApprovedEntries.push({
        index,
        entryId: entry.id,
        reason: entry.status !== "approved"
          ? `Manifest status is ${entry.status}; only approved entries are eligible.`
          : `License status is ${entry.licenseStatus}; only confirmed entries are eligible.`,
      });
      flaggedForReviewEntries.push({
        index,
        entryId: entry.id,
        title: entry.reviewedTitle,
        reason: "Not approved for import because the manifest or rights status is pending or excluded.",
      });
    }

    if (isDuplicate) {
      flaggedForReviewEntries.push({
        index,
        entryId: entry.id,
        title: entry.reviewedTitle,
        reason: "Duplicate source identity already appears elsewhere in the manifest.",
      });
    }

    if (conflictHash) {
      conflictsList.push({
        index,
        entryId: entry.id,
        type: "content_hash",
        reason: "This content hash already exists in the prompt catalog.",
        existingId: conflictHash.id,
        existingTitle: conflictHash.title,
      });
      flaggedForReviewEntries.push({
        index,
        entryId: entry.id,
        title: entry.reviewedTitle,
        reason: "Conflicts with an existing prompt record by content hash.",
      });
    }

    if (conflictSlug && (!conflictHash || conflictSlug.id !== conflictHash.id)) {
      conflictsList.push({
        index,
        entryId: entry.id,
        type: "slug",
        reason: "The derived slug already exists in the prompt catalog.",
        existingId: conflictSlug.id,
        existingTitle: conflictSlug.title,
      });
      flaggedForReviewEntries.push({
        index,
        entryId: entry.id,
        title: entry.reviewedTitle,
        reason: "Conflicts with an existing prompt record by derived slug.",
      });
    }

    const canInsert = !isDuplicate && !isNotApproved && !conflictHash && !conflictSlug;
    if (canInsert) {
      wouldInsertEntries.push({ index, entryId: entry.id, title: entry.reviewedTitle });
    } else {
      wouldSkipEntries.push({
        index,
        entryId: entry.id,
        title: entry.reviewedTitle,
        reason: isDuplicate
          ? "Duplicate in manifest"
          : isNotApproved
            ? "Manifest approval or rights status blocked import"
            : "Conflicts with existing prompt data",
      });
    }
  }

  const duplicateCount = duplicatesList.length;
  const conflictsCount = conflictsList.length;
  const notApprovedCount = notApprovedEntries.length;
  const flaggedCount = new Set(flaggedForReviewEntries.map((item) => item.index)).size;
  const validCount = validEntries.length;
  const wouldInsertCount = wouldInsertEntries.length;
  const wouldSkipCount = wouldSkipEntries.length;

  return {
    total: list.length,
    valid: validCount,
    invalid: invalidEntries.length,
    duplicates: duplicateCount,
    conflicts: conflictsCount,
    notApproved: notApprovedCount,
    flaggedForReview: flaggedCount,
    wouldInsert: wouldInsertCount,
    wouldSkip: wouldSkipCount,
    invalidEntries,
    duplicatesList,
    notApprovedEntries,
    conflictsList,
    wouldInsertEntries,
    wouldSkipEntries,
    flaggedForReviewEntries,
    summary: {
      total: list.length,
      valid: validCount,
      invalid: invalidEntries.length,
      duplicates: duplicateCount,
      conflicts: conflictsCount,
      notApproved: notApprovedCount,
      flaggedForReview: flaggedCount,
      wouldInsert: wouldInsertCount,
      wouldSkip: wouldSkipCount,
    },
  };
}

export function createEmptyManifest(): ApprovedSourceEntry[] {
  return [];
}
