/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

function readEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).map((line) => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean).map((match) => [match[1].trim(), match[2].replace(/^['"]|['"]$/g, "")])) ;
}

async function main() {
  if (process.env.PROMPT_IMPORT_AUTHORIZED !== "confirmed") throw new Error("Set PROMPT_IMPORT_AUTHORIZED=confirmed only after approving the target import.");
  const env = { ...readEnvFile(".env.local"), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role environment is not configured.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const admin = await db.from("profiles").select("id").eq("role", "admin").eq("account_status", "active").limit(1).maybeSingle();
  if (admin.error) throw new Error(admin.error.message);
  if (!admin.data) throw new Error("No active administrator profile is available for the import audit trail.");

  const records = JSON.parse(fs.readFileSync("scripts/generated/github-prompts.json", "utf8"));
  const categories = await db.from("categories").select("id,slug").in("slug", ["image", "website"]);
  if (categories.error) throw new Error(categories.error.message);
  const categoryIds = Object.fromEntries((categories.data ?? []).map((category) => [category.slug, category.id]));
  const { data: job, error: jobError } = await db.from("prompt_import_jobs").insert({
    created_by: admin.data.id,
    source_type: "github",
    source_url: "https://github.com/liuxin2533/awesome-image-prompts and https://github.com/im-286/siteprompt",
    original_filename: "github-prompts.json",
    status: "processing",
    total_records: records.length,
    started_at: new Date().toISOString(),
  }).select("id").single();
  if (jobError) throw new Error(jobError.message);

  let imported = 0;
  let duplicate = 0;
  let failed = 0;
  const usedSlugs = new Set();
  for (let index = 0; index < records.length; index += 25) {
    for (const record of records.slice(index, index + 25)) {
      const { data: existing } = await db.from("prompts").select("id").eq("content_hash", record.content_hash).maybeSingle();
      if (existing) { duplicate++; continue; }
      let slug = record.slug;
      const { data: slugConflict } = await db.from("prompts").select("id,slug").eq("slug", slug).maybeSingle();
      if (slugConflict || usedSlugs.has(slug)) {
        let suffix = 2;
        while (usedSlugs.has(`${slug}-${suffix}`) || (await db.from("prompts").select("id").eq("slug", `${slug}-${suffix}`).maybeSingle()).data) suffix++;
        slug = `${slug}-${suffix}`;
      }
      usedSlugs.add(slug);
      const { data: inserted, error } = await db.from("prompts").insert({
        title: record.title,
        slug,
        description: record.description,
        prompt_text: record.prompt_text,
        category_id: categoryIds[record.category.toLowerCase()] ?? null,
        status: "draft",
        access_tier: "free",
        source_type: "github_import",
        source_url: record.source_url,
        source_license: record.source_license,
        attribution: record.attribution,
        content_hash: record.content_hash,
        author_id: admin.data.id,
        preview_image_url: null,
      }).select("id").single();
      if (error || !inserted) { failed++; continue; }
      imported++;
    }
  }
  await db.from("prompt_import_jobs").update({
    status: failed ? "completed_with_errors" : "completed",
    imported_records: imported,
    duplicate_records: duplicate,
    failed_records: failed,
    completed_at: new Date().toISOString(),
  }).eq("id", job.id);
  console.log(JSON.stringify({ jobId: job.id, imported, duplicate, failed, published: 0 }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exit(1); });
