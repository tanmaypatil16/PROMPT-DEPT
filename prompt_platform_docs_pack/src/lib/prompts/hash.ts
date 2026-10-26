import { createHash } from "crypto";

export function normalizePromptContent(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function computeContentHash(text: string): string {
  return createHash("sha256").update(normalizePromptContent(text)).digest("hex");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
