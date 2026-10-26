/**
 * Seed local sample prompts into Supabase as published drafts/published records.
 * Usage: npx tsx scripts/seed-sample-prompts.ts
 */
import { createClient } from "@supabase/supabase-js";
import { promptSamples } from "../src/data/prompts";
import { computeContentHash, slugify } from "../src/lib/prompts/hash";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  for (const sample of promptSamples) {
    const slug = sample.id;
    const { data: category } = await admin.from("categories").select("id").eq("slug", slugify(sample.category)).maybeSingle();
    const content_hash = computeContentHash(sample.prompt);
    const { error } = await admin.from("prompts").upsert(
      {
        title: sample.title,
        slug,
        description: sample.description,
        prompt_text: sample.prompt,
        category_id: category?.id ?? null,
        preview_image_url: sample.image,
        status: "published",
        access_tier: sample.premium ? "premium" : "free",
        visibility: "public",
        source_type: "manual",
        content_hash,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) console.warn(slug, error.message);
    else console.log("Seeded", slug);
  }
}

main().catch(console.error);
