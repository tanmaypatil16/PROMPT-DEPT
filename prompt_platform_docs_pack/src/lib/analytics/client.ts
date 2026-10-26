"use client";

import type { AnalyticsEventType } from "@/lib/analytics/events";

const SESSION_KEY = "pd_analytics_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackEvent(
  eventType: AnalyticsEventType,
  payload?: {
    promptSlug?: string;
    promptId?: string;
    categorySlug?: string;
    properties?: Record<string, string | number | boolean>;
  },
) {
  const body = {
    eventType,
    sessionId: getSessionId(),
    promptSlug: payload?.promptSlug,
    promptId: payload?.promptId,
    categorySlug: payload?.categorySlug,
    properties: payload?.properties,
  };
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Non-blocking; ignore analytics failures
  });
}
