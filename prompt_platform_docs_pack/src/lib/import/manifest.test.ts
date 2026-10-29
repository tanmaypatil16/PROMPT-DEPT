import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyManifest, evaluateManifestDryRun, validateManifest } from "./manifest";

const { requireAdminMock, createAdminClientMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { POST } from "@/app/api/admin/import/manifest/route";

describe("import manifest validation", () => {
  it("accepts a valid approved source entry", () => {
    const result = validateManifest([
      {
        id: "siteprompt-demo-1",
        sourceRepository: "im-286/siteprompt",
        sourcePath: "prompts/test.md",
        sourceCommit: "f532072",
        reviewedTitle: "Storytelling prompt",
        reviewedDescription: "A prompt for concise story generation.",
        reviewedCategory: "Writing",
        reviewedTags: ["story", "creative"],
        licenseStatus: "confirmed",
        previewType: "placeholder",
        status: "approved",
      },
    ]);

    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);
  });

  it("rejects invalid entries", () => {
    const result = validateManifest([
      {
        id: "bad-entry",
        sourceRepository: "",
        reviewedTitle: "",
      },
    ]);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0]?.errors.length ?? 0).toBeGreaterThan(0);
  });

  it("detects duplicate source identities and blocked approval statuses", () => {
    const entries = [
      {
        id: "siteprompt-demo-1",
        sourceRepository: "im-286/siteprompt",
        sourcePath: "prompts/test.md",
        sourceCommit: "f532072",
        reviewedTitle: "Storytelling prompt",
        reviewedDescription: "A prompt for concise story generation.",
        reviewedCategory: "Writing",
        reviewedTags: ["story", "creative"],
        licenseStatus: "confirmed",
        previewType: "placeholder",
        status: "approved",
      },
      {
        id: "siteprompt-demo-1-duplicate",
        sourceRepository: "im-286/siteprompt",
        sourcePath: "prompts/test.md",
        sourceCommit: "f532072",
        reviewedTitle: "Storytelling prompt (copy)",
        reviewedDescription: "Duplicate source.",
        reviewedCategory: "Writing",
        reviewedTags: ["story"],
        licenseStatus: "confirmed",
        previewType: "placeholder",
        status: "approved",
      },
      {
        id: "siteprompt-demo-2",
        sourceRepository: "im-286/siteprompt",
        sourcePath: "prompts/blocked.md",
        sourceCommit: "abc123",
        reviewedTitle: "Blocked prompt",
        reviewedDescription: "Pending rights review.",
        reviewedCategory: "Writing",
        reviewedTags: ["story"],
        licenseStatus: "review-pending",
        previewType: "placeholder",
        status: "approved",
      },
    ];

    const result = evaluateManifestDryRun(entries, [
      { id: "existing-1", slug: "storytelling-prompt", title: "Storytelling prompt", content_hash: "1".padEnd(64, "0") },
    ]);

    expect(result.summary.total).toBe(3);
    expect(result.duplicates).toBeGreaterThan(0);
    expect(result.notApproved).toBe(1);
    expect(result.wouldInsert).toBeLessThanOrEqual(1);
  });

  it("supports an empty manifest", () => {
    expect(createEmptyManifest()).toEqual([]);
    expect(evaluateManifestDryRun([]).summary).toMatchObject({
      total: 0,
      valid: 0,
      invalid: 0,
      wouldInsert: 0,
      wouldSkip: 0,
    });
  });

  it("rejects malformed request payloads and short-circuits on unauthorized access", async () => {
    requireAdminMock.mockResolvedValueOnce(null);
    const forbidden = await POST(new Request("http://localhost/api/admin/import/manifest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entries: [{ id: "ok" }] }),
    }));
    expect(forbidden.status).toBe(403);

    requireAdminMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    const malformed = await POST(new Request("http://localhost/api/admin/import/manifest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entries: "nope" }),
    }));
    expect(malformed.status).toBe(400);
  });

  it("returns a 413 for oversized manifests and does not write to the database", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    const largeEntries = Array.from({ length: 300 }, (_, index) => ({
      id: `manifest-${index}`,
      sourceRepository: "example/repo",
      sourcePath: `prompts/${index}.md`,
      reviewedTitle: `Prompt ${index}`,
      sourceContentHash: "a".repeat(64),
      reviewNotes: "reviewed",
      licenseStatus: "confirmed",
      status: "approved",
      previewType: "placeholder",
      reviewedDescription: "Valid prompt content for dry-run review.",
    }));

    const response = await POST(new Request("http://localhost/api/admin/import/manifest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entries: largeEntries }),
    }));
    expect(response.status).toBe(413);
  });

  beforeEach(() => {
    requireAdminMock.mockReset();
    createAdminClientMock.mockReset();
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: [] }),
        insert: vi.fn(() => { throw new Error("No writes should occur in a dry run"); }),
      })),
    });
  });
});
