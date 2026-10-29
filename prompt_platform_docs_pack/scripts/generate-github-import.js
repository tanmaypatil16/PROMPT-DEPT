/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const crypto = require("node:crypto");

const imageRepo = "liuxin2533/awesome-image-prompts";
const siteRepo = "im-286/siteprompt";

async function githubJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function githubText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

function hash(text) {
  return crypto.createHash("sha256").update(text.trim().replace(/\s+/g, " ").toLowerCase()).digest("hex");
}

function uniqueSlugs(records) {
  const counts = new Map();
  return records.map((record) => {
    const base = slugify(record.title) || "prompt";
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    return { ...record, slug: count ? `${base}-${count + 1}` : base };
  });
}

async function main() {
  const imageCommit = (await githubJson(`https://api.github.com/repos/${imageRepo}/commits/master`)).sha;
  const siteCommit = (await githubJson(`https://api.github.com/repos/${siteRepo}/commits/main`)).sha;
  const imagePath = "docs/poster-illustration.md";
  const imageMarkdown = await githubText(`https://raw.githubusercontent.com/${imageRepo}/${imageCommit}/${imagePath}`);
  const imageRecords = [];
  const imagePattern = /<a id="prompt-[^"]+"><\/a>[\r\n]+###\s+(\d+)\.\s+([^\r\n]+)[\s\S]*?\*\*Prompt:\*\*[\r\n\s]*```(?:text)?[\r\n]+([\s\S]*?)\r?\n```/g;
  for (const match of imageMarkdown.matchAll(imagePattern)) {
    const promptText = match[3].trim();
    if (!promptText) continue;
    const chunkStart = match.index;
    const title = match[2].trim();
    const chunk = imageMarkdown.slice(chunkStart, chunkStart + match[0].length);
    const category = chunk.match(/\*\*Categories:\*\*\s*(.+)/)?.[1] || "Poster & Illustration";
    imageRecords.push({
      title,
      description: `${title} — imported from awesome-image-prompts.`,
      prompt_text: promptText,
      category: "Image",
      tags: ["image-generation", ...category.split(/[&,]/).map((value) => value.trim().toLowerCase()).filter(Boolean)].slice(0, 20),
      source_url: `https://github.com/${imageRepo}/blob/${imageCommit}/${imagePath}`,
      source_license: "Permission confirmed by project owner; repository has no detected license file",
      attribution: `${imageRepo}`,
    });
  }

  const tree = await githubJson(`https://api.github.com/repos/${siteRepo}/git/trees/${siteCommit}?recursive=1`);
  const paths = tree.tree.map((entry) => entry.path).filter((path) => /^(prompts|Pro-prompts)\/[^/]+\.md$/i.test(path));
  const siteRecords = [];
  for (const path of paths) {
    const markdown = await githubText(`https://raw.githubusercontent.com/${siteRepo}/${siteCommit}/${path}`);
    const promptMatch = markdown.match(/```(?:text)?\s*\n([\s\S]*?)\n```/);
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (!promptMatch || !titleMatch) continue;
    const categoryMatch = markdown.match(/^>\s*\*\*Category:\*\*\s*(.+)$/m);
    const category = (categoryMatch?.[1] || "Website").replace(/\s+$/u, "").trim();
    const promptText = promptMatch[1].trim();
    siteRecords.push({
      title: titleMatch[1].trim(),
      description: `${titleMatch[1].trim()} — imported from the SitePrompt repository.`,
      prompt_text: promptText,
      category: "Website",
      tags: ["website", "ui", ...category.split(/[/,]/).map((value) => value.trim().toLowerCase()).filter(Boolean)].slice(0, 20),
      source_url: `https://github.com/${siteRepo}/blob/${siteCommit}/${path}`,
      source_license: "MIT License",
      attribution: `${siteRepo} (MIT License)`,
    });
  }

  let records = uniqueSlugs([...imageRecords, ...siteRecords]);
  const seenHashes = new Set();
  records = records.filter((record) => {
    const recordHash = hash(record.prompt_text);
    if (seenHashes.has(recordHash)) return false;
    seenHashes.add(recordHash);
    return true;
  });
  records = records.map((record) => ({ ...record, content_hash: hash(record.prompt_text), access_tier: "free" }));
  fs.mkdirSync("scripts/generated", { recursive: true });
  fs.writeFileSync("scripts/generated/github-prompts.json", JSON.stringify(records, null, 2));
  fs.writeFileSync("scripts/generated/github-import-summary.json", JSON.stringify({
    imageCommit,
    siteCommit,
    discoveredImage: imageRecords.length,
    discoveredSite: siteRecords.length,
    discovered: imageRecords.length + siteRecords.length,
    importedCandidateCount: records.length,
    imageCount: records.filter((record) => record.category === "Image").length,
    siteCount: records.filter((record) => record.category === "Website").length,
  }, null, 2));
  console.log(JSON.stringify({ imageCommit, siteCommit, image: imageRecords.length, site: siteRecords.length, records: records.length }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
