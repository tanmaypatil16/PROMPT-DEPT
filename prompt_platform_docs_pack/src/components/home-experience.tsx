"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Menu, Search, X } from "lucide-react";
import { promptCategories, promptSamples, type PromptSample } from "@/data/prompts";
import "./home-experience.module.css";
import { PromptCard } from "./prompt-card";

const showcasePrompts = promptSamples.filter((prompt) =>
  ["a-world-in-motion", "architecture-in-between", "editorial-product-photography"].includes(prompt.id),
);

function HeroObjects() {
  return (
    <div className="hero-objects" aria-hidden="true">
      <svg className="hero-object hero-object-lime" viewBox="0 0 120 120" focusable="false">
        <defs>
          <linearGradient id="lime-inflatable" x1="20" y1="12" x2="98" y2="108" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E5FF7A" />
            <stop offset=".42" stopColor="#A3E635" />
            <stop offset="1" stopColor="#4D9A11" />
          </linearGradient>
        </defs>
        <path d="M42 13c0-8 6-13 14-13s14 5 14 13v29h29c8 0 13 6 13 14s-5 14-13 14H70v29c0 8-6 13-14 13s-14-5-14-13V70H13C5 70 0 64 0 56s5-14 13-14h29V13Z" fill="url(#lime-inflatable)" stroke="#D5FF76" strokeWidth="2" />
        <path d="M48 13c0-4 3-7 7-7M73 48h24M48 73v24M13 48h23" fill="none" stroke="#F2FFC5" strokeLinecap="round" strokeOpacity=".85" strokeWidth="4" />
        <ellipse cx="34" cy="28" fill="#fff" fillOpacity=".34" rx="8" ry="3" transform="rotate(-48 34 28)" />
      </svg>

      <svg className="hero-object hero-object-chrome" viewBox="0 0 160 160" focusable="false">
        <defs>
          <linearGradient id="chrome-star" x1="35" y1="18" x2="119" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset=".2" stopColor="#8E9BA6" />
            <stop offset=".38" stopColor="#F8FBFF" />
            <stop offset=".58" stopColor="#697784" />
            <stop offset=".76" stopColor="#F5F8FA" />
            <stop offset="1" stopColor="#697581" />
          </linearGradient>
        </defs>
        <path d="m80 8 17 48 51 4-39 33 13 51-42-29-43 29 14-51-40-33 52-4L80 8Z" fill="url(#chrome-star)" stroke="#EEF3F7" strokeWidth="2" strokeLinejoin="round" />
        <path d="m80 8 0 78 17-30M80 86l-43 58 43-29 42 29-42-58 56-26-56 4L80 8Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="67" cy="30" fill="#fff" fillOpacity=".8" rx="8" ry="3" transform="rotate(-68 67 30)" />
      </svg>

      <svg className="hero-object hero-object-glass" viewBox="0 0 160 150" focusable="false">
        <defs>
          <linearGradient id="glass-blue" x1="25" y1="12" x2="139" y2="139" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DBF8FF" stopOpacity=".88" />
            <stop offset=".48" stopColor="#54C8FF" stopOpacity=".64" />
            <stop offset="1" stopColor="#225DFF" stopOpacity=".92" />
          </linearGradient>
          <linearGradient id="glass-edge" x1="25" y1="20" x2="130" y2="134" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#78DFFF" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <path d="M76 10c4-7 14-7 18 0l57 105c4 7-1 16-9 16H18c-8 0-13-9-9-16L66 10c2-4 6-6 10-6Z" fill="url(#glass-blue)" fillRule="evenodd" stroke="url(#glass-edge)" strokeWidth="3" />
        <path d="m77 26 45 82H34l43-82Z" fill="#080808" fillOpacity=".58" stroke="#E6FBFF" strokeOpacity=".72" strokeWidth="2" />
        <path d="m77 26 0 82M77 26l45 82M77 26l-43 82" fill="none" stroke="#fff" strokeOpacity=".46" strokeWidth="2" />
        <path d="M73 15 25 104" fill="none" stroke="#fff" strokeLinecap="round" strokeOpacity=".78" strokeWidth="4" />
      </svg>

      <svg className="hero-object hero-object-arrow" viewBox="0 0 140 100" focusable="false">
        <defs>
          <linearGradient id="pink-inflatable" x1="20" y1="85" x2="115" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF73C8" />
            <stop offset=".48" stopColor="#FF3E9D" />
            <stop offset="1" stopColor="#FFB1E0" />
          </linearGradient>
        </defs>
        <path d="M18 78h44V48h54L91 23l25 25-25 25" fill="none" stroke="#A31664" strokeLinecap="round" strokeLinejoin="round" strokeWidth="25" transform="translate(4 5)" />
        <path d="M18 78h44V48h54L91 23l25 25-25 25" fill="none" stroke="url(#pink-inflatable)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="21" />
        <path d="M24 73h31V47" fill="none" stroke="#FFD0EA" strokeLinecap="round" strokeOpacity=".8" strokeWidth="4" />
      </svg>
      <span className="hero-object-label hero-object-label-style">STYLE</span>
      <span className="hero-object-label hero-object-label-output">OUTPUT</span>
    </div>
  );
}

