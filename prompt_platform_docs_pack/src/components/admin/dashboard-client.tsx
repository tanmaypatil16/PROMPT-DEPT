"use client";

import { useEffect, useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { CategoryBarChart, RegistrationsChart, ViewsChart } from "./dashboard-charts";

type Days = 7 | 30 | 90;

export function DashboardClient() {
  const [days, setDays] = useState<Days>(30);
  const [loadedDays, setLoadedDays] = useState<Days | null>(null);
  const loading = loadedDays !== days;
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    configured: boolean;
    empty?: boolean;
    message?: string;
    error?: string;
    metrics?: {
      cards: Record<string, number | null>;
      charts: {
        registrations: { date: string; count: number }[];
        promptViews: { date: string; count: number }[];
        likesAndSaves: { date: string; count: number }[];
        studioUsage: { date: string; count: number }[];
        engagementByCategory: { name: string; events: number }[];
        topPrompts: { title: string; slug: string; views: number }[];
      };
      recentActivity: { event_type: string; occurred_at: string }[];
      recentImports: { id: string; status: string; imported_records: number; failed_records: number; created_at: string }[];
      definitions: Record<string, string>;
    };
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/dashboard?days=${days}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? result.message ?? `Request failed (${response.status}).`);
        }
        setPayload(result);
        setError(null);
        setLoadedDays(days);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Dashboard metrics request failed.");
        setLoadedDays(days);
      });
    return () => controller.abort();
  }, [days]);

  if (loading) return <p>Loading metrics…</p>;
  if (error) return <div className={styles.empty} role="alert">{error}</div>;
  if (!payload?.configured) {
    return <div className={styles.empty} role="alert">
      {payload?.message ?? "Supabase dashboard configuration is unavailable."}
    </div>;
  }
  const m = payload.metrics;
  if (!m) return <div className={styles.empty}>No metrics available.</div>;

  const cards: { label: string; value: string | number }[] = [
    { label: "Total users", value: m.cards.totalUsers ?? 0 },
    { label: "New users", value: m.cards.newUsers ?? 0 },
    { label: "DAU (estimate)", value: m.cards.dau ?? 0 },
    { label: "MAU (estimate)", value: m.cards.mau ?? 0 },
    { label: "Total prompts", value: m.cards.totalPrompts ?? 0 },
    { label: "New prompts", value: m.cards.newPrompts ?? 0 },
    { label: "Published", value: m.cards.published ?? 0 },
    { label: "Drafts", value: m.cards.draft ?? 0 },
    { label: "Pending review", value: m.cards.pendingReview ?? 0 },
    { label: "Premium prompts", value: m.cards.premium ?? 0 },
    { label: "Prompt views", value: m.cards.promptViews ?? 0 },
    { label: "Likes", value: m.cards.totalLikes ?? 0 },
    { label: "Saves", value: m.cards.totalSaves ?? 0 },
    { label: "Copies", value: m.cards.promptCopies ?? 0 },
    { label: "Studio starts", value: m.cards.studioGenerations ?? 0 },
    { label: "Engagement rate %", value: m.cards.engagementRate ?? "—" },
  ];

  return (
    <>
      <div className={styles.filters}>
        {([7, 30, 90] as Days[]).map((d) => (
          <button key={d} type="button" data-selected={days === d} onClick={() => setDays(d)}>{d} days</button>
        ))}
      </div>
      <div className={styles.grid}>
        {cards.map((c) => (
          <div className={styles.card} key={c.label}><span>{c.label}</span><strong>{c.value}</strong></div>
        ))}
      </div>
      <div className={styles.chartBox}>
        <h2>User registrations</h2>
        <RegistrationsChart data={m.charts.registrations} />
      </div>
      <div className={styles.chartBox}>
        <h2>Prompt views</h2>
        <ViewsChart data={m.charts.promptViews} />
      </div>
      <div className={styles.chartBox}>
        <h2>Engagement by category</h2>
        <CategoryBarChart data={m.charts.engagementByCategory} />
      </div>
      <div className={styles.chartBox}>
        <h2>Top prompts (views in range)</h2>
        {m.charts.topPrompts.length ? (
          <ul>
            {m.charts.topPrompts.map((p) => (
              <li key={p.slug}>{p.title} — {p.views} views</li>
            ))}
          </ul>
        ) : (
          <p>No view data yet.</p>
        )}
      </div>
      <h2>Recent activity</h2>
      {m.recentActivity.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Event</th><th>Time</th></tr></thead>
            <tbody>
              {m.recentActivity.map((e, i) => (
                <tr key={`${e.event_type}-${e.occurred_at}-${i}`}><td>{e.event_type}</td><td>{new Date(e.occurred_at).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>No analytics events recorded yet.</div>
      )}
      <h2>Recent imports</h2>
      {m.recentImports.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Status</th><th>Imported</th><th>Failed</th><th>Started</th></tr></thead>
            <tbody>
              {m.recentImports.map((job) => (
                <tr key={job.id}>
                  <td>{job.status}</td>
                  <td>{job.imported_records}</td>
                  <td>{job.failed_records}</td>
                  <td>{new Date(job.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>No import jobs yet.</div>
      )}
      <details style={{ marginTop: "1.5rem", color: "var(--muted)" }}>
        <summary>Metric definitions</summary>
        <ul>{Object.entries(m.definitions).map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}</ul>
      </details>
    </>
  );
}
