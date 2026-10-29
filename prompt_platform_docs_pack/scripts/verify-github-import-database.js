/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

function readEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).map((line) => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean).map((match) => [match[1].trim(), match[2].replace(/^['"]|['"]$/g, "")])) ;
}

async function main() {
  const env = { ...readEnvFile(".env.local"), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role environment is not configured.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const records = JSON.parse(fs.readFileSync("scripts/generated/github-prompts.json", "utf8"));
  const hashes = records.map((record) => record.content_hash);
  const existing = new Map();
  for (let index = 0; index < hashes.length; index += 200) {
    const { data, error } = await db.from("prompts").select("id,title,status,content_hash").in("content_hash", hashes.slice(index, index + 200));
    if (error) throw new Error(error.message);
    for (const row of data ?? []) existing.set(row.content_hash, row);
  }
  const statusResult = await db.from("prompts").select("status", { count: "exact", head: false }).eq("source_type", "github_import");
  if (statusResult.error) throw new Error(statusResult.error.message);
  const statuses = (statusResult.data ?? []).reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] ?? 0) + 1 }), {});
  const { data: categories, error: categoryError } = await db.from("categories").select("id,name,slug").in("slug", ["image", "website"]);
  if (categoryError) throw new Error(categoryError.message);
  console.log(JSON.stringify({
    database: new URL(url).host,
    candidates: records.length,
    existingByHash: existing.size,
    wouldInsert: records.length - existing.size,
    published: [...existing.values()].filter((row) => row.status === "published").length,
    importedStatuses: statuses,
    categories: categories ?? [],
  }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exit(1); });