export function HomeExperience() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof promptCategories)[number]>("All");
  const [retryCount, setRetryCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptSample[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoadingPrompts(true);
        setLoadError(null);
      }
    });

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);

    fetch(`/api/prompts?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Prompt library is unavailable.");
        return response.json() as Promise<{ prompts: PromptSample[] }>;
      })
      .then((data) => setPrompts(data.prompts))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setLoadError("Could not load the prompt library. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingPrompts(false);
      });

    return () => controller.abort();
  }, [category, query, retryCount]);

  function showGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main id="top">
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Prompt Dept home">PROMPT<span>/</span>DEPT.</a>
        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <nav
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          id="main-navigation"
          aria-label="Primary navigation"
        >
          <a href="#gallery" onClick={closeMenu}>Explore</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="/studio" onClick={closeMenu}>Prompt Studio</a>
        </nav>
        <a className="nav-cta" href="/studio">Build a prompt <ArrowUpRight aria-hidden="true" /></a>
      </header>

      <section className="hero" id="content" aria-labelledby="hero-title">
        <HeroObjects />
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">The creative prompt library</p>
            <h1 id="hero-title">Find the prompt.<br /><span>Make something unreal.</span></h1>
            <div className="hero-bottom">
              <p>Discover creative prompts, explore new styles, and turn your ideas into better outputs.</p>
              <form className="hero-search" onSubmit={showGallery} role="search">
                <label htmlFor="prompt-search">Search the prompt gallery</label>
                <div>
                  <Search aria-hidden="true" />
                  <input
                    id="prompt-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="What do you want to create?"
                  />
                  <button type="submit" aria-label="Search prompts"><ArrowRight aria-hidden="true" /></button>
                </div>
              </form>
            </div>
            <div className="hero-actions">
              <a href="#gallery">Explore prompts <ArrowRight aria-hidden="true" /></a>
              <a href="/studio">Build a prompt <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-section" id="gallery" aria-labelledby="gallery-title">
        <div className="section-intro">
          <h2 id="gallery-title">Made to make you make.</h2>
        </div>
        <div className="filters" aria-label="Prompt categories">
          {promptCategories.map((item) => (
            <button
              type="button"
              className={category === item ? "selected" : ""}
              key={item}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="result-count" aria-live="polite">
          {loadingPrompts ? "Loading prompts…" : `${prompts.length} ${prompts.length === 1 ? "prompt" : "prompts"}`}
        </p>
        {loadError && (
          <div className="empty-state" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
          </div>
        )}
        <div className="prompt-gallery" aria-busy={loadingPrompts}>
          {loadingPrompts
            ? Array.from({ length: 8 }, (_, index) => (
              <article className="prompt-skeleton" key={index} aria-hidden="true">
                <div className={`skeleton-image skeleton-image-${index % 3}`} />
                <div className="skeleton-lines"><span /><span /></div>
              </article>
            ))
            : prompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
        </div>
        {!loadingPrompts && !loadError && prompts.length === 0 && (
          <div className="empty-state">
            <p>No prompts match those filters.</p>
            <button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>
          </div>
        )}
      </section>

      <section className="visual-showcase" aria-labelledby="showcase-title">
        <div className="showcase-copy">
          <p className="eyebrow">A starting point for what’s next</p>
          <h2 id="showcase-title">The hard part isn’t making it.<br /><span>It’s finding the direction.</span></h2>
          <p>Explore different creative directions, bring your own references, and shape an idea into a prompt you can actually use.</p>
          <a href="#gallery">Find your direction <ArrowRight aria-hidden="true" /></a>
        </div>
        <div className="showcase-board" aria-label="Featured creative directions">
          {showcasePrompts.map((prompt, index) => (
            <a
              className={`showcase-tile showcase-tile-${index + 1}`}
              href={`/prompts/${prompt.id}`}
              key={prompt.id}
              aria-label={`Explore ${prompt.title}`}
            >
              <Image
                src={prompt.image}
                alt=""
                fill
                sizes="(max-width: 700px) 42vw, 30vw"
                unoptimized
              />
              <span>{prompt.category}</span>
              <strong>{prompt.title}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="steps-section" id="how-it-works" aria-labelledby="steps-title">
        <div className="steps-heading">
          <p className="eyebrow">A simpler creative process</p>
          <h2 id="steps-title">From first thought<br /><span>to something real.</span></h2>
          <p>Skip the blank page. Start with a direction, shape the details, and take your prompt wherever you create.</p>
        </div>
        <ol className="steps-grid">
          <li>
            <span className="step-number">01</span>
            <h3>Find a direction</h3>
            <p>Browse visual prompts across design, image-making, writing, study, and code.</p>
            <a href="#gallery">Explore the gallery <ArrowUpRight aria-hidden="true" /></a>
          </li>
          <li>
            <span className="step-number">02</span>
            <h3>Make it yours</h3>
            <p>Use a prompt as a base, then adapt its details to your goal and references.</p>
            <a href="#gallery">Pick a starting point <ArrowUpRight aria-hidden="true" /></a>
          </li>
          <li>
            <span className="step-number">03</span>
            <h3>Build what’s next</h3>
            <p>Turn a rough thought into an editable prompt draft in Prompt Studio.</p>
            <a href="/studio">Open Prompt Studio <ArrowUpRight aria-hidden="true" /></a>
          </li>
        </ol>
      </section>

      <footer className="site-footer" id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="wordmark" href="#top">PROMPT<span>/</span>DEPT.</a>
            <p>Good prompts are a place to begin.<br />Find a direction worth following.</p>
          </div>
          <div className="footer-links">
            <div><span>Discover</span><a href="#gallery">Prompt gallery</a><a href="#how-it-works">How it works</a></div>
            <div><span>Create</span><a href="/studio">Prompt Studio</a><a href="#top">Back to top</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span> PROMPT/DEPT. — A creative prompt library</span>
          <a href="#top">Made for curious minds <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </footer>
    </main>
  );
}
