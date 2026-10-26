const ALLOWED_HOSTS = new Set(["raw.githubusercontent.com", "github.com", "gist.githubusercontent.com"]);

export function isAllowedGitHubUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") return false;
    if (!ALLOWED_HOSTS.has(url.hostname)) return false;
    if (url.hostname === "github.com" && !url.pathname.includes("/raw/")) {
      // Require raw content paths only
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchGitHubText(urlString: string, maxBytes = 2_000_000): Promise<string> {
  if (!isAllowedGitHubUrl(urlString)) {
    throw new Error("URL must be an HTTPS GitHub raw content URL");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: { Accept: "text/plain, application/json, text/markdown" },
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > maxBytes) throw new Error("File too large");
    const text = await response.text();
    if (text.length > maxBytes) throw new Error("File too large");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
