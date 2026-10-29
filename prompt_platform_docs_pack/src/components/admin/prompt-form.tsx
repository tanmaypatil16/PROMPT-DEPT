"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "@/app/admin/admin.module.css";

type Category = { id: string; name: string };

export type PromptFormValues = {
  title: string;
  slug: string;
  description: string;
  prompt_text: string;
  category_id: string;
  preview_image_url: string;
  preview_url: string;
  status: string;
  access_tier: string;
  is_featured: boolean;
  source_url: string;
  source_license: string;
  attribution: string;
  tag_names: string;
};

const defaults: PromptFormValues = {
  title: "",
  slug: "",
  description: "",
  prompt_text: "",
  category_id: "",
  preview_image_url: "",
  preview_url: "",
  status: "draft",
  access_tier: "free",
  is_featured: false,
  source_url: "",
  source_license: "",
  attribution: "",
  tag_names: "",
};

export function PromptForm({
  initial,
  promptId,
  onSaved,
}: {
  initial?: Partial<PromptFormValues>;
  promptId?: string;
  onSaved?: (slug: string) => void;
}) {
  const [values, setValues] = useState<PromptFormValues>({ ...defaults, ...initial });
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d: { categories: Category[] }) => setCategories(d.categories ?? []));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      ...values,
      category_id: values.category_id || null,
      preview_image_url: values.preview_image_url || null,
      preview_url: values.preview_url || null,
      source_url: values.source_url || null,
      source_license: values.source_license || null,
      attribution: values.attribution || null,
      tag_names: values.tag_names.split(/[,;|]/).map((t) => t.trim()).filter(Boolean),
    };
    const url = promptId ? `/api/admin/prompts/${promptId}` : "/api/admin/prompts";
    const method = promptId ? "PATCH" : "POST";
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Save failed");
      setSaving(false);
      return;
    }
    onSaved?.(data.prompt?.slug ?? values.slug);
    setSaving(false);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>Title<input required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} /></label>
      <label>Slug<input value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value })} placeholder="auto from title if empty" /></label>
      <label>Short description<textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
      <label>Prompt text<textarea required value={values.prompt_text} onChange={(e) => setValues({ ...values, prompt_text: e.target.value })} /></label>
      <label>
        Category
        <select value={values.category_id} onChange={(e) => setValues({ ...values, category_id: e.target.value })}>
          <option value="">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Tags (comma-separated)<input value={values.tag_names} onChange={(e) => setValues({ ...values, tag_names: e.target.value })} /></label>
      <label>Preview image URL<input value={values.preview_image_url} onChange={(e) => setValues({ ...values, preview_image_url: e.target.value })} /></label>
      <label>Website preview URL (approved HTTPS host)<input value={values.preview_url} onChange={(e) => setValues({ ...values, preview_url: e.target.value })} placeholder="https://sites.google.com/..." /></label>
      <label>Status
        <select value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label>Access tier
        <select value={values.access_tier} onChange={(e) => setValues({ ...values, access_tier: e.target.value })}>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </label>
      <label><input type="checkbox" checked={values.is_featured} onChange={(e) => setValues({ ...values, is_featured: e.target.checked })} /> Featured</label>
      <label>Source URL<input value={values.source_url} onChange={(e) => setValues({ ...values, source_url: e.target.value })} /></label>
      <label>License<input value={values.source_license} onChange={(e) => setValues({ ...values, source_license: e.target.value })} /></label>
      <label>Attribution<input value={values.attribution} onChange={(e) => setValues({ ...values, attribution: e.target.value })} /></label>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button className={styles.btn} type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        {values.status !== "published" && values.prompt_text && (
          <a className={styles.btnGhost} href={`/prompts/${values.slug || "preview"}`} target="_blank" rel="noreferrer">Preview public URL</a>
        )}
      </div>
    </form>
  );
}
