import { describe, expect, it } from "vitest";
import { parseCsvContent, parseJsonContent } from "./parse-records";

describe("import parsers", () => {
  it("parses CSV rows", () => {
    const csv = "title,prompt_text\nMy Prompt,Do something creative\n";
    const result = parseCsvContent(csv);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].title).toBe("My Prompt");
  });

  it("flags invalid CSV rows", () => {
    const csv = "title,prompt_text\n,short\n";
    const result = parseCsvContent(csv);
    expect(result.invalid.length).toBeGreaterThan(0);
  });

  it("parses JSON array", () => {
    const json = JSON.stringify([{ title: "A", prompt_text: "Long enough prompt text here." }]);
    const result = parseJsonContent(json);
    expect(result.records).toHaveLength(1);
  });
});
