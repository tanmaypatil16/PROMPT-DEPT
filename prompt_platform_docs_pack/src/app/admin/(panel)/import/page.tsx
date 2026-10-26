"use client";

import { useState } from "react";
import styles from "../../admin.module.css";

export default function AdminImportPage() {
  const [sourceType, setSourceType] = useState<"csv" | "json" | "github">("csv");
  const [content, setContent] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<{ summary: Record<string, number>; records: unknown[] } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadFile(file: File) {
    setFilename(file.name);
    setContent(await file.text());
  }

  async function runPreview() {
    setBusy(true);
    setResult(null);
    const response = await fetch("/api/admin/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType, content, githubUrl }),
    });
    const data = await response.json();
    if (!response.ok) setResult(data.error ?? "Preview failed");
    else setPreview(data);
    setBusy(false);
  }

  async function runImport() {
    if (!confirm("Import eligible records as drafts?")) return;
    setBusy(true);
    const response = await fetch("/api/admin/import/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType, content, githubUrl, originalFilename: filename }),
    });
    const data = await response.json();
    setResult(response.ok ? `Imported ${data.imported}, duplicates ${data.duplicate}, failed ${data.failed}` : (data.error ?? "Import failed"));
    setBusy(false);
  }

  return (
    <>
      <h1>Bulk import</h1>
      <p style={{ color: "var(--muted)" }}>CSV, JSON, or GitHub raw URLs. Records import as drafts after validation.</p>
      <div className={styles.form}>
        <label>
          Source type
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value as "csv" | "json" | "github")}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="github">GitHub raw URL</option>
          </select>
        </label>
        {sourceType === "github" ? (
          <label>GitHub raw URL<input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://raw.githubusercontent.com/..." /></label>
        ) : (
          <>
            <label>Upload file<input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => e.target.files?.[0] && void loadFile(e.target.files[0])} /></label>
            <label>Paste content<textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} /></label>
          </>
        )}
        <div className={styles.actions}>
          <button className={styles.btnGhost} type="button" disabled={busy} onClick={runPreview}>Preview</button>
          <button className={styles.btn} type="button" disabled={busy || !preview} onClick={runImport}>Import drafts</button>
        </div>
        {preview && (
          <div className={styles.card}>
            <span>Preview summary</span>
            <strong>{preview.summary.valid} valid · {preview.summary.duplicate} duplicate · {preview.summary.invalid} invalid</strong>
          </div>
        )}
        {result && <p role="status">{result}</p>}
      </div>
    </>
  );
}
