import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { fetchVerifiedSource, getSourceIdentity, TRUSTED_SOURCE_REPOSITORY, validateSourceReference } from "./source-verification";

const reference = {
  sourceRepository: TRUSTED_SOURCE_REPOSITORY,
  sourcePath: "prompts/example.md",
  sourceCommit: "a".repeat(40),
};

describe("trusted import source verification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts only the fixed repository, immutable commit IDs, and supported Markdown paths", () => {
    expect(validateSourceReference(reference)).toBeNull();
    expect(validateSourceReference({ ...reference, sourceRepository: "attacker/repo" })).toContain("Only");
    expect(validateSourceReference({ ...reference, sourceCommit: "short" })).toContain("40-character");
    expect(validateSourceReference({ ...reference, sourcePath: "prompts/../secrets.md" })).toContain("Source path");
    expect(validateSourceReference({ ...reference, sourcePath: "README.md" })).toContain("Source path");
  });

  it("hashes fetched source bytes and derives identity without commit or client hash", async () => {
    const sourceText = "server fetched source";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return new Response(sourceText, {
        status: 200,
        headers: { "content-length": String(new TextEncoder().encode(sourceText).length) },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchVerifiedSource(reference);

    expect(result.sourceIdentity).toBe(getSourceIdentity(reference.sourceRepository, reference.sourcePath));
    expect(result.sourceContentHash).toBe(createHash("sha256").update(sourceText).digest("hex"));
    expect(fetchMock.mock.calls[0][1]?.redirect).toBe("error");
  });

  it("rejects unsafe paths before making a network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchVerifiedSource({ ...reference, sourcePath: "prompts/%2e%2e/secrets.md" })).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
