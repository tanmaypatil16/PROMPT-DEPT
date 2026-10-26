function required(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(required("NEXT_PUBLIC_SUPABASE_URL") && getSupabasePublicKey());
}

function getSupabasePublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || undefined;
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = getSupabasePublicKey();
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return required("SUPABASE_SECRET_KEY") ?? required("SUPABASE_SERVICE_ROLE_KEY");
}

export const analyticsConfig = {
  retentionDays: Number(process.env.ANALYTICS_RETENTION_DAYS ?? "365"),
  rateLimitPerMinute: Number(process.env.ANALYTICS_RATE_LIMIT_PER_MINUTE ?? "120"),
};
