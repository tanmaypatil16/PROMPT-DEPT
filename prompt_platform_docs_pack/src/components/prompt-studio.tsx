"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { promptCategories } from "@/data/prompts";
import "./home-experience.module.css";

const studioCategories = promptCategories.filter((category) => category !== "All");
const studioFormats = ["Detailed creative brief", "Image-generation prompt", "Website concept", "Step-by-step plan", "Study guide"];

export function PromptStudio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [studioCategory, setStudioCategory] = useState<(typeof studioCategories)[number]>("Image");
  const [studioFormat, setStudioFormat] = useState(studioFormats[0]);
  const [studioResult, setStudioResult] = useState("");
  const [studioNotice, setStudioNotice] = useState("");
  const [studioError, setStudioError] = useState<string | null>(null);
  const [studioCopyError, setStudioCopyError] = useState<string | null>(null);
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioCopied, setStudioCopied] = useState(false);

  async function copyText(text: string) {
    setStudioCopyError(null);
    try {
      await navigator.clipboard.writeText(text);
      setStudioCopied(true);
      window.setTimeout(() => setStudioCopied(false), 2200);
    } catch {
      setStudioCopyError("Clipboard access is unavailable. Select and copy the prompt manually.");
    }
  }

  async function generatePrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudioLoading(true);
    setStudioError(null);
    setStudioCopyError(null);
    setStudioResult("");
    try {
      const response = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, category: studioCategory, format: studioFormat }),
      });
      const data = await response.json() as { prompt?: string; error?: string; notice?: string };
      if (!response.ok || !data.prompt) {
        throw new Error(data.error ?? "Prompt Studio could not generate a draft.");
      }
      setStudioResult(data.prompt);
      setStudioNotice(data.notice ?? "");
    } catch (error) {
      setStudioError(error instanceof Error ? error.message : "Prompt Studio could not generate a draft.");
    } finally {
      setStudioLoading(false);
    }
  }

  return (
    <main id="top" className="studio-page">
      <a className="skip-link" href="#studio-content">Skip to content</a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Prompt Dept home">PROMPT<span>/</span>DEPT.</Link>
        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="studio-navigation"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <nav
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          id="studio-navigation"
          aria-label="Primary navigation"
        >
          <Link href="/#gallery" onClick={() => setMenuOpen(false)}>Explore</Link>
          <Link href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link href="/studio" aria-current="page" onClick={() => setMenuOpen(false)}>Prompt Studio</Link>
        </nav>
        <Link className="nav-cta" href="/#gallery">Explore prompts <ArrowUpRight aria-hidden="true" /></Link>
      </header>

      <section className="studio-section studio-page-section" id="studio-content" aria-labelledby="studio-title">
        <div className="studio-copy">
          <p className="eyebrow">Prompt Studio</p>
          <h1 id="studio-title">Start with an idea.<br /><span>Leave with a prompt.</span></h1>
          <p>Describe what you want to make, choose a direction, and get an editable prompt draft.</p>
          <Link href="/#gallery">Browse creative prompts <ArrowRight aria-hidden="true" /></Link>
        </div>
        <form className="studio-preview" onSubmit={generatePrompt}>
          <div className="studio-bar"><span /><span /><span /><p>Prompt Studio</p></div>
          <div className="studio-body">
            <label className="mono-label" htmlFor="studio-idea">What do you want to create?</label>
            <textarea
              id="studio-idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="A cinematic landing page for a neighborhood coffee shop..."
              maxLength={1200}
              required
              minLength={8}
            />
            <div className="studio-options">
              <label className="studio-option" htmlFor="studio-category">
                Category
                <select
                  id="studio-category"
                  value={studioCategory}
                  onChange={(event) => {
                    const selected = studioCategories.find((item) => item === event.target.value);
                    if (selected) setStudioCategory(selected);
                  }}
                >
                  {studioCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="studio-option" htmlFor="studio-format">
                Output type
                <select id="studio-format" value={studioFormat} onChange={(event) => setStudioFormat(event.target.value)}>
                  {studioFormats.map((format) => <option key={format} value={format}>{format}</option>)}
                </select>
              </label>
            </div>
            <button className="studio-submit" type="submit" disabled={studioLoading}>
              {studioLoading ? "Building draft…" : "Build prompt"}
            </button>
            {studioError && <p className="copy-error" role="alert">{studioError}</p>}
            {studioResult && (
              <div className="prompt-output">
                <span className="mono-label">Editable prompt draft</span>
                <textarea
                  aria-label="Editable generated prompt"
                  value={studioResult}
                  onChange={(event) => setStudioResult(event.target.value)}
                />
                <button type="button" onClick={() => void copyText(studioResult)}>
                  {studioCopied ? "Copied" : "Copy prompt"}
                </button>
                {studioCopyError && <p className="copy-error" role="alert">{studioCopyError}</p>}
                <span className="draft-label">{studioNotice}</span>
              </div>
            )}
          </div>
        </form>
      </section>

      <footer className="site-footer" id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link className="wordmark" href="/">PROMPT<span>/</span>DEPT.</Link>
            <p>Good prompts are a place to begin.<br />Find a direction worth following.</p>
          </div>
          <div className="footer-links">
            <div><span>Discover</span><Link href="/#gallery">Prompt gallery</Link><Link href="/#how-it-works">How it works</Link></div>
            <div><span>Create</span><Link href="/studio">Prompt Studio</Link><a href="#top">Back to top</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>PROMPT/DEPT. — A creative prompt library</span>
          <Link href="/">Return home <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </footer>
    </main>
  );
}
