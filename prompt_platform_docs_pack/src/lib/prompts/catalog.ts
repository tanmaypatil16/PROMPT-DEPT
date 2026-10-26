import { createAdminClient } from "@/lib/supabase/admin";
import type { PromptSample } from "@/data/prompts";
import { userHasPremiumAccess } from "@/lib/auth/entitlements";

type DbPromptRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt_text: string;
  preview_image_url: string | null;
  access_tier: string;
  is_featured: boolean;
  categories: { name: string; slug: string } | null;
  prompt_tags: { tags: { name: string } | null }[];
};

function mapRowToSample(row: DbPromptRow, includePremiumText: boolean): PromptSample {
  const premium = row.access_tier === "premium";
  const categoryName = row.categories?.name ?? "Uncategorized";
  const tags = row.prompt_tags?.map((pt) => pt.tags?.name).filter(Boolean) as string[] ?? [];
  return {
    id: row.slug,
    title: row.title,
    category: categoryName,
    tags,
    description: row.description,
    prompt: premium && !includePremiumText
      ? "This is a premium prompt. Sign in with an active subscription to view the full text."
      : row.prompt_text,
    image: row.preview_image_url ?? "/figma-assets/gallery-study.svg",
    premium: premium || undefined,
    aspect: "landscape",
  };
}

export async function listPublishedPrompts(options: {
  query?: string;
  category?: string;
  userId?: string | null;
}): Promise<{ prompts: PromptSample[]; source: string } | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  let q = admin
    .from("prompts")
    .select(`
      id, slug, title, description, prompt_text, preview_image_url, access_tier, is_featured,
      categories ( name, slug ),
      prompt_tags ( tags ( name ) )
    `)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false, nullsFirst: false });

  const categorySlug = options.category?.trim().toLowerCase();
  if (categorySlug && categorySlug !== "all") {
    const slugMap: Record<string, string> = {
      image: "image",
      website: "website",
      "3d & motion": "3d-motion",
      code: "code",
      writing: "writing",
      "study & exams": "study-exams",
      "product photo": "product-photo",
      architecture: "architecture",
      "visual experiment": "visual-experiment",
    };
    const mapped = slugMap[categorySlug] ?? categorySlug;
    const { data: categoryRow } = await admin.from("categories").select("id").eq("slug", mapped).maybeSingle();
    if (categoryRow?.id) q = q.eq("category_id", categoryRow.id);
  }

  const { data, error } = await q.limit(200);
  if (error || !data) return { prompts: [], source: "database" };

  const premiumAccess = await userHasPremiumAccess(options.userId ?? null);
  let prompts = (data as unknown as DbPromptRow[]).map((row) => mapRowToSample(row, premiumAccess));

  const search = options.query?.trim().toLowerCase();
  if (search) {
    prompts = prompts.filter((p) => {
      const hay = [p.title, p.category, p.description, ...p.tags].join(" ").toLowerCase();
      return hay.includes(search);
    });
  }

  return { prompts, source: "database" };
}

export async function getPublishedPromptBySlug(slug: string, userId?: string | null) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("prompts")
    .select(`
      id, slug, title, description, prompt_text, preview_image_url, access_tier,
      categories ( name, slug ),
      prompt_tags ( tags ( name ) )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("visibility", "public")
    .maybeSingle();
  if (error || !data) return null;
  const premiumAccess = await userHasPremiumAccess(userId ?? null);
  return {
    prompt: mapRowToSample(data as unknown as DbPromptRow, premiumAccess),
    dbId: (data as { id: string }).id,
    source: "database" as const,
  };
}
