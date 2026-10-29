"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PromptForm, type PromptFormValues } from "@/components/admin/prompt-form";
import styles from "../../../admin.module.css";

export default function EditPromptPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Partial<PromptFormValues> | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/prompts/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        const p = data.prompt;
        setAnalytics(data.analytics);
        setInitial({
          title: p.title,
          slug: p.slug,
          description: p.description,
          prompt_text: p.prompt_text,
          category_id: p.category_id ?? "",
          preview_image_url: p.preview_image_url ?? "",
          preview_url: p.preview_url ?? "",
          status: p.status,
          access_tier: p.access_tier,
          is_featured: p.is_featured,
          source_url: p.source_url ?? "",
          source_license: p.source_license ?? "",
          attribution: p.attribution ?? "",
          tag_names: (p.prompt_tags ?? []).map((pt: { tags: { name: string } }) => pt.tags?.name).filter(Boolean).join(", "),
        });
      })
      .catch(() => setError("Prompt not found or unavailable."));
  }, [params.id]);

  if (error) return <p className={styles.error}>{error}</p>;
  if (!initial) return <p>Loading prompt…</p>;

  return (
    <>
      <h1>Edit prompt</h1>
      {analytics && (
        <div className={styles.grid} style={{ marginBottom: "1rem" }}>
          {Object.entries(analytics).map(([k, v]) => (
            <div className={styles.card} key={k}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      )}
      <PromptForm initial={initial} promptId={params.id} />
    </>
  );
}
