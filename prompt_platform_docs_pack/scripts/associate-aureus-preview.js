/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const separator = line.indexOf("=");
  if (separator > 0) env[line.slice(0, separator).trim()] = line.slice(separator + 1).replace(/^["']|["']$/g, "").trim();
}
(async () => {
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const previewUrl = "https://sites.google.com/view/aureuswealth/full-page-embed";
  const { data: prompt, error: findError } = await db.from("prompts").select("id,title,slug,preview_url").eq("slug", "wealth-video-hero").maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!prompt) throw new Error("Wealth Video Hero prompt was not found.");
  const { error: updateError } = await db.from("prompts").update({ preview_url: previewUrl }).eq("id", prompt.id);
  if (updateError) throw new Error(updateError.message);
  console.log(JSON.stringify({ id: prompt.id, slug: prompt.slug, previewUrl }, null, 2));
})();
