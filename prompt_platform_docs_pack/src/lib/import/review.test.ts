import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { POST } from "@/app/api/admin/import/review/route";
import { getSourceIdentity, TRUSTED_SOURCE_REPOSITORY } from "./source-verification";

const COMMIT = "a".repeat(40);
const SOURCE_PATH = "prompts/example.md";

function reviewRequest(decision: Record<string, unknown>, decisions?: Record<string, unknown>[]) {
  return new Request("http://localhost/api/admin/import/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ decisions: decisions ?? [decision] }),
  });
}

function configureAdminDatabase({
  state = { data: null, error: null },
  rpc = { data: { review_status: "requires_review", reviewer_id: "admin-1", reviewed_at: "2026-10-27T00:00:00Z", updated_at: "2026-10-27T00:00:00Z", idempotent: false }, error: null },
}: {
  state?: { data: unknown; error: unknown };
  rpc?: { data: unknown; error: { code?: string; message?: string } | null };
} = {}) {
  const from = vi.fn((table: string) => {
    if (table !== "import_source_review_state") {
      throw new Error(`Unexpected table access: ${table}`);
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => state),
        })),
      })),
    };
  });
  const rpcMock = vi.fn(async (functionName: string, args: Record<string, unknown>) => {
    void functionName;
    void args;
    return rpc;
  });
  createAdminClientMock.mockReturnValue({ from, rpc: rpcMock });
  return { from, rpcMock };
}

