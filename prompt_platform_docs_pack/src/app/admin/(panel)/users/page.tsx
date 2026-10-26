"use client";

import { useEffect, useState } from "react";
import styles from "../../admin.module.css";

type UserRow = {
  id: string;
  display_name: string | null;
  role: string;
  account_status: string;
  created_at: string;
  last_active_at: string | null;
  likes: number;
  saves: number;
  studioUsage: number;
  subscriptionStatus: string;
  planName: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d: { users: UserRow[] }) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function suspend(userId: string) {
    if (!confirm("Suspend this account?")) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, account_status: "suspended" }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, account_status: "suspended" } : u)));
  }

  async function activate(userId: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, account_status: "active" }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, account_status: "active" } : u)));
  }

  return (
    <>
      <h1>Users</h1>
      <p style={{ color: "var(--muted)" }}>Paginated account overview. Email lookup requires Supabase Auth admin API (not exposed here).</p>
      {loading ? <p>Loading…</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Display name</th><th>Role</th><th>Status</th><th>Joined</th><th>Likes</th><th>Saves</th><th>Studio</th><th>Subscription</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name ?? u.id.slice(0, 8)}</td>
                  <td>{u.role}</td>
                  <td>{u.account_status}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>{u.likes}</td>
                  <td>{u.saves}</td>
                  <td>{u.studioUsage}</td>
                  <td>{u.planName ?? u.subscriptionStatus}</td>
                  <td>
                    {u.account_status === "active" ? (
                      <button type="button" className={styles.btnGhost} onClick={() => suspend(u.id)}>Suspend</button>
                    ) : (
                      <button type="button" className={styles.btnGhost} onClick={() => activate(u.id)}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
