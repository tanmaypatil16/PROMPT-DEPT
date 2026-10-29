const ALLOWED_PREVIEW_HOSTS = new Set([
  "sites.google.com",
]);

export function isAllowedPreviewUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_PREVIEW_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sanitizePreviewUrl(value: string | null | undefined): string | null {
  return isAllowedPreviewUrl(value) ? value.trim() : null;
}