function configureSourceFetch(content = "# Source prompt\nActual source text.") {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    void input;
    void init;
    return new Response(content, {
      status: 200,
      headers: { "content-type": "text/plain", "content-length": String(new TextEncoder().encode(content).length) },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function validDecision(overrides: Record<string, unknown> = {}) {
  return {
    entryId: "fixture-1",
    sourceRepository: TRUSTED_SOURCE_REPOSITORY,
    sourcePath: SOURCE_PATH,
    sourceCommit: COMMIT,
    reviewStatus: "requires_review",
    rationale: "Needs manual rights and content review.",
    ...overrides,
  };
}

describe("server-trusted import review state", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    createAdminClientMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects unauthenticated and unauthorized requests before fetching or writing", async () => {
    requireAdminMock.mockResolvedValue(null);
    const fetchMock = configureSourceFetch();

    const unauthenticated = await POST(reviewRequest(validDecision()));
    const unauthorized = await POST(reviewRequest(validDecision()));

    expect(unauthenticated.status).toBe(403);
    expect(unauthorized.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects malformed decisions and missing immutable source fields", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    const fetchMock = configureSourceFetch();
    const { rpcMock } = configureAdminDatabase();

    const response = await POST(reviewRequest(validDecision({ sourceCommit: undefined })));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("derives identity and SHA-256 from the server-fetched immutable source", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "trusted-admin-id" } });
    const sourceText = "# Fixture\nTrusted bytes.";
    const fetchMock = configureSourceFetch(sourceText);
    const { rpcMock } = configureAdminDatabase();

    const response = await POST(reviewRequest(validDecision()));
    const body = await response.json();
    const rpcArgs = rpcMock.mock.calls[0][1];
    const expectedHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sourceText));
    const expectedHashHex = Array.from(new Uint8Array(expectedHash), (byte) => byte.toString(16).padStart(2, "0")).join("");

    expect(response.status).toBe(200);
    expect(body.sourceIdentity).toBe(getSourceIdentity(TRUSTED_SOURCE_REPOSITORY, SOURCE_PATH));
    expect(rpcArgs.p_source_content_hash).toBe(expectedHashHex);
    expect(rpcArgs.p_source_identity).toBe(body.sourceIdentity);
    expect(rpcArgs.p_reviewer_id).toBe("trusted-admin-id");
    expect(fetchMock.mock.calls[0][0]).toBe(`https://raw.githubusercontent.com/${TRUSTED_SOURCE_REPOSITORY}/${COMMIT}/${SOURCE_PATH}`);
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe("error");
  });

  it("rejects client attempts to supply reviewer, identity, hash, rights, or manifest approval metadata", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    const fetchMock = configureSourceFetch();
    const { rpcMock } = configureAdminDatabase();

    const response = await POST(reviewRequest(validDecision({
      reviewerId: "attacker-id",
      sourceIdentity: "forged:identity",
      sourceContentHash: "b".repeat(64),
      manifestStatus: "approved",
      licenseStatus: "confirmed",
      rightsIndependentlyVerified: true,
    })));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("requires a meaningful rationale for an approval decision", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    const fetchMock = configureSourceFetch();
    const { rpcMock } = configureAdminDatabase();

    const response = await POST(reviewRequest(validDecision({
      reviewStatus: "approved",
      rationale: "ok",
    })));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("invalidates an older decision when the server-fetched source content changes", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    configureSourceFetch("# Changed content");
    const { rpcMock } = configureAdminDatabase({
      state: { data: { updated_at: "2026-10-26T12:00:00Z" }, error: null },
      rpc: {
        data: {
          review_status: "requires_review",
          reviewer_id: "admin-1",
          reviewed_at: "2026-10-27T00:00:00Z",
          updated_at: "2026-10-27T00:00:00Z",
          idempotent: false,
        },
        error: null,
      },
    });

    const response = await POST(reviewRequest(validDecision({
      reviewStatus: "approved",
      rationale: "Reviewed the updated source content for the next stage.",
    })));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewStatus).toBe("requires_review");
    expect(body.message).toContain("Source content changed");
    expect(rpcMock.mock.calls[0][1].p_expected_updated_at).toBe("2026-10-26T12:00:00Z");
  });

  it("rejects duplicate identities and multi-entry batches before any mutation", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    const fetchMock = configureSourceFetch();
    const { rpcMock } = configureAdminDatabase();
    const decision = validDecision();

    const duplicate = await POST(reviewRequest(decision, [decision, { ...decision, entryId: "duplicate" }]));
    const batch = await POST(reviewRequest(decision, [decision, { ...decision, sourcePath: "prompts/other.md" }]));

    expect(duplicate.status).toBe(409);
    expect(batch.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns a conflict for concurrent state changes and rejects invalid transitions", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    configureSourceFetch();
    const { rpcMock } = configureAdminDatabase({
      state: { data: { updated_at: "2026-10-27T00:00:00Z" }, error: null },
      rpc: { data: null, error: { code: "40001", message: "concurrent state change" } },
    });

    const concurrent = await POST(reviewRequest(validDecision({ reviewStatus: "approved", rationale: "Reviewed and approved after human consideration." })));
    expect(concurrent.status).toBe(409);

    rpcMock.mockResolvedValueOnce({ data: null, error: { code: "22023", message: "Invalid review status transition" } });
    const invalidTransition = await POST(reviewRequest(validDecision({ reviewStatus: "approved", rationale: "Reviewed and approved after human consideration." })));
    expect(invalidTransition.status).toBe(400);
  });

  it("fails without success when database reads or the transactional audit write fail", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    configureSourceFetch();
    const readFailure = configureAdminDatabase({
      state: { data: null, error: { message: "database unavailable" } },
    });

    const readResponse = await POST(reviewRequest(validDecision()));
    expect(readResponse.status).toBe(500);
    expect(readFailure.rpcMock).not.toHaveBeenCalled();

    const writeFailure = configureAdminDatabase({
      rpc: { data: null, error: { code: "XX000", message: "transaction rolled back after audit failure" } },
    });
    const writeResponse = await POST(reviewRequest(validDecision()));
    expect(writeResponse.status).toBe(500);
    expect(writeFailure.rpcMock).toHaveBeenCalledTimes(1);
  });

  it("only accesses review state and never writes prompt records or uploads assets", async () => {
    requireAdminMock.mockResolvedValueOnce({ user: { id: "admin-1" } });
    configureSourceFetch();
    const { from, rpcMock } = configureAdminDatabase();

    const response = await POST(reviewRequest(validDecision()));

    expect(response.status).toBe(200);
    expect(from.mock.calls.map(([table]) => table)).toEqual(["import_source_review_state"]);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
