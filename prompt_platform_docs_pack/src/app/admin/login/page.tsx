"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import styles from "../admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).");
      setLoading(false);
      return;
    }
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) {
      setError(signInError?.message ?? "Sign-in did not establish a session. Please try again.");
      setLoading(false);
      return;
    }
    router.replace(next);
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <p className="eyebrow">Administrator access</p>
        <h1>Sign in</h1>
        <p style={{ color: "var(--muted)" }}>Use a Supabase Auth account that has been promoted to administrator.</p>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.btn} type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
