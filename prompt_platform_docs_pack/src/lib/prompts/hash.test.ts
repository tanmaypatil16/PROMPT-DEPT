import { describe, expect, it } from "vitest";
import { computeContentHash, normalizePromptContent, slugify } from "./hash";

describe("prompt hash", () => {
  it("normalizes whitespace", () => {
    expect(normalizePromptContent("  Hello   World  ")).toBe("hello world");
  });

  it("produces stable hashes", () => {
    const a = computeContentHash("Same text");
    const b = computeContentHash("Same  text");
    expect(a).toBe(b);
  });

  it("slugifies titles", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});
