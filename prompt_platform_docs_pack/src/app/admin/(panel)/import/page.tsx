"use client";

import { useMemo, useState } from "react";
import styles from "../../admin.module.css";

type ReviewAction = "approved" | "requires_review" | "excluded" | "rejected";

type ManifestReviewItem = {
  index: number;
  entryId?: string;
  title?: string;
  sourceRepository?: string;
  sourcePath?: string;
  sourceCommit?: string;
  sourceContentHash?: string;
  status?: string;
  licenseStatus?: string;
  reason?: string;
};

export default function AdminImportPage() {
  const [sourceType, setSourceType] = useState<"csv" | "json" | "github">("csv");
  const [content, setContent] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<{ summary: Record<string, number>; records: unknown[] } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manifestInput, setManifestInput] = useState(`[
  {
    "id": "siteprompt-demo-1",
    "sourceRepository": "im-286/siteprompt",
    "sourcePath": "prompts/example.md",
    "sourceCommit": "REPLACE_WITH_FULL_40_CHARACTER_COMMIT_SHA",
    "reviewedTitle": "Storytelling prompt",
    "reviewedDescription": "A short creative writing prompt.",
    "reviewedCategory": "Writing",
    "reviewedTags": ["story", "creative"],
    "licenseStatus": "review-pending",
    "status": "review-pending",
    "previewType": "placeholder"
  }
]`);
  const [manifestDryRun, setManifestDryRun] = useState<Record<string, unknown> | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const manifestReviewItems = useMemo<ManifestReviewItem[]>(() => {
    if (!manifestDryRun) return [];
    try {
      const parsed = JSON.parse(manifestInput);
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { entries?: unknown[] }).entries)
          ? (parsed as { entries: unknown[] }).entries
          : [];
      const aggregate = new Map<number, ManifestReviewItem>();
      entries.forEach((entry, index) => {
        if (!entry || typeof entry !== "object") return;
        const record = entry as Record<string, unknown>;
        aggregate.set(index, {
          index,
          entryId: typeof record.id === "string" ? record.id : undefined,
          title: typeof record.reviewedTitle === "string" ? record.reviewedTitle : undefined,
          sourceRepository: typeof record.sourceRepository === "string" ? record.sourceRepository : undefined,
          sourcePath: typeof record.sourcePath === "string" ? record.sourcePath : undefined,
          sourceCommit: typeof record.sourceCommit === "string" ? record.sourceCommit : undefined,
          sourceContentHash: typeof record.sourceContentHash === "string" ? record.sourceContentHash : undefined,
          status: typeof record.status === "string" ? record.status : undefined,
          licenseStatus: typeof record.licenseStatus === "string" ? record.licenseStatus : undefined,
          reason: typeof record.reviewNotes === "string" ? record.reviewNotes : undefined,
        });
      });
      return Array.from(aggregate.values()).slice(0, 50);
    } catch {
      return [];
    }
  }, [manifestDryRun, manifestInput]);

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

  async function runManifestReview() {
    setBusy(true);
    setReviewFeedback(null);
    try {
      const parsed = JSON.parse(manifestInput);
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as Record<string, unknown>).entries)) {
        setManifestDryRun(null);
        setReviewFeedback("Manifest JSON must be an object with an entries array.");
        setBusy(false);
        return;
      }

      const response = await fetch("/api/admin/import/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await response.json();
      if (!response.ok) {
        setManifestDryRun(null);
        setReviewFeedback(data.error ? JSON.stringify(data.error) : "Manifest review failed.");
      } else {
        setManifestDryRun(data);
        setReviewFeedback("Dry-run report loaded. Review each item before any import decision.");
      }
    } catch {
      setManifestDryRun(null);
      setReviewFeedback("Manifest JSON could not be parsed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitManifestDecision(item: ManifestReviewItem, decision: ReviewAction) {
    const raw = JSON.parse(manifestInput);
    const entry = Array.isArray(raw) ? raw[item.index] : Array.isArray(raw.entries) ? raw.entries[item.index] : null;
    if (!entry || typeof entry !== "object") {
      setReviewFeedback("The selected entry could not be found in the manifest.");
      return;
    }

    const source = entry as Record<string, unknown>;
    const rationale = decision === "approved"
      ? window.prompt("Record why this source may be approved for future review. This does not confirm redistribution rights.", "")
      : `Decision recorded as ${decision}; this is not a rights determination.`;
    if (rationale === null) return;

    const payload = {
      decisions: [{
        entryId: String(source.id ?? item.entryId ?? `index-${item.index}`),
        sourceRepository: String(source.sourceRepository ?? item.sourceRepository ?? ""),
        sourcePath: String(source.sourcePath ?? item.sourcePath ?? ""),
        sourceCommit: String(source.sourceCommit ?? ""),
        reviewStatus: decision,
        rationale,
      }],
    };

    const response = await fetch("/api/admin/import/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setReviewFeedback(response.ok
      ? `Review state saved as ${data.reviewStatus} for ${payload.decisions[0].entryId}.${data.rightsIndependentlyVerified === false ? " Rights were not independently verified." : ""}${data.message ? ` ${data.message}` : ""}`
      : (data.error ? JSON.stringify(data.error) : "Review decision failed."));
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

      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <h2>Manifest dry-run review</h2>
        <p style={{ color: "var(--muted)" }}>
          Review-only workflow. Decisions are bound to a server-fetched, commit-pinned source hash from im-286/siteprompt (full 40-character commit SHA required). An approval records a human review decision only; it does not verify redistribution rights or enable import.
        </p>
        <label>
          Manifest JSON
          <textarea value={manifestInput} onChange={(e) => setManifestInput(e.target.value)} rows={12} style={{ width: "100%" }} />
        </label>
        <div className={styles.actions}>
          <button className={styles.btnGhost} type="button" disabled={busy} onClick={runManifestReview}>Review manifest</button>
        </div>
        {manifestDryRun && (
          <div className={styles.card} style={{ marginTop: "1rem" }}>
            <strong>Dry-run summary</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", marginTop: "0.75rem" }}>
              {Object.entries((manifestDryRun.summary ?? {}) as Record<string, number>).map(([key, value]) => (
                <div key={key} style={{ padding: "0.5rem 0.75rem", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.5rem" }}>
                  <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>{key}</div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
        {manifestReviewItems.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {manifestReviewItems.map((item) => (
              <div key={`${item.index}-${item.entryId ?? "entry"}`} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <strong>{item.title ?? item.entryId ?? `Entry ${item.index}`}</strong>
                    <div style={{ color: "var(--muted)" }}>{item.sourceRepository ?? "unknown repo"} · {item.sourcePath ?? "unknown path"}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    Manifest: {item.status ?? "unknown"} / rights claim: {item.licenseStatus ?? "review-pending"} (unverified)
                  </div>
                </div>
                {item.reason && <p style={{ marginBottom: 0, color: "var(--muted)" }}>{item.reason}</p>}
                <div className={styles.actions} style={{ marginTop: "0.75rem" }}>
                  <button className={styles.btnGhost} type="button" onClick={() => void submitManifestDecision(item, "requires_review")}>Requires review</button>
                  <button className={styles.btnGhost} type="button" onClick={() => void submitManifestDecision(item, "excluded")}>Exclude</button>
                  <button className={styles.btn} type="button" onClick={() => void submitManifestDecision(item, "approved")}>Record review approval</button>
                  <button className={styles.btnGhost} type="button" onClick={() => void submitManifestDecision(item, "rejected")}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {reviewFeedback && <p role="status" style={{ marginTop: "1rem" }}>{reviewFeedback}</p>}
      </div>
    </>
  );
}
