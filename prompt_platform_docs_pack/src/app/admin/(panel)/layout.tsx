import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import styles from "../admin.module.css";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session.user) {
    redirect("/admin/login?next=%2Fadmin");
  }
  if (session.status === "unavailable") {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <h1>Administrator access could not be verified</h1>
          <p className={styles.error} role="alert">
            We couldn’t load your account profile. Please try again later or ask the project
            administrator to check the server logs and Supabase configuration.
          </p>
        </section>
      </main>
    );
  }
  if (session.status === "missing") {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <h1>Account profile not found</h1>
          <p className={styles.error} role="alert">
            Your signed-in Supabase account has no matching profile. Ask the project
            administrator to verify profile provisioning before granting admin access.
          </p>
        </section>
      </main>
    );
  }
  if (session.profile.role !== "admin" || session.profile.account_status !== "active") {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginCard}>
          <h1>Administrator access required</h1>
          <p className={styles.error} role="alert">
            You’re signed in, but this account is not an active administrator. Ask the project
            owner to grant administrator access, then sign in again.
          </p>
          <Link href="/">Return to the public site</Link>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className="wordmark" href="/admin">PROMPT<span>/</span>DEPT. Admin</Link>
        <nav className={styles.nav} aria-label="Admin navigation">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/prompts">Prompts</Link>
          <Link href="/admin/import">Import</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/">Public site</Link>
        </nav>
      </header>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
