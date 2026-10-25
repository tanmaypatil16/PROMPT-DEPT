"use client";

import Image from "next/image";
import { Bookmark, Check, Heart, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { PromptSample } from "@/data/prompts";

const SAVED_KEY = "prompt-dept:saved-prompts";
const SAVED_EVENT = "prompt-dept:saved-prompts-updated";

function getSavedIds(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function subscribeToSavedPrompts(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SAVED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SAVED_EVENT, onChange);
  };
}

export function PromptCard({ prompt }: { prompt: PromptSample }) {
  const [liked, setLiked] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "shared" | "error">("idle");
  const [saveError, setSaveError] = useState(false);
  const saved = useSyncExternalStore(
    subscribeToSavedPrompts,
    () => getSavedIds().includes(prompt.id),
    () => false,
  );

  function toggleSaved() {
    setSaveError(false);
    try {
      const ids = getSavedIds();
      const next = saved ? ids.filter((id) => id !== prompt.id) : [...new Set([...ids, prompt.id])];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {
      setSaveError(true);
    }
  }

  async function sharePrompt() {
    const url = `${window.location.origin}/prompts/${prompt.id}`;
    try {
      if (navigator.share) await navigator.share({ title: prompt.title, text: prompt.description, url });
      else await navigator.clipboard.writeText(url);
      setShareState("shared");
      window.setTimeout(() => setShareState("idle"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareState("shared");
        window.setTimeout(() => setShareState("idle"), 2200);
      } catch {
        setShareState("error");
        window.setTimeout(() => setShareState("idle"), 2600);
      }
    }
  }

  return (
    <article className={`prompt-card ${prompt.aspect}`}>
      <Image
        className="card-artwork"
        src={prompt.image}
        alt=""
        fill
        sizes="(max-width: 520px) 100vw, (max-width: 860px) 50vw, 25vw"
        unoptimized
      />
      <a className="card-image-link" href={`/prompts/${prompt.id}`} aria-label={`View ${prompt.title}`}>
        <span className="card-category">{prompt.category}</span>
        <span className="card-title">{prompt.title}</span>
      </a>
      <div className="card-actions" aria-label={`Actions for ${prompt.title}`}>
        <button
          className={liked ? "is-liked" : ""}
          type="button"
          aria-label={liked ? `Unlike ${prompt.title}` : `Like ${prompt.title}`}
          aria-pressed={liked}
          onClick={() => setLiked((current) => !current)}
        >
          <Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} />
        </button>
        <button
          className={shareState === "shared" ? "is-shared" : ""}
          type="button"
          aria-label={`Share ${prompt.title}`}
          onClick={sharePrompt}
        >
          {shareState === "shared" ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        </button>
        <button
          className={saved ? "is-saved" : ""}
          type="button"
          aria-label={saved ? `Remove ${prompt.title} from saved prompts` : `Save ${prompt.title}`}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {(shareState === "error" || saveError) && (
        <p className="card-feedback" role="status">
          {saveError ? "Could not save this prompt in this browser." : "Could not share this prompt."}
        </p>
      )}
    </article>
  );
}
