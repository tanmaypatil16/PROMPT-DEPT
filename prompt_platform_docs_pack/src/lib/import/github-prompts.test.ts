import { describe, expect, it } from "vitest";
import { contentHash, parseImagePromptMarkdown, parseSitePromptMarkdown } from "./github-prompts";

const imageSample = `<a id="prompt-abc"></a>
### 1. Poster Prompt

**Prompt:**

\`\`\`text
A detailed {argument name="subject" default="robot"} poster.
\`\`\``;

const siteSample = `# AI Hero

> **Category:** AI / SaaS

## Prompt

\`\`\`text
Create a full-screen hero.
- Preserve the layout.
\`\`\`
`;

describe("GitHub prompt parsers", () => {
  it("parses image prompt entries and preserves placeholders", () => {
    const records = parseImagePromptMarkdown(imageSample, "https://github.com/liuxin2533/awesome-image-prompts/blob/master/docs/poster-illustration.md");
    expect(records).toHaveLength(1);
    expect(records[0].prompt_text).toContain('{argument name="subject" default="robot"}');
    expect(records[0].category).toBe("Image");
    expect(records[0].source_url).toContain("poster-illustration.md");
  });

  it("parses SitePrompt title and complete Markdown text", () => {
    const records = parseSitePromptMarkdown(siteSample, "prompts/AI_Hero.md", "0123456789012345678901234567890123456789");
    expect(records).toHaveLength(1);
    expect(records[0].title).toBe("AI Hero");
    expect(records[0].prompt_text).toContain("Preserve the layout.");
    expect(records[0].category).toBe("Website");
  });

  it("uses normalized stable hashes and resolves duplicate titles separately", () => {
    const hashA = contentHash("  Make   a Page ");
    const hashB = contentHash("make a page");
    expect(hashA).toBe(hashB);
    const records = parseImagePromptMarkdown(`${imageSample}\n${imageSample.replace('prompt-abc', 'prompt-def').replace('1. Poster Prompt', '2. Poster Prompt')}`, "https://raw.githubusercontent.com/liuxin2533/awesome-image-prompts/master/docs/poster-illustration.md");
    expect(records).toHaveLength(2);
    expect(records.map((record) => record.slug)).toEqual(["poster-prompt", "poster-prompt-2"]);
  });
});
