"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import type { PromptSample } from "@/data/prompts";
import styles from "./page.module.css";

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const [prompt, setPrompt] = useState<PromptSample | null>(null);
  const [status, setStatus] = useState<"loading" | "missing" | "error" | "ready">("loading");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/prompts/${params.id}`, { signal: controller.signal }).then(async (response) => {
      if (response.status === 404) { setStatus("missing"); return; }
      if (!response.ok) throw new Error("Unable to load prompt");
      const data = await response.json() as { prompt: PromptSample };
      setPrompt(data.prompt); setStatus("ready");
    }).catch((error: unknown) => { if (!(error instanceof Error) || error.name !== "AbortError") setStatus("error"); });
    return () => controller.abort();
  }, [params.id]);

  async function copyPrompt() {
    if (!prompt) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Clipboard access is unavailable. Select and copy the prompt manually.");
    }
  }

  if (status === "loading") return <main className={styles.page}><p className={styles.status}>Loading prompt…</p></main>;
  if (status !== "ready" || !prompt) return <main className={styles.page}><div className={styles.status}><h1>{status === "missing" ? "Prompt not found." : "Prompt unavailable."}</h1><Link href="/">Return to the library <ArrowLeft aria-hidden="true" /></Link></div></main>;

  return <main className={styles.page}>
    <header className={styles.header}><Link className="wordmark" href="/">PROMPT<span>/</span>DEPT.</Link><Link className={styles.back} href="/"><ArrowLeft aria-hidden="true" /> Back to library</Link></header>
    <article className={styles.detail}>
      <div className={styles.artwork}><Image src={prompt.image} alt={prompt.title} fill priority sizes="(max-width: 760px) 100vw, 45vw" unoptimized /></div>
      <div className={styles.copy}><p className="eyebrow">{prompt.category}</p><h1>{prompt.title}</h1><p className={styles.description}>{prompt.description}</p><div className={styles.tags}>{prompt.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><section className={styles.promptText} aria-labelledby="prompt-text-title"><p className="mono-label" id="prompt-text-title">Reusable prompt</p><p>{prompt.prompt}</p><button type="button" onClick={copyPrompt}>{copied ? <><Check aria-hidden="true" /> Copied</> : <><Copy aria-hidden="true" /> Copy prompt</>}</button>{copyError && <p className={styles.copyError} role="alert">{copyError}</p>}</section><p className={styles.note}>Local sample prompt. Copy it into the AI tool of your choice and adapt it to your project.</p></div>
    </article>
  </main>;
}
