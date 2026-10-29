"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../../admin.module.css";

type PromptRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  access_tier: string;
  is_featured: boolean;
  updated_at: string;
  categories: { name: string } | null;
};

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    fetch(`/api/admin/prompts?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load prompts");
        return r.json() as Promise<{ prompts: PromptRow[] }>;
      })
      .then((data) => setPrompts(data.prompts))
      .catch(() => setError("Could not load prompts."))
      .finally(() => setLoading(false));
  }, [q, status]);

  return (
    <>
      <div className={styles.actions} style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Prompts</h1>
          <p style={{ color: "var(--muted)" }}>Search, filter, and manage catalog content.</p>
        </div>
        <Link className={styles.btn} href="/admin/prompts/new">Add prompt</Link>
      </div>
      <div className={styles.actions}>
        <input placeholder="Search title or slug" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Title</th><th>Status</th><th>Tier</th><th>Category</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/admin/prompts/${p.id}`}>{p.title}</Link></td>
                  <td>{p.status}</td>
                  <td>{p.access_tier}</td>
                  <td>{p.categories?.name ?? "—"}</td>
                  <td>{new Date(p.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
