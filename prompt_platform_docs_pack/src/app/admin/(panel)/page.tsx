import { DashboardClient } from "@/components/admin/dashboard-client";

export default function AdminDashboardPage() {
  return (
    <>
      <h1>Dashboard</h1>
      <p style={{ color: "var(--muted)" }}>Metrics from stored analytics and catalog data. Select 7, 30, or 90 days.</p>
      <DashboardClient />
    </>
  );
}
