import { z } from "zod";

export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "prompt_view",
  "prompt_like",
  "prompt_unlike",
  "prompt_save",
  "prompt_unsave",
  "prompt_copy",
  "search_performed",
  "category_selected",
  "prompt_studio_started",
  "prompt_generation_completed",
  "prompt_generation_failed",
  "signup_completed",
  "login_completed",
  "subscription_checkout_started",
  "subscription_activated",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const analyticsEventSchema = z.object({
  eventId: z.string().uuid().optional(),
  eventType: z.enum(ANALYTICS_EVENT_TYPES),
  occurredAt: z.string().datetime().optional(),
  promptId: z.string().uuid().optional(),
  promptSlug: z.string().max(200).optional(),
  categorySlug: z.string().max(100).optional(),
  sessionId: z.string().max(128).optional(),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;

const FORBIDDEN_PROPERTY_KEYS = /password|token|secret|api[_-]?key|authorization/i;

export function sanitizeEventProperties(properties: Record<string, string | number | boolean> | undefined) {
  if (!properties) return {};
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_PROPERTY_KEYS.test(key)) continue;
    if (typeof value === "string" && value.length > 500) continue;
    safe[key] = value;
  }
  return safe;
}
