import Papa from "papaparse";
import { z } from "zod";
import { computeContentHash, slugify } from "@/lib/prompts/hash";

export const importRecordSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  prompt_text: z.string().min(1).max(50000),
  category: z.string().max(100).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  preview_image_url: z.string().url().max(2000).optional().or(z.literal("")),
  source_url: z.string().url().max(2000).optional(),
  source_license: z.string().max(500).optional(),
  attribution: z.string().max(500).optional(),
  access_tier: z.enum(["free", "premium"]).optional(),
});

export type ImportRecord = z.infer<typeof importRecordSchema> & {
  rowNumber: number;
  content_hash: string;
  normalized_tags: string[];
};

export type ParsedImportResult = {
  records: ImportRecord[];
  invalid: { rowNumber: number; errors: string[] }[];
};

const FIELD_ALIASES: Record<string, keyof z.infer<typeof importRecordSchema>> = {
  title: "title",
  name: "title",
  slug: "slug",
  description: "description",
  summary: "description",
  prompt: "prompt_text",
  prompt_text: "prompt_text",
  text: "prompt_text",
  category: "category",
  tags: "tags",
  preview_image_url: "preview_image_url",
  image: "preview_image_url",
  source_url: "source_url",
  source_license: "source_license",
  license: "source_license",
  attribution: "attribution",
  access_tier: "access_tier",
};

export function applyFieldMapping(row: Record<string, unknown>, mapping: Record<string, string>) {
  const mapped: Record<string, unknown> = {};
  for (const [sourceCol, destField] of Object.entries(mapping)) {
    const field = FIELD_ALIASES[destField] ?? (destField as keyof z.infer<typeof importRecordSchema>);
    if (row[sourceCol] !== undefined && row[sourceCol] !== null && row[sourceCol] !== "") {
      mapped[field] = row[sourceCol];
    }
  }
  return mapped;
}

function normalizeTags(tags: string | string[] | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean).slice(0, 20);
  return tags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean).slice(0, 20);
}

export function parseCsvContent(content: string, mapping?: Record<string, string>): ParsedImportResult {
  const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
  const records: ImportRecord[] = [];
  const invalid: ParsedImportResult["invalid"] = [];
  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const raw = mapping ? applyFieldMapping(row, mapping) : row;
    if (!raw.slug && typeof raw.title === "string") raw.slug = slugify(raw.title);
    const result = importRecordSchema.safeParse(raw);
    if (!result.success) {
      invalid.push({ rowNumber, errors: result.error.issues.map((i) => i.message) });
      return;
    }
    const data = result.data;
    records.push({
      ...data,
      slug: data.slug ?? slugify(data.title),
      description: data.description ?? "",
      rowNumber,
      content_hash: computeContentHash(data.prompt_text),
      normalized_tags: normalizeTags(data.tags),
    });
  });
  return { records, invalid };
}

export function parseJsonContent(content: string, mapping?: Record<string, string>): ParsedImportResult {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return { records: [], invalid: [{ rowNumber: 1, errors: ["Invalid JSON"] }] };
  }
  const rows = Array.isArray(json) ? json : (json as { prompts?: unknown[] }).prompts;
  if (!Array.isArray(rows)) {
    return { records: [], invalid: [{ rowNumber: 1, errors: ["JSON must be an array or { prompts: [] }"] }] };
  }
  const records: ImportRecord[] = [];
  const invalid: ParsedImportResult["invalid"] = [];
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (typeof row !== "object" || row === null) {
      invalid.push({ rowNumber, errors: ["Row must be an object"] });
      return;
    }
    const raw = mapping ? applyFieldMapping(row as Record<string, unknown>, mapping) : (row as Record<string, unknown>);
    if (!raw.slug && typeof raw.title === "string") raw.slug = slugify(raw.title);
    const result = importRecordSchema.safeParse(raw);
    if (!result.success) {
      invalid.push({ rowNumber, errors: result.error.issues.map((i) => i.message) });
      return;
    }
    const data = result.data;
    records.push({
      ...data,
      slug: data.slug ?? slugify(data.title),
      description: data.description ?? "",
      rowNumber,
      content_hash: computeContentHash(data.prompt_text),
      normalized_tags: normalizeTags(data.tags),
    });
  });
  return { records, invalid };
}
