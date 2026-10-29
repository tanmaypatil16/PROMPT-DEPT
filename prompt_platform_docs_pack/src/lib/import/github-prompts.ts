import { createHash } from "node:crypto";
import { slugify } from "@/lib/prompts/hash";

export type GithubPromptRecord = {
  title: string;
  description: string;
  prompt_text: string;
  category: string;
  tags: string[];
  slug: string;
  source_url: string;
  source_license: string;
  attribution: string;
  content_hash: string;
};

export function contentHash(promptText: string): string {
  const normalized = promptText.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

function uniqueSlugs(records: GithubPromptRecord[]): GithubPromptRecord[] {
  const used = new Map<string, number>();
  return records.map((record) => {
    const base = slugify(record.title) || "prompt";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return { ...record, slug: count === 0 ? base : `${base}-${count + 1}` };
  });
}

export function parseImagePromptMarkdown(markdown: string, sourceUrlBase: string): GithubPromptRecord[] {
  const sourceUrlBaseNormalized = sourceUrlBase.replace(/\/docs\/poster-illustration\.md$/, "/blob/master/docs/poster-illustration.md");
  const entryPattern = /<a id="prompt-[^"]+"><\/a>[\r\n]+###\s+\d+\.\s+([^\r\n]+)[\s\S]*?\*\*Prompt:\*\*[\r\n\s]*```(?:text)?[\r\n]+([\s\S]*?)\r?\n```/g;
  const records = Array.from(markdown.matchAll(entryPattern)).flatMap((match) => {
    const title = match[1].trim();
    const promptText = match[2].trim();
    if (!promptText) return [];
    const categories = match[0].match(/\*\*Categories:\*\*\s*(.+)/)?.[1]?.split(/[&,]/).map((value) => value.trim()).filter(Boolean) ?? [];
    return [{
      title,
      description: `${title} — imported from awesome-image-prompts.`,
      prompt_text: promptText,
      category: "Image",
      tags: ["image-generation", ...categories.map((value) => value.toLowerCase())].slice(0, 20),
      slug: slugify(title),
      source_url: sourceUrlBaseNormalized,
      source_license: "Permission confirmed by project owner; repository has no detected LICENSE file",
      attribution: "liuxin2533/awesome-image-prompts",
      content_hash: contentHash(promptText),
    }];
  });
  return uniqueSlugs(records);
}

export function parseSitePromptMarkdown(markdown: string, repositoryPath: string, commit: string): GithubPromptRecord[] {
  const codeFence = markdown.match(/```(?:text)?\s*\r?\n([\s\S]*?)\r?\n```/);
  if (!codeFence?.[1]?.trim()) return [];
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!heading) return [];
  const category = markdown.match(/^>\s*\*\*Category:\*\*\s*(.+)$/m)?.[1]?.replace(/\s+$/u, "").trim();
  const promptText = codeFence[1].trim();
  const record: GithubPromptRecord = {
    title: heading,
    description: `${heading} — imported from the SitePrompt repository.`,
    prompt_text: promptText,
    category: "Website",
    tags: ["website", "ui", ...(category ? category.split(/[/,]/).map((value) => value.trim()).filter(Boolean).map((value) => value.toLowerCase()) : [])].slice(0, 20),
    slug: slugify(heading),
    source_url: `https://github.com/im-286/siteprompt/blob/${commit}/${repositoryPath}`,
    source_license: "MIT",
    attribution: "im-286/siteprompt",
    content_hash: contentHash(promptText),
  };
  return [record];
}
