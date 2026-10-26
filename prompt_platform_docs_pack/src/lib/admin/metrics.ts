import { createAdminClient } from "@/lib/supabase/admin";

export type DateRangeDays = 7 | 30 | 90;

function throwOnQueryError(
  name: string,
  result: { error: { code?: string; message: string } | null },
) {
  if (result.error) {
    throw new Error(`Dashboard query "${name}" failed (${result.error.code ?? "unknown"}): ${result.error.message}`);
  }
}

function rangeStart(days: DateRangeDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function fetchDashboardMetrics(days: DateRangeDays) {
  const admin = createAdminClient();
  if (!admin) return null;

  const since = rangeStart(days);
  const monthStart = rangeStart(30);
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);

  const [
    usersTotal,
    usersNew,
    promptsTotal,
    promptsNew,
    publishedPrompts,
    draftPrompts,
    pendingPrompts,
    rejectedPrompts,
    archivedPrompts,
    likesCount,
    savesCount,
    viewsCount,
    copiesCount,
    studioStarts,
    registrations,
    viewsSeries,
    likesSeries,
    studioSeries,
    topPrompts,
    topCategories,
    recentEvents,
    importJobs,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("prompts").select("id", { count: "exact", head: true }),
    admin.from("prompts").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("prompts").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("prompts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    admin.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("prompts").select("id", { count: "exact", head: true }).eq("status", "archived"),
    admin.from("prompt_likes").select("prompt_id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("saved_prompts").select("prompt_id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "prompt_view").gte("occurred_at", since),
    admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "prompt_copy").gte("occurred_at", since),
    admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "prompt_studio_started").gte("occurred_at", since),
    admin.from("profiles").select("created_at").gte("created_at", since).order("created_at"),
    admin.from("analytics_events").select("occurred_at").eq("event_type", "prompt_view").gte("occurred_at", since),
    admin.from("analytics_events").select("occurred_at, event_type").in("event_type", ["prompt_like", "prompt_save"]).gte("occurred_at", since),
    admin.from("analytics_events").select("occurred_at").eq("event_type", "prompt_studio_started").gte("occurred_at", since),
    admin.from("analytics_events").select("prompt_id").eq("event_type", "prompt_view").gte("occurred_at", since).not("prompt_id", "is", null),
    admin.from("analytics_events").select("category_id, event_type").in("event_type", ["prompt_view", "prompt_like", "prompt_save", "prompt_copy", "prompt_studio_started"]).gte("occurred_at", since),
    admin.from("analytics_events").select("event_type, occurred_at").gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(20),
    admin.from("prompt_import_jobs").select("id, status, imported_records, failed_records, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const initialQueries = [
    ["total users", usersTotal],
    ["new users", usersNew],
    ["total prompts", promptsTotal],
    ["new prompts", promptsNew],
    ["published prompts", publishedPrompts],
    ["draft prompts", draftPrompts],
    ["pending prompts", pendingPrompts],
    ["rejected prompts", rejectedPrompts],
    ["archived prompts", archivedPrompts],
    ["likes in range", likesCount],
    ["saves in range", savesCount],
    ["prompt views in range", viewsCount],
    ["prompt copies in range", copiesCount],
    ["studio starts in range", studioStarts],
    ["registrations series", registrations],
    ["prompt views series", viewsSeries],
    ["likes and saves series", likesSeries],
    ["studio usage series", studioSeries],
    ["top prompts", topPrompts],
    ["category engagement", topCategories],
    ["recent activity", recentEvents],
    ["recent imports", importJobs],
  ] as const;
  for (const [name, result] of initialQueries) throwOnQueryError(name, result);

  const premiumResult = await admin.from("prompts").select("id", { count: "exact", head: true }).eq("access_tier", "premium");
  throwOnQueryError("premium prompts", premiumResult);

  const dau = await admin
    .from("analytics_events")
    .select("user_id, session_id")
    .gte("occurred_at", dayStart.toISOString());
  throwOnQueryError("daily active users", dau);
  const dauSet = new Set<string>();
  for (const e of dau.data ?? []) {
    if (e.user_id) dauSet.add(`u:${e.user_id}`);
    else if (e.session_id) dauSet.add(`s:${e.session_id}`);
  }

  const mau = await admin.from("analytics_events").select("user_id, session_id").gte("occurred_at", monthStart);
  throwOnQueryError("monthly active users", mau);
  const mauSet = new Set<string>();
  for (const e of mau.data ?? []) {
    if (e.user_id) mauSet.add(`u:${e.user_id}`);
    else if (e.session_id) mauSet.add(`s:${e.session_id}`);
  }

  const views = viewsCount.count ?? 0;
  const interactions = (likesCount.count ?? 0) + (savesCount.count ?? 0) + (copiesCount.count ?? 0);
  const engagementRate = views > 0 ? Math.round((interactions / views) * 1000) / 10 : null;

  function bucketByDay(rows: { timestamp: string }[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const day = row.timestamp.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
  }

  const promptViewCounts = new Map<string, number>();
  for (const row of topPrompts.data ?? []) {
    if (row.prompt_id) promptViewCounts.set(row.prompt_id, (promptViewCounts.get(row.prompt_id) ?? 0) + 1);
  }
  const topPromptIds = [...promptViewCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  let popularPrompts: { title: string; slug: string; views: number }[] = [];
  if (topPromptIds.length) {
    const promptRowsResult = await admin.from("prompts").select("id, title, slug").in("id", topPromptIds.map(([id]) => id));
    throwOnQueryError("top prompt details", promptRowsResult);
    const promptRows = promptRowsResult.data;
    popularPrompts = topPromptIds.map(([id, views]) => {
      const p = promptRows?.find((r) => r.id === id);
      return { title: p?.title ?? "Unknown", slug: p?.slug ?? id, views };
    });
  }

  const categoryCounts = new Map<string, number>();
  for (const row of topCategories.data ?? []) {
    if (row.category_id) categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
  }
  const topCatIds = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  let popularCategories: { name: string; events: number }[] = [];
  if (topCatIds.length) {
    const categoriesResult = await admin.from("categories").select("id, name").in("id", topCatIds.map(([id]) => id));
    throwOnQueryError("category details", categoriesResult);
    const cats = categoriesResult.data;
    popularCategories = topCatIds.map(([id, events]) => ({
      name: cats?.find((c) => c.id === id)?.name ?? "Unknown",
      events,
    }));
  }

  return {
    rangeDays: days,
    definitions: {
      views: "Count of prompt_view analytics events in range (each accepted event counts, including repeat views).",
      uniqueViewers: "Not shown on summary cards; use prompt detail analytics for session/user estimates.",
      dau: "Distinct authenticated user IDs or anonymous session IDs with any analytics event since UTC midnight.",
      mau: "Distinct authenticated user IDs or anonymous session IDs with any analytics event in the last 30 days.",
      engagementRate: "((likes + saves created + copies) in selected range) / prompt views in selected range; approximate.",
    },
    cards: {
      totalUsers: usersTotal.count ?? 0,
      newUsers: usersNew.count ?? 0,
      dau: dauSet.size,
      mau: mauSet.size,
      totalPrompts: promptsTotal.count ?? 0,
      newPrompts: promptsNew.count ?? 0,
      published: publishedPrompts.count ?? 0,
      draft: draftPrompts.count ?? 0,
      pendingReview: pendingPrompts.count ?? 0,
      premium: premiumResult.count ?? 0,
      promptViews: views,
      totalLikes: likesCount.count ?? 0,
      totalSaves: savesCount.count ?? 0,
      promptCopies: copiesCount.count ?? 0,
      studioGenerations: studioStarts.count ?? 0,
      engagementRate,
    },
    charts: {
      registrations: bucketByDay(registrations.data?.map((row) => ({ timestamp: row.created_at })) ?? []),
      promptViews: bucketByDay(viewsSeries.data?.map((row) => ({ timestamp: row.occurred_at })) ?? []),
      likesAndSaves: bucketByDay(likesSeries.data?.map((row) => ({ timestamp: row.occurred_at })) ?? []),
      studioUsage: bucketByDay(studioSeries.data?.map((row) => ({ timestamp: row.occurred_at })) ?? []),
      engagementByCategory: popularCategories,
      topPrompts: popularPrompts,
    },
    recentActivity: recentEvents.data ?? [],
    recentImports: importJobs.data ?? [],
  };
}
