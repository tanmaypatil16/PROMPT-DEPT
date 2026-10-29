/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const separator = line.indexOf("=");
  if (separator > 0) env[line.slice(0, separator).trim()] = line.slice(separator + 1).replace(/^["']|["']$/g, "").trim();
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await db.from("prompts")
    .select("id,title,slug,status,source_url")
    .or("title.ilike.%wealth%,title.ilike.%aureus%,slug.ilike.%wealth%,slug.ilike.%aureus%");
  console.log(error ?? JSON.stringify(data, null, 2));
})();
